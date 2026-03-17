import json
import logging

logger = logging.getLogger(__name__)

class DatasetLoader:

    def __init__(self):
        self.reactions = []

    async def load_dataset(self, dataset_path: str):
        try:
            with open(dataset_path, "r", encoding="utf-8") as f:
                data = json.load(f)

            self.reactions = data
            logger.info(f"Loaded {len(self.reactions)} reactions from dataset")

        except Exception as e:
            logger.error(f"Failed to load dataset: {e}")
            raise

    def get_reactions(self):
        return self.reactions