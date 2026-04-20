from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
import uvicorn
import asyncio
import json
import logging
import os
from typing import List, Dict, Any

from voiceassistant import VoiceAssistant
from experiment_state import ExperimentState
from reactionengine import ReactionEngine
from dataset_loader import DatasetLoader
from explanation_engine import ExplanationEngine
from command_parser import CommandParser

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="VR Chemistry Lab Backend", version="1.0.0")

# Enable frontend access
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# System managers
dataset_loader = DatasetLoader()
experiment_state = ExperimentState()
reaction_engine = ReactionEngine()
explanation_engine = ExplanationEngine()
command_parser = CommandParser()
voice_assistant = VoiceAssistant()

# Request schema
class CommandRequest(BaseModel):
    text: str
    user_id: str = "default"

# Response schema
class ActionResponse(BaseModel):
    action: str
    chemicals: List[str] = []
    products: List[str] = []
    explanation: str = ""
    observable_effects: List[str] = []
    state: Dict[str, Any] = {}
    success: bool = True
    message: str = ""

# Startup
@app.on_event("startup")
async def startup_event():
    try:
        # Resolve path to the data folder
        base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        dataset_path = os.path.join(base_dir, "data", "reactions.json")

        logger.info(f"Loading reaction dataset from {dataset_path}")

        # Load dataset
        await dataset_loader.load_dataset(dataset_path)
        reactions = dataset_loader.get_reactions()

        # Pass dataset to systems
        reaction_engine.set_dataset(reactions)
        explanation_engine.set_dataset(reactions)

        logger.info(f"Loaded {len(reactions)} reactions successfully")
    except Exception as e:
        logger.error(f"Startup error: {str(e)}")

# Command processing
@app.post("/command", response_model=ActionResponse)
async def process_command(cmd: CommandRequest):
    try:
        # Parse natural language
        parsed = command_parser.parse(cmd.text)

        # Execute experiment action
        await experiment_state.execute_action(
            parsed["action"],
            parsed.get("params", {})
        )

        # Check reactions using dataset
        reaction_result = reaction_engine.check_reaction(
            experiment_state.get_chemicals()
        )

        response = ActionResponse(
            action="command_executed",
            state=experiment_state.get_state(),
            success=True,
            message="Command executed"
        )

        # If dataset reaction occurs
        if reaction_result and reaction_result.get("reaction_occurred"):
            explanation = explanation_engine.generate_explanation(reaction_result)

            response.action = "reaction_started"
            response.chemicals = reaction_result.get("reactants", [])
            response.products = reaction_result.get("products", [])
            response.explanation = explanation.get("narrative", "")
            response.observable_effects = explanation.get("effects", [])

            # Voice explanation
            asyncio.create_task(
                voice_assistant.speak(explanation.get("narrative", ""))
            )

        return response
    except Exception as e:
        logger.error(f"Command error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# Websocket for VR voice interaction
@app.websocket("/ws/voice")
async def websocket_voice_endpoint(websocket: WebSocket):
    await websocket.accept()
    try:
        while True:
            data = await websocket.receive_text()
            cmd = CommandRequest(**json.loads(data))
            response = await process_command(cmd)
            await websocket.send_json(response.dict())
    except WebSocketDisconnect:
        logger.info("VR client disconnected")

# Get experiment state
@app.get("/state")
async def get_state():
    return experiment_state.get_state()

# New: React endpoint
class ReactRequest(BaseModel):
    chemicals: List[str]

@app.post("/react")
async def process_reaction(req: ReactRequest):
    try:
        reaction_result = reaction_engine.check_reaction(req.chemicals)
        if reaction_result and reaction_result.get("reaction_occurred"):
            return reaction_result
        else:
            return {"reaction_occurred": False, "message": "No specific reaction detected."}
    except Exception as e:
        logger.error(f"React error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/dataset")
async def get_dataset():
    """Return the entire dataset so the frontend can populate the shelf."""
    try:
        base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        dataset_path = os.path.join(base_dir, "data", "reactions.json")
        with open(dataset_path, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception as e:
        logger.error(f"Dataset error: {str(e)}")
        raise HTTPException(status_code=500, detail="Could not load dataset")

# Reset experiment
@app.post("/reset")
async def reset_experiment():
    experiment_state.reset()
    return {"success": True, "message": "Experiment reset"}

# Health check
@app.get("/health")
async def health_check():
    return {"status": "healthy"}

# --- FRONTEND MOUNTING ---
# This serves your index.html and assets from the frontend folder
try:
    # Adjust directory path to find the 'frontend' folder relative to this file
    frontend_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "frontend")
    app.mount("/", StaticFiles(directory=frontend_path, html=True), name="frontend")
    logger.info(f"Frontend successfully mounted from {frontend_path}")
except Exception as e:
    logger.error(f"Failed to mount frontend: {e}")

# Run server
if __name__ == "__main__":
    uvicorn.run(
        "server:app",
        host="0.0.0.0",
        port=8000,
        reload=True
    )
