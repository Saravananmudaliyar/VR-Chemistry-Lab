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
            if not current_chemicals:
                return {"reaction_occurred": False}

            sorted_chems = sorted(current_chemicals)
            keys = []
            
            # 1. Try full combo
            keys.append("+".join(sorted_chems))
            
            # 2. Try pairs if >= 3
            if len(sorted_chems) >= 3:
                for i in range(len(sorted_chems)):
                    for j in range(i+1, len(sorted_chems)):
                        keys.append(f"{sorted_chems[i]}+{sorted_chems[j]}")
                        
            # 3. Try singles if exactly 1
            if len(sorted_chems) == 1:
                keys.append(sorted_chems[0])
                
            reactions_dict = self.reactions.get("reactions", {})
            if not reactions_dict and type(self.reactions) is dict:
                 # fallback if self.reactions IS the reactions dict
                 if "HCl" in self.reactions:
                     reactions_dict = self.reactions

            for k in keys:
                if k in reactions_dict:
                    rxn_data = dict(reactions_dict[k])
                    rxn_data["reaction_occurred"] = True
                    return rxn_data
                    
            # Default
            default_rxn = dict(reactions_dict.get("DEFAULT", {}))
            default_rxn["reaction_occurred"] = False
            return default_rxn
            
        except Exception as e:
            print(f"Reaction check error: {str(e)}")
            return {"reaction_occurred": False}