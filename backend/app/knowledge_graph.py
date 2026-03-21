from typing import List, Dict, Set
import re
from collections import defaultdict, Counter

class KnowledgeGraphBuilder:
    def __init__(self):
        self.documents = {}
        self.entities = defaultdict(set)  # entity -> document_ids
        self.relationships = []  # (entity1, entity2, weight)
        self.entity_frequencies = Counter()

    def add_document(
        self,
        doc_id: str,
        text: str,
        chunks: List[str],
        name: str = "",
        file_type: str = "txt",
    ):
        self.documents[doc_id] = {
            'text': text,
            'chunks': chunks,
            'entities': set(),
            'name': name or doc_id,
            'file_type': file_type,
        }
        entities = self._extract_entities(text)
        for entity in entities:
            self.entities[entity].add(doc_id)
            self.documents[doc_id]['entities'].add(entity)
            self.entity_frequencies[entity] += 1
        self._build_relationships(entities)

    def _extract_entities(self, text: str) -> Set[str]:
        stopwords = {
            'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
            'of', 'with', 'by', 'from', 'as', 'is', 'was', 'are', 'were', 'been',
            'be', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would',
            'could', 'should', 'may', 'might', 'can', 'this', 'that', 'these', 'those',
        }
        words = re.findall(r'\b\w+\b', text.lower())
        entities = set(w for w in words if w not in stopwords and len(w) > 2)
        return entities

    def _build_relationships(self, entities: Set[str]):
        entity_list = list(entities)
        for i in range(len(entity_list)):
            for j in range(i + 1, len(entity_list)):
                self.relationships.append((entity_list[i], entity_list[j], 1))
