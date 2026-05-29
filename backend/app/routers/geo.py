from fastapi import APIRouter, Query

from app.utils.geo import search_places

router = APIRouter(prefix="/api/geo", tags=["geo"])


@router.get("/search")
def geo_search(
    q: str = Query(..., min_length=2, max_length=200),
    limit: int = Query(6, ge=1, le=10),
    prefer_addresses: bool = Query(False),
):
    results = search_places(q, limit=limit, prefer_addresses=prefer_addresses)
    return {"results": results, "attribution": "© OpenStreetMap contributors"}
