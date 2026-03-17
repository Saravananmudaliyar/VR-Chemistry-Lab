from typing import Dict, List, Any, Optional
import logging
from dataclasses import dataclass
from enum import Enum

logger = logging.getLogger(__name__)

class ActionType(str, Enum):
    ADD_CHEMICAL = "add_chemical"
    REMOVE_CHEMICAL = "remove_chemical"
    HEAT = "heat"
    COOL = "cool"
    STIR = "stir"
    RESET = "reset"

@dataclass
class ExperimentState:
    chemicals: List[str] = None
    temperature: float = None
    volume: float = None
    ph: float = None
    observations: List[str] = None
    
    def __post_init__(self):
        if self.chemicals is None:
            self.chemicals = []
        if self.observations is None:
            self.observations = []

class ExperimentStateManager:
    def __init__(self):
        self.state = ExperimentState()
        self.history: List[Dict[str, Any]] = []
    
    def get_state(self) -> Dict[str, Any]:
        return {
            "chemicals": self.state.chemicals.copy(),
            "temperature": self.state.temperature,
            "volume": self.state.volume,
            "ph": self.state.ph,
            "observations": self.state.observations.copy()
        }
    
    def get_chemicals(self) -> List[str]:
        return self.state.chemicals.copy()
    
    async def execute_action(self, action: str, params: Dict[str, Any]) -> Dict[str, Any]:
        """Execute experiment action and update state"""
        try:
            if action == ActionType.ADD_CHEMICAL:
                chemical = params.get("chemical")
                if chemical and chemical not in self.state.chemicals:
                    self.state.chemicals.append(chemical)
                    self.state.observations.append(f"Added {chemical}")
            
            elif action == ActionType.REMOVE_CHEMICAL:
                chemical = params.get("chemical")
                if chemical in self.state.chemicals:
                    self.state.chemicals.remove(chemical)
                    self.state.observations.append(f"Removed {chemical}")
            
            elif action == ActionType.HEAT:
                self.state.temperature = min(100.0, (self.state.temperature or 25.0) + 10.0)
                self.state.observations.append("Heating applied")
            
            elif action == ActionType.COOL:
                self.state.temperature = max(0.0, (self.state.temperature or 25.0) - 10.0)
                self.state.observations.append("Cooling applied")
            
            elif action == ActionType.STIR:
                self.state.observations.append("Solution stirred")
            
            elif action == ActionType.RESET:
                self.reset()
            
            # Log state change
            self.history.append(self.get_state())
            
            logger.info(f"Action executed: {action}, State: {len(self.state.chemicals)} chemicals")
            return {"success": True}
            
        except Exception as e:
            logger.error(f"Action execution failed: {str(e)}")
            return {"success": False, "error": str(e)}
    
    def reset(self):
        """Reset experiment to initial state"""
        self.state = ExperimentState()
        self.history = []
        logger.info("Experiment state reset")