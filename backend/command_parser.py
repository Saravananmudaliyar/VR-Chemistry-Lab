import re
from typing import Dict, Any, Tuple
from enum import Enum
import logging

logger = logging.getLogger(__name__)

class Intent(Enum):
    ADD_CHEMICAL = "add_chemical"
    REMOVE_CHEMICAL = "remove_chemical"
    HEAT = "heat"
    COOL = "cool"
    STIR = "stir"
    RESET = "reset"
    QUERY_STATE = "query_state"
    HELP = "help"

class CommandParser:
    def __init__(self):
        self.chemical_patterns = {
            r'\b(sodium chloride|NaCl|salt)\b': 'NaCl',
            r'\b(sodium hydroxide|NaOH)\b': 'NaOH',
            r'\b(hydrochloric acid|HCl)\b': 'HCl',
            r'\b(silver nitrate|AgNO3)\b': 'AgNO3',
            r'\b(potassium chloride|KCl)\b': 'KCl',
            # Add more chemical patterns as needed
        }
    
    def parse(self, text: str) -> Dict[str, Any]:
        """Parse natural language into structured command"""
        text = text.lower().strip()
        
        # Detect intent
        intent = self._detect_intent(text)
        
        params = {}
        
        if intent == Intent.ADD_CHEMICAL:
            chemical = self._extract_chemical(text)
            if chemical:
                params["chemical"] = chemical
        
        elif intent == Intent.REMOVE_CHEMICAL:
            chemical = self._extract_chemical(text)
            if chemical:
                params["chemical"] = chemical
        
        return {
            "action": intent.value,
            "params": params,
            "confidence": 0.9  # Simplified confidence score
        }
    
    def _detect_intent(self, text: str) -> Intent:
        """Detect user intent from text"""
        if any(word in text for word in ['add', 'pour', 'put', 'drop', 'mix']):
            return Intent.ADD_CHEMICAL
        elif any(word in text for word in ['remove', 'take out', 'clear']):
            return Intent.REMOVE_CHEMICAL
        elif any(word in text for word in ['heat', 'warm', 'hot']):
            return Intent.HEAT
        elif any(word in text for word in ['cool', 'ice', 'cold']):
            return Intent.COOL
        elif any(word in text for word in ['stir', 'mix', 'swirl']):
            return Intent.STIR
        elif any(word in text for word in ['reset', 'clear', 'start over']):
            return Intent.RESET
        elif any(word in text for word in ['what', 'status', 'see']):
            return Intent.QUERY_STATE
        else:
            return Intent.HELP
    
    def _extract_chemical(self, text: str) -> str:
        """Extract chemical name from text"""
        for pattern, chemical in self.chemical_patterns.items():
            if re.search(pattern, text):
                return chemical
        return None