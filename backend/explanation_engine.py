from typing import Dict, List, Any
import logging

logger = logging.getLogger(__name__)

class ExplanationEngine:
    def __init__(self):
        self.reactions: Dict[str, Any] = {}
        self.templates = {
            "combination": "This is a {type} reaction where {reactants} combine to form {products}.",
            "decomposition": "This is a {type} reaction where {reactants} breaks down into {products}.",
            "displacement": "This is a {type} reaction. The more reactive {reactants[0]} displaces {reactants[1]} to form {products}.",
            "double_displacement": "This is a {type} reaction where ions exchange partners between {reactants} to form {products}."
        }
    
    def set_dataset(self, reactions: Dict[str, Any]):
        self.reactions = reactions
    
    def generate_explanation(self, reaction_data: Dict[str, Any]) -> Dict[str, str]:
        """Generate educational explanation for reaction"""
        try:
            reaction_id = reaction_data["reaction_id"]
            reaction_info = self.reactions.get(reaction_id, {})
            
            reactants = ", ".join(reaction_data["reactants"])
            products = ", ".join(reaction_data["products"])
            reaction_type = reaction_data["type"]
            
            # Generate narrative explanation
            template = self.templates.get(reaction_type, self.templates["combination"])
            narrative = template.format(
                type=reaction_type,
                reactants=reactants,
                products=products,
                **reaction_data
            )
            
            # Add scientific explanation
            science = reaction_info.get("explanation", "A chemical reaction is occurring based on the combination of reagents.")
            
            # Observable effects
            effects = reaction_info.get("effects", [])
            
            explanation = f"{narrative} {science}"
            
            return {
                "narrative": explanation,
                "scientific": science,
                "effects": effects,
                "type": reaction_type
            }
            
        except Exception as e:
            logger.error(f"Explanation generation failed: {str(e)}")
            return {
                "narrative": "A chemical reaction is occurring. Observe the changes in the solution.",
                "scientific": "Reaction detected based on chemical combination.",
                "effects": [],
                "type": "unknown"
            }