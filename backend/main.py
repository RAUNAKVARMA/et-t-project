from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import os
import uuid
from datetime import datetime
from dotenv import load_dotenv

load_dotenv()

from app.rag_engine import RAGEngine
from app.vector_store import VectorStore
from app.knowledge_graph import KnowledgeGraphBuilder

app = FastAPI(title="Cosmic RAG API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

vector_store = VectorStore()
knowledge_graph = KnowledgeGraphBuilder()
rag_engine = RAGEngine(vector_store, knowledge_graph)

class ChatRequest(BaseModel):
    message: str

class ChatResponse(BaseModel):
    answer: str
    sources: Optional[List[dict]] = None

@app.post("/chat", response_model=ChatResponse)
def chat(request: ChatRequest):
    answer, sources = rag_engine.answer_query(request.message)
    return ChatResponse(answer=answer, sources=sources)

@app.post("/upload")
def upload_document(file: UploadFile = File(...)):
    try:
        content = file.file.read().decode('utf-8')
        doc_id = str(uuid.uuid4())
        chunks = rag_engine.chunk_document(content)
        vector_store.add_vectors(rag_engine.embed_chunks(chunks), [{'doc_id': doc_id, 'chunk_index': i} for i in range(len(chunks))], chunks)
        knowledge_graph.add_document(doc_id, content, chunks)
        return {"status": "success", "doc_id": doc_id, "chunks": len(chunks)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
