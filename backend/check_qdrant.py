import asyncio
from qdrant_client import AsyncQdrantClient

async def check():
    c = AsyncQdrantClient(host="localhost", port=6333)
    print(f"Methods: {[m for m in dir(c) if not m.startswith('_')]}")
    await c.close()

if __name__ == "__main__":
    asyncio.run(check())
