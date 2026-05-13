from qdrant_client import AsyncQdrantClient
from qdrant_client.http import models as rest
from langchain_openai import OpenAIEmbeddings, ChatOpenAI
from langchain_core.messages import SystemMessage, HumanMessage

from app.core.config import settings
import uuid

class RAGService:
    def __init__(self, qdrant_client: AsyncQdrantClient):
        self.qdrant = qdrant_client
        self.collection_name = "patient_medical_history"
        
        # We use a try-catch to allow the app to run even if API keys are missing during early MVP dev
        try:
            self.embeddings = OpenAIEmbeddings(model="text-embedding-3-small", openai_api_key=settings.OPENAI_API_KEY)
            self.llm = ChatOpenAI(model="gpt-4o", temperature=0.2, openai_api_key=settings.OPENAI_API_KEY)
            self.mock_mode = False
        except Exception as e:
            print(f"Warning: OpenAI setup failed, entering Mock Mode. Error: {e}")
            self.mock_mode = True

    async def retrieve_context(self, patient_id: str, query: str) -> str:
        if self.mock_mode:
            return "Patient has a history of type 2 diabetes and hypertension. HbA1c is currently 8.2%."

        query_vector = await self.embeddings.aembed_query(query)
        
        # Ensure collection exists
        collections = await self.qdrant.get_collections()
        if not any(c.name == self.collection_name for c in collections.collections):
            return "No medical history available yet."

        print(f"DEBUG: Retrieving context for patient_id='{patient_id}'")
        search_result = await self.qdrant.query_points(
            collection_name=self.collection_name,
            query=query_vector,
            query_filter=rest.Filter(
                must=[
                    rest.FieldCondition(
                        key="patient_id",
                        match=rest.MatchValue(value=patient_id)
                    )
                ]
            ),
            limit=5
        )
        
        context = "\n".join([hit.payload.get("raw_text", "") for hit in search_result.points])
        print(f"DEBUG: Found {len(search_result.points)} context hits. Context length: {len(context)}")
        return context

    async def generate_response(self, patient_id: str, query: str, session_id: str) -> str:
        context = await self.retrieve_context(patient_id, query)
        
        if self.mock_mode:
            return f"(Mock Response) بناءً على ملفك الطبي، يبدو أن السكر التراكمي لديك مرتفع قليلاً (8.2%). يجب عليك الالتزام بالدواء واستشارة الطبيب قريباً. سؤالك كان: {query}"

        prompt = f"""
        You are Rafeeq (رفيق), an AI healthcare assistant for the Jordanian Hakeem system.
        Answer the patient's question based ONLY on their medical records below.
        If the answer is not in the records, say "I don't have that information."
        Answer warmly in Arabic, using Jordanian dialect where appropriate.

        MEDICAL RECORDS:
        {context}
        """
        
        messages = [
            SystemMessage(content=prompt),
            HumanMessage(content=query)
        ]
        
        response = await self.llm.ainvoke(messages)
        
        return response.content
