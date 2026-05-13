import asyncio
from qdrant_client import AsyncQdrantClient
from qdrant_client.http import models as rest
from app.core.config import settings

async def check():
    qdrant = AsyncQdrantClient(host=settings.QDRANT_HOST, port=settings.QDRANT_PORT)
    pid = 'JO-2026-KHL-4821'
    
    res = await qdrant.scroll(
        collection_name="patient_medical_history",
        scroll_filter=rest.Filter(
            must=[
                rest.FieldCondition(key="patient_id", match=rest.MatchValue(value=pid))
            ]
        ),
        limit=5,
        with_payload=True
    )
    
    print(f"RESULTS for {pid}:")
    for p in res[0]:
        print(f"--- POINT ---")
        print(p.payload.get("raw_text", "NO TEXT"))

if __name__ == "__main__":
    asyncio.run(check())
