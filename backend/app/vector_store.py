import numpy as np
import faiss
from typing import List, Dict, Optional
import pickle
import os

class VectorStore:
    def __init__(self, dimension: int = 384, index_path: str = "vector_index"):
        """Initialize vector store with FAISS"""
        self.dimension = dimension
        self.index_path = index_path
        self.index = faiss.IndexFlatL2(dimension)
        self.chunks_metadata = []
        self.chunk_texts = []
        self._load_index()

    def _load_index(self):
        """Load existing index from disk"""
        if os.path.exists(f"{self.index_path}.faiss"):
            try:
                self.index = faiss.read_index(f"{self.index_path}.faiss")
                with open(f"{self.index_path}.pkl", 'rb') as f:
                    data = pickle.load(f)
                    self.chunks_metadata = data['metadata']
                    self.chunk_texts = data['texts']
                print(f"Loaded index with {self.index.ntotal} vectors")
            except Exception as e:
                print(f"Error loading index: {e}")

    def _save_index(self):
        """Save index to disk"""
        try:
            faiss.write_index(self.index, f"{self.index_path}.faiss")
            with open(f"{self.index_path}.pkl", 'wb') as f:
                pickle.dump({'metadata': self.chunks_metadata, 'texts': self.chunk_texts}, f)
        except Exception as e:
            print(f"Error saving index: {e}")

    def add_vectors(self, vectors: np.ndarray, metadata: List[Dict], texts: List[str]):
        """Add vectors to vector store"""
        self.index.add(vectors)
        self.chunks_metadata.extend(metadata)
        self.chunk_texts.extend(texts)
        self._save_index()

    def search(self, query_vector: np.ndarray, top_k: int = 5):
        """Search for similar vectors"""
        D, I = self.index.search(query_vector, top_k)
        results = []
        for idx, dist in zip(I[0], D[0]):
            if idx < len(self.chunks_metadata):
                results.append({
                    'metadata': self.chunks_metadata[idx],
                    'text': self.chunk_texts[idx],
                    'score': float(dist)
                })
        return results
