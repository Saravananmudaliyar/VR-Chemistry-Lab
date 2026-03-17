from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException
from fastapi.middleware.cors import CORSMiddleware
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
        # Correct path to your dataset
        dataset_path = os.path.join(
            os.path.dirname(__file__),
            "..",
            "data",
            "reactions.json"
        )

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

        raise HTTPException(
            status_code=500,
            detail=str(e)
        )

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

# Reset experiment
@app.post("/reset")
async def reset_experiment():

    experiment_state.reset()

    return {
        "success": True,
        "message": "Experiment reset"
    }

# Health check
@app.get("/health")
async def health_check():
    return {"status": "healthy"}

# Run server
if __name__ == "__main__":
    uvicorn.run(
        "server:app",
        host="0.0.0.0",
        port=8000,
        reload=True
    )
