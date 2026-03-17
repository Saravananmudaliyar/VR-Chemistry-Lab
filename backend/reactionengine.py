from typing import Dict, List, Any, Tuple
import itertools
from collections import Counter

class ReactionEngine:
    def __init__(self):
        self.reactions: Dict[str, Any] = {}
    
    def set_dataset(self, reactions: Dict[str, Any]):
        """Set reaction dataset"""
        self.reactions = reactions
    
    def check_reaction(self, current_chemicals: List[str]) -> Dict[str, Any]:
        """Check if current chemicals form a valid reaction"""
        try:
            # Check all possible reaction combinations
            for reaction_id, reaction_data in self.reactions.items():
                required_reactants = reaction_data.get("reactants", [])
                
                # Check if all required reactants are present
                available_reactants = [c for c in required_reactants if c in current_chemicals]
                
                if len(available_reactants) == len(required_reactants):
                    # Reaction can occur!
                    products = reaction_data.get("products", [])
                    reaction_type = reaction_data.get("type", "unknown")
                    
                    return {
                        "reaction_occurred": True,
                        "reaction_id": reaction_id,
                        "reactants": required_reactants,
                        "products": products,
                        "type": reaction_type,
                        "conditions": reaction_data.get("conditions", {}),
                        "effects": reaction_data.get("effects", [])
                    }
            
            return {"reaction_occurred": False}
            
        except Exception as e:
            print(f"Reaction check error: {str(e)}")
            return {"reaction_occurred": False}