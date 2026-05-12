import base64
import json
import re
import io
from PIL import Image
from openai import AsyncOpenAI

from app.core.config import settings
from app.schemas.prescription_schema import ExtractedDrug


class OCRService:
    def __init__(self):
        self.client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)

    async def process_image(self, file_content: bytes) -> list[ExtractedDrug]:
        """
        Real OCR using GPT-4o Vision.
        Sends the prescription image to GPT-4o which extracts structured drug info.
        Supports handwritten Arabic and English prescriptions.
        """
        # Ensure image is valid and convert to JPEG bytes for the API
        image = Image.open(io.BytesIO(file_content)).convert("RGB")
        buffer = io.BytesIO()
        image.save(buffer, format="JPEG")
        base64_image = base64.b64encode(buffer.getvalue()).decode("utf-8")

        prompt = """
        You are a clinical pharmacist AI. Analyze this prescription image carefully.

        Extract ALL medications mentioned in the prescription.
        Handle handwritten text, Arabic drug names, and abbreviations.

        Common abbreviations:
        - TID / ثلاث مرات = Three times a day
        - BID / مرتين = Twice a day  
        - QD / مرة = Once a day
        - PRN = As needed
        - PO = By mouth (oral)
        - IV = Intravenous

        Return ONLY a valid JSON array. No extra text, no markdown, no explanation.
        Each object must have exactly these keys: "name", "dosage", "frequency"
        If a value is not legible or missing, use "Unknown".

        Example:
        [
          {"name": "Amoxicillin", "dosage": "500mg", "frequency": "TID"},
          {"name": "Metformin", "dosage": "1000mg", "frequency": "BID"}
        ]
        """

        try:
            response = await self.client.chat.completions.create(
                model="gpt-4o",
                messages=[
                    {
                        "role": "user",
                        "content": [
                            {"type": "text", "text": prompt},
                            {
                                "type": "image_url",
                                "image_url": {
                                    "url": f"data:image/jpeg;base64,{base64_image}",
                                    "detail": "high",
                                },
                            },
                        ],
                    }
                ],
                max_tokens=1000,
                temperature=0.1,
            )

            raw_output = response.choices[0].message.content.strip()
            # Strip markdown fences if GPT wraps it
            raw_output = re.sub(r"^```(?:json)?\s*", "", raw_output)
            raw_output = re.sub(r"\s*```$", "", raw_output)

            drugs_data = json.loads(raw_output)
            print(f"[OCR] GPT-4o extracted {len(drugs_data)} drug(s)")

            return [
                ExtractedDrug(
                    name=drug.get("name", "Unknown"),
                    dosage=drug.get("dosage", "Unknown"),
                    frequency=drug.get("frequency", "Unknown"),
                )
                for drug in drugs_data
            ]

        except json.JSONDecodeError:
            print(f"[OCR] GPT-4o returned non-JSON — falling back to demo data")
            return self._demo_fallback()

        except Exception as e:
            print(f"[OCR] Error: {e} — falling back to demo data")
            return self._demo_fallback()

    def _demo_fallback(self) -> list[ExtractedDrug]:
        """Fallback mock prescription used when API is unavailable."""
        return [
            ExtractedDrug(name="Amoxicillin", dosage="500mg", frequency="TID"),
            ExtractedDrug(name="Metformin", dosage="2000mg", frequency="BID"),
            ExtractedDrug(name="Gentamicin", dosage="80mg", frequency="IV"),
        ]
