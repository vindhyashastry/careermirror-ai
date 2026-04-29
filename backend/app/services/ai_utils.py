import torch

_embedding_model = None

def get_embedding_model():
    """Lazy loads the embedding model to prevent startup crashes."""
    global _embedding_model
    if _embedding_model is None:
        try:
            # We import INSIDE the function so the server starts without touching the network
            from sentence_transformers import SentenceTransformer
            
            print("⏳ Loading AI Embedding Model (all-MiniLM-L6-v2)...")
            _embedding_model = SentenceTransformer("all-MiniLM-L6-v2")
            print("✅ Model Loaded successfully.")
        except Exception as e:
            print(f"❌ Error loading AI model: {e}")
            return None
    return _embedding_model
