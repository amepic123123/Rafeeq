from langchain_openai import ChatOpenAI
from langchain_core.messages import SystemMessage, HumanMessage
from app.core.config import settings

class PatientAIService:
    def __init__(self):
        try:
            self.llm = ChatOpenAI(model="gpt-4o", temperature=0.3, openai_api_key=settings.OPENAI_API_KEY)
            self.mock_mode = False
        except Exception:
            self.mock_mode = True

    async def generate_health_summary(self, patient_history: str) -> dict:
        if self.mock_mode:
            return {
                "summary_ar": "ملخص عام: أنت تعاني من السكري من النوع الثاني مع ارتفاع في نسبة السكر التراكمي. يرجى المتابعة لضبط الجرعات.",
                "summary_en": "General Summary: You have Type 2 Diabetes with elevated HbA1c. Please follow up for dose adjustment."
            }
            
        prompt = f"""
        You are Rafeeq (رفيق), an expert medical AI in Jordan.
        Summarize the following patient medical history into a highly readable, patient-friendly 3-bullet summary.
        DO NOT alarm the patient.
        
        MEDICAL HISTORY:
        {patient_history}
        
        Return exactly in this JSON format:
        {{"summary_ar": "Arabic summary...", "summary_en": "English summary..."}}
        """
        
        messages = [SystemMessage(content=prompt)]
        response = await self.llm.ainvoke(messages)
        # In a real app, use output parsers to ensure JSON. Mocking the dict extraction for brevity.
        import json
        try:
            return json.loads(response.content)
        except:
            return {
                "summary_ar": response.content,
                "summary_en": response.content
            }

    async def generate_recommendations(self, patient_history: str) -> list[dict]:
        if self.mock_mode:
            return [
                {"category": "lifestyle", "title_ar": "المشي اليومي", "content_ar": "احرص على المشي لمدة 30 دقيقة لتحسين مستوى السكر.", "priority": "high"},
                {"category": "medication_reminder", "title_ar": "ميتفورمين", "content_ar": "تذكر أخذ الميتفورمين بعد الطعام لتجنب آلام المعدة.", "priority": "medium"}
            ]
            
        prompt = f"""
        Generate 2-3 personalized lifestyle and medication adherence recommendations based on this history:
        {patient_history}
        
        Return JSON array of objects with keys: category, title_ar, content_ar, priority (high/medium/low).
        """
        messages = [SystemMessage(content=prompt)]
        response = await self.llm.ainvoke(messages)
        import json
        try:
            return json.loads(response.content)
        except:
            return []
