import asyncio
import httpx
from qdrant_client import AsyncQdrantClient
from qdrant_client.http import models as rest
from langchain_openai import OpenAIEmbeddings
import uuid
from app.core.config import settings

qdrant = AsyncQdrantClient(host="127.0.0.1", port=settings.QDRANT_PORT)
embeddings = OpenAIEmbeddings(model="text-embedding-3-small", openai_api_key=settings.OPENAI_API_KEY)
COLLECTION_NAME = "medical_knowledge"

async def ensure_collection():
    collections = await qdrant.get_collections()
    if not any(c.name == COLLECTION_NAME for c in collections.collections):
        print(f"Creating collection {COLLECTION_NAME}...")
        await qdrant.create_collection(
            collection_name=COLLECTION_NAME,
            vectors_config=rest.VectorParams(size=1536, distance=rest.Distance.COSINE),
        )

async def fetch_wikipedia(disease):
    url = f"https://en.wikipedia.org/api/rest_v1/page/summary/{disease}"
    async with httpx.AsyncClient() as client:
        try:
            resp = await client.get(url, timeout=10.0)
            if resp.status_code == 200:
                data = resp.json()
                return f"Illness: {data.get('title')}\nSummary: {data.get('extract')}"
        except Exception as e:
            print(f"Error fetching {disease}: {e}")
    return None

async def fetch_openfda_drug(drug):
    url = f"https://api.fda.gov/drug/label.json?search=openfda.generic_name:\"{drug}\"&limit=1"
    async with httpx.AsyncClient() as client:
        try:
            resp = await client.get(url, timeout=10.0)
            if resp.status_code == 200:
                data = resp.json()
                results = data.get("results", [])
                if results:
                    res = results[0]
                    indications = res.get("indications_and_usage", [""])[0]
                    warnings = res.get("warnings", [""])[0]
                    return f"Drug: {drug}\nIndications: {indications}\nWarnings: {warnings}"
        except Exception as e:
            print(f"Error fetching {drug}: {e}")
    return None

async def seed_knowledge():
    await ensure_collection()
    
    knowledge_texts = []
    
    # Diseases from Wikipedia
    diseases = [
        "Diabetes_mellitus_type_2", "Hypertension", "Asthma", 
        "Chronic_obstructive_pulmonary_disease", "Influenza", 
        "COVID-19", "Migraine", "Osteoarthritis", "Rheumatoid_arthritis",
        "Pneumonia", "Tuberculosis", "Malaria", "Cholera"
    ]
    for d in diseases:
        text = await fetch_wikipedia(d)
        if text:
            knowledge_texts.append({"type": "disease", "text": text})
            
    # Drugs from OpenFDA
    drugs = ["metformin", "lisinopril", "albuterol", "ibuprofen", "amoxicillin", "paracetamol", "omeprazole"]
    for d in drugs:
        text = await fetch_openfda_drug(d)
        if text:
            knowledge_texts.append({"type": "drug", "text": text})

    points = []
    for item in knowledge_texts:
        vector = await embeddings.aembed_query(item["text"])
        points.append(rest.PointStruct(
            id=str(uuid.uuid4()),
            vector=vector,
            payload={
                "type": item["type"],
                "raw_text": item["text"],
            }
        ))
        
    if points:
        print(f"Upserting {len(points)} points into {COLLECTION_NAME}...")
        await qdrant.upsert(collection_name=COLLECTION_NAME, points=points)
        print("Done seeding medical knowledge.")
    else:
        print("No data fetched.")

if __name__ == "__main__":
    asyncio.run(seed_knowledge())
