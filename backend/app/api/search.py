"""
🔍 Search API
"""
from fastapi import APIRouter, Query
from typing import List, Optional

router = APIRouter()


@router.get("/")
async def search(
    q: str = Query(..., description="Search query"),
    index: str = "projects",
    limit: int = 20
):
    """Search across indices."""
    return {
        "query": q,
        "index": index,
        "results": [],
        "total": 0,
        "page": 1,
        "per_page": limit
    }


@router.get("/suggestions")
async def get_suggestions(q: str = Query(..., min_length=2)):
    """Get search suggestions."""
    return {"suggestions": [f"{q} project", f"{q} agent", f"{q} deployment"]}
