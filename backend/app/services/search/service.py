"""
🔍 Yasmin Elasticsearch Service
Full-text search across projects, agents, deployments, and messages
"""
import os
import json
from typing import Dict, List, Optional, Any
from dataclasses import dataclass, field
from datetime import datetime
from elasticsearch import Elasticsearch, helpers
from elasticsearch.exceptions import NotFoundError, ConnectionError


@dataclass
class SearchResult:
    id: str
    score: float
    source: Dict
    highlight: Dict = field(default_factory=dict)
    index: str = ""


@dataclass
class SearchQuery:
    query: str
    indices: List[str] = field(default_factory=lambda: ["projects", "agents", "deployments"])
    filters: Dict = field(default_factory=dict)
    sort_by: str = "_score"
    sort_order: str = "desc"
    page: int = 1
    per_page: int = 20
    aggs: Optional[Dict] = None


class ElasticsearchService:
    """Elasticsearch service for full-text search and analytics."""

    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            cls._instance._init_client()
        return cls._instance

    def _init_client(self):
        """Initialize Elasticsearch client."""
        hosts = os.getenv("ELASTICSEARCH_HOSTS", "http://localhost:9200").split(",")
        username = os.getenv("ELASTICSEARCH_USER", "elastic")
        password = os.getenv("ELASTICSEARCH_PASSWORD", "")

        self.client = Elasticsearch(
            hosts=hosts,
            basic_auth=(username, password) if password else None,
            retry_on_timeout=True,
            max_retries=3,
            timeout=30,
        )

        self.index_prefix = os.getenv("ELASTICSEARCH_INDEX_PREFIX", "yasmin")
        self._ensure_indices()

    def _index_name(self, name: str) -> str:
        """Get full index name with prefix."""
        return f"{self.index_prefix}_{name}"

    def _ensure_indices(self):
        """Create indices if they don't exist."""
        indices_config = {
            "projects": {
                "settings": {
                    "number_of_shards": 1,
                    "number_of_replicas": 1,
                    "analysis": {
                        "analyzer": {
                            "custom_analyzer": {
                                "type": "custom",
                                "tokenizer": "standard",
                                "filter": ["lowercase", "asciifolding", "word_delimiter"]
                            }
                        }
                    }
                },
                "mappings": {
                    "properties": {
                        "name": {"type": "text", "analyzer": "custom_analyzer", "fields": {"keyword": {"type": "keyword"}}},
                        "description": {"type": "text", "analyzer": "custom_analyzer"},
                        "type": {"type": "keyword"},
                        "status": {"type": "keyword"},
                        "owner_id": {"type": "keyword"},
                        "tags": {"type": "keyword"},
                        "created_at": {"type": "date"},
                        "updated_at": {"type": "date"},
                        "metadata": {"type": "object"}
                    }
                }
            },
            "agents": {
                "settings": {
                    "number_of_shards": 1,
                    "number_of_replicas": 1
                },
                "mappings": {
                    "properties": {
                        "name": {"type": "text", "analyzer": "custom_analyzer", "fields": {"keyword": {"type": "keyword"}}},
                        "role": {"type": "keyword"},
                        "status": {"type": "keyword"},
                        "project_id": {"type": "keyword"},
                        "capabilities": {"type": "keyword"},
                        "created_at": {"type": "date"},
                        "last_active": {"type": "date"}
                    }
                }
            },
            "deployments": {
                "settings": {
                    "number_of_shards": 1,
                    "number_of_replicas": 1
                },
                "mappings": {
                    "properties": {
                        "project_id": {"type": "keyword"},
                        "project_name": {"type": "text", "analyzer": "custom_analyzer"},
                        "status": {"type": "keyword"},
                        "environment": {"type": "keyword"},
                        "version": {"type": "keyword"},
                        "deployed_at": {"type": "date"},
                        "logs": {"type": "text"}
                    }
                }
            },
            "chat_messages": {
                "settings": {
                    "number_of_shards": 1,
                    "number_of_replicas": 1
                },
                "mappings": {
                    "properties": {
                        "room_id": {"type": "keyword"},
                        "sender_id": {"type": "keyword"},
                        "sender_name": {"type": "text"},
                        "content": {"type": "text", "analyzer": "custom_analyzer"},
                        "type": {"type": "keyword"},
                        "timestamp": {"type": "date"}
                    }
                }
            },
            "logs": {
                "settings": {
                    "number_of_shards": 2,
                    "number_of_replicas": 1
                },
                "mappings": {
                    "properties": {
                        "level": {"type": "keyword"},
                        "message": {"type": "text", "analyzer": "custom_analyzer"},
                        "service": {"type": "keyword"},
                        "trace_id": {"type": "keyword"},
                        "timestamp": {"type": "date"},
                        "metadata": {"type": "object"}
                    }
                }
            }
        }

        for index_name, config in indices_config.items():
            full_name = self._index_name(index_name)
            if not self.client.indices.exists(index=full_name):
                self.client.indices.create(index=full_name, body=config)
                print(f"Created index: {full_name}")

    def index_document(self, index: str, doc_id: str, document: Dict) -> bool:
        """Index a single document."""
        try:
            self.client.index(index=self._index_name(index), id=doc_id, document=document)
            return True
        except Exception as e:
            print(f"Index error: {e}")
            return False

    def bulk_index(self, index: str, documents: List[Dict]) -> Dict:
        """Bulk index documents."""
        actions = [
            {
                "_index": self._index_name(index),
                "_id": doc.get("id", str(i)),
                "_source": doc
            }
            for i, doc in enumerate(documents)
        ]

        return helpers.bulk(self.client, actions)

    def search(self, search_query: SearchQuery) -> Dict:
        """Execute a search query."""
        from_idx = (search_query.page - 1) * search_query.per_page

        # Build query
        must_clauses = []

        if search_query.query:
            must_clauses.append({
                "multi_match": {
                    "query": search_query.query,
                    "fields": ["name^3", "description^2", "content", "message", "tags"],
                    "type": "best_fields",
                    "fuzziness": "AUTO"
                }
            })

        # Add filters
        filter_clauses = []
        for field, value in search_query.filters.items():
            if isinstance(value, list):
                filter_clauses.append({"terms": {field: value}})
            else:
                filter_clauses.append({"term": {field: value}})

        query_body = {
            "bool": {
                "must": must_clauses if must_clauses else [{"match_all": {}}],
                "filter": filter_clauses
            }
        }

        body = {
            "query": query_body,
            "from": from_idx,
            "size": search_query.per_page,
            "sort": [{search_query.sort_by: {"order": search_query.sort_order}}],
            "highlight": {
                "fields": {
                    "name": {},
                    "description": {},
                    "content": {},
                    "message": {}
                }
            }
        }

        if search_query.aggs:
            body["aggs"] = search_query.aggs

        # Search across indices
        indices = ",".join([self._index_name(i) for i in search_query.indices])

        try:
            response = self.client.search(index=indices, body=body)

            results = []
            for hit in response["hits"]["hits"]:
                results.append(SearchResult(
                    id=hit["_id"],
                    score=hit["_score"],
                    source=hit["_source"],
                    highlight=hit.get("highlight", {}),
                    index=hit["_index"]
                ))

            return {
                "results": results,
                "total": response["hits"]["total"]["value"],
                "page": search_query.page,
                "per_page": search_query.per_page,
                "aggregations": response.get("aggregations", {})
            }

        except Exception as e:
            print(f"Search error: {e}")
            return {"results": [], "total": 0, "page": 1, "per_page": search_query.per_page}

    def get_document(self, index: str, doc_id: str) -> Optional[Dict]:
        """Get a document by ID."""
        try:
            response = self.client.get(index=self._index_name(index), id=doc_id)
            return response["_source"]
        except NotFoundError:
            return None

    def update_document(self, index: str, doc_id: str, document: Dict) -> bool:
        """Update a document."""
        try:
            self.client.update(index=self._index_name(index), id=doc_id, doc={"doc": document})
            return True
        except Exception as e:
            print(f"Update error: {e}")
            return False

    def delete_document(self, index: str, doc_id: str) -> bool:
        """Delete a document."""
        try:
            self.client.delete(index=self._index_name(index), id=doc_id)
            return True
        except Exception as e:
            print(f"Delete error: {e}")
            return False

    def search_projects(self, query: str, status: str = None, owner_id: str = None, page: int = 1) -> Dict:
        """Search projects."""
        filters = {}
        if status:
            filters["status"] = status
        if owner_id:
            filters["owner_id"] = owner_id

        return self.search(SearchQuery(
            query=query,
            indices=["projects"],
            filters=filters,
            page=page
        ))

    def search_agents(self, query: str, project_id: str = None, status: str = None) -> Dict:
        """Search agents."""
        filters = {}
        if project_id:
            filters["project_id"] = project_id
        if status:
            filters["status"] = status

        return self.search(SearchQuery(
            query=query,
            indices=["agents"],
            filters=filters
        ))

    def search_chat(self, room_id: str, query: str, limit: int = 50) -> Dict:
        """Search chat messages."""
        return self.search(SearchQuery(
            query=query,
            indices=["chat_messages"],
            filters={"room_id": room_id},
            per_page=limit
        ))

    def get_suggestions(self, index: str, field: str, prefix: str, size: int = 10) -> List[str]:
        """Get search suggestions."""
        body = {
            "suggest": {
                "suggestions": {
                    "prefix": prefix,
                    "completion": {
                        "field": f"{field}.suggest",
                        "size": size
                    }
                }
            }
        }

        try:
            response = self.client.search(index=self._index_name(index), body=body)
            suggestions = response["suggest"]["suggestions"][0]["options"]
            return [s["text"] for s in suggestions]
        except Exception as e:
            print(f"Suggestions error: {e}")
            return []

    def get_stats(self) -> Dict:
        """Get Elasticsearch cluster stats."""
        try:
            return self.client.cluster.stats()
        except Exception as e:
            return {"error": str(e)}


es = ElasticsearchService()
