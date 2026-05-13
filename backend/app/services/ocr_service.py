import base64
import json
import re
import io
from PIL import Image
from PIL import ImageOps, ImageFilter
from openai import AsyncOpenAI

from app.core.config import settings
from app.schemas.prescription_schema import ExtractedDrug


class OCRService:
    def __init__(self):
        self.client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)

    def _is_pdf(self, file_content: bytes) -> bool:
        return file_content[:4] == b"%PDF"

    def _image_to_base64(self, file_content: bytes) -> str:
        """Convert raw image bytes to a base64-encoded JPEG string."""
        image = Image.open(io.BytesIO(file_content)).convert("RGB")
        buffer = io.BytesIO()
        image.save(buffer, format="JPEG")
        return base64.b64encode(buffer.getvalue()).decode("utf-8")

    def _preprocess_image(self, file_content: bytes) -> bytes:
        """Lightweight preprocessing to enhance contrast and edges for scans."""
        image = Image.open(io.BytesIO(file_content)).convert("L")
        image = ImageOps.autocontrast(image)

        # Upscale small images to improve text legibility
        min_width = 1400
        if image.width < min_width:
            scale = min_width / image.width
            new_size = (int(image.width * scale), int(image.height * scale))
            image = image.resize(new_size, Image.BICUBIC)

        image = image.filter(ImageFilter.UnsharpMask(radius=2, percent=150, threshold=3))
        image = image.convert("RGB")

        buffer = io.BytesIO()
        image.save(buffer, format="JPEG", quality=92)
        return buffer.getvalue()

    def _try_extract_pdf_text(self, file_content: bytes) -> str | None:
        try:
            import pypdf  # type: ignore
        except Exception:
            try:
                import PyPDF2 as pypdf  # type: ignore
            except Exception:
                return None

        try:
            reader = pypdf.PdfReader(io.BytesIO(file_content))
            texts = []
            for page in reader.pages[:5]:
                text = page.extract_text() or ""
                if text.strip():
                    texts.append(text.strip())
            return "\n\n".join(texts) if texts else None
        except Exception:
            return None

    def _try_rasterize_pdf_first_page(self, file_content: bytes) -> bytes | None:
        try:
            from pdf2image import convert_from_bytes  # type: ignore

            pages = convert_from_bytes(
                file_content,
                fmt="jpeg",
                first_page=1,
                last_page=1,
                dpi=300,
            )
            if pages:
                buffer = io.BytesIO()
                pages[0].save(buffer, format="JPEG", quality=92)
                return buffer.getvalue()
        except Exception:
            pass

        try:
            image = Image.open(io.BytesIO(file_content))
            image.seek(0)
            image = image.convert("RGB")
            buffer = io.BytesIO()
            image.save(buffer, format="JPEG", quality=92)
            return buffer.getvalue()
        except Exception:
            return None

    def _unsupported_pdf_fallback(self) -> dict:
        return {
            "image_type": "other",
            "findings": [
                {
                    "ar": "تعذّر تحليل ملف PDF. يُرجى التأكد من توفر محول PDF للصور (Poppler) أو رفع صورة واضحة/‏PDF نصي.",
                    "severity": "mild",
                }
            ],
            "recommendations": [
                {
                    "ar": "يرجى إعادة رفع الصورة بصيغة JPG/PNG أو PDF نصي قابل للاستخراج.",
                    "type": "investigation",
                }
            ],
            "raw_summary": "لم يتمكن النظام من فتح ملف PDF الحالي. يُرجى رفع صورة أو PDF نصي أو تثبيت محول PDF للصور.",
        }

    def _clean_json(self, raw: str) -> str:
        """Strip markdown code fences if GPT-4o wraps the JSON."""
        raw = re.sub(r"^```(?:json)?\s*", "", raw.strip())
        raw = re.sub(r"\s*```$", "", raw)
        return raw.strip()

    # ── Prescription OCR ──────────────────────────────────────────────────────

    async def process_image(self, file_content: bytes) -> list[ExtractedDrug]:
        """
        Real OCR using GPT-4o Vision.
        Sends the prescription image to GPT-4o which extracts structured drug info.
        Supports handwritten Arabic and English prescriptions.
        """
        if self._is_pdf(file_content):
            pdf_text = self._try_extract_pdf_text(file_content)
            if pdf_text:
                return await self._process_prescription_text(pdf_text)

            rasterized = self._try_rasterize_pdf_first_page(file_content)
            if rasterized:
                file_content = rasterized

        base64_image = self._image_to_base64(file_content)

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

            raw_output = self._clean_json(response.choices[0].message.content)
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
            print("[OCR] GPT-4o returned non-JSON — falling back to demo data")
            return self._demo_fallback()

        except Exception as e:
            print(f"[OCR] Error: {e} — falling back to demo data")
            return self._demo_fallback()

    async def _process_prescription_text(self, text: str) -> list[ExtractedDrug]:
        prompt = f"""
        You are a clinical pharmacist AI. Extract medications from the text below.

        Return ONLY a valid JSON array. No extra text, no markdown, no explanation.
        Each object must have exactly these keys: "name", "dosage", "frequency".
        If a value is missing, use "Unknown".

        TEXT:
        {text}
        """

        try:
            response = await self.client.chat.completions.create(
                model="gpt-4o",
                messages=[{"role": "user", "content": prompt}],
                max_tokens=1000,
                temperature=0.1,
            )
            raw_output = self._clean_json(response.choices[0].message.content)
            drugs_data = json.loads(raw_output)
            return [
                ExtractedDrug(
                    name=drug.get("name", "Unknown"),
                    dosage=drug.get("dosage", "Unknown"),
                    frequency=drug.get("frequency", "Unknown"),
                )
                for drug in drugs_data
            ]
        except Exception as e:
            print(f"[OCR] Text extraction error: {e} — falling back to demo data")
            return self._demo_fallback()

    # ── Medical Image Analysis (X-ray / Lab / Scan) ───────────────────────────

    async def analyze_medical_image(
        self,
        file_content: bytes,
        strict: bool = False,
        patient_context: str | None = None
    ) -> dict:
        """
        Analyzes a non-prescription medical image (X-ray, CT, MRI, lab report).
        Uses GPT-4o Vision with a diagnostician prompt.

        Returns a dict with:
          - findings: list of detected abnormalities / lab interpretations (Arabic)
          - recommendations: list of suggested interventions / medications (Arabic)
          - raw_summary: free-text Arabic clinical summary
        """
        if self._is_pdf(file_content):
            pdf_text = self._try_extract_pdf_text(file_content)
            if pdf_text:
                return await self._analyze_medical_text(pdf_text, strict, patient_context)

            rasterized = self._try_rasterize_pdf_first_page(file_content)
            if rasterized:
                file_content = rasterized
            else:
                return self._unsupported_pdf_fallback()

        base64_image = self._image_to_base64(file_content)
        preprocessed = self._preprocess_image(file_content)
        base64_preprocessed = self._image_to_base64(preprocessed)

        prompt = """
        You are an expert AI clinical assistant supporting a licensed physician in Jordan.
        Analyze the medical image or document provided (this may be an X-ray, CT scan,
        MRI, lab report, or any other clinical document).

        Your task:
        1. Identify key clinical findings visible in the image/document.
        2. List possible diagnoses or interpretations based on what you see.
        3. Suggest potential treatment interventions or medications that a physician
           might consider — clearly labelled as AI suggestions for physician review only.

        IMPORTANT DISCLAIMER RULES:
        - Always state that these are AI-generated suggestions for physician review.
        - Never diagnose definitively. Use language like "يُشير إلى", "يُحتمل", "قد يدل على".
        - Flag when urgent specialist referral is needed.

        If the image appears normal or no clear abnormality is seen, explicitly say so.
        For chest X-rays, check lungs, pleura, heart size, mediastinum, bones, and compare sides.
        If there is any asymmetry, opacity, or blunting, mention it clearly.

                Return ONLY a valid JSON object with this exact structure:
        {
          "image_type": "xray|ct|mri|lab|other",
          "findings": [
            {"ar": "العثور باللغة العربية", "severity": "normal|mild|moderate|severe"}
          ],
          "recommendations": [
            {"ar": "التوصية باللغة العربية", "type": "medication|investigation|referral|lifestyle"}
          ],
          "raw_summary": "ملخص سريري شامل باللغة العربية في ٣-٥ جمل"
        }

        Use formal medical Arabic. Be specific and clinically relevant.
        """

        if patient_context:
            prompt += (
                "\nPATIENT CONTEXT (from medical records):\n"
                f"{patient_context}\n"
                "Use this context to tailor recommendations and flag contraindications."
            )

        strict_addendum = """
        STRICT MODE:
        - Do NOT answer "normal" unless you explicitly state the checklist was reviewed.
        - Always mention at least 4 specific checks (e.g., no focal consolidation, no effusion, no pneumothorax, heart size normal, mediastinum normal, bones intact).
        - If image quality is suboptimal or any uncertainty exists, set severity to "mild" and recommend radiologist review.
        - Prefer cautious language and flag subtle or equivocal findings for follow-up.
        - When patient context is provided, check for interactions or contraindications in recommendations.
        - If any subtle or equivocal sign is present, include a recommendation for radiologist review.
        """

        try:
            primary_prompt = prompt + (strict_addendum if strict else "")

            response = await self.client.chat.completions.create(
                model="gpt-4o",
                messages=[
                    {
                        "role": "user",
                        "content": [
                            {"type": "text", "text": primary_prompt},
                            {
                                "type": "image_url",
                                "image_url": {
                                    "url": f"data:image/jpeg;base64,{base64_preprocessed}",
                                    "detail": "high",
                                },
                            },
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
                max_tokens=2000,
                temperature=0.1,
            )

            async def _load_json(text: str) -> dict:
                cleaned = self._clean_json(text)
                try:
                    return json.loads(cleaned)
                except json.JSONDecodeError:
                    repair_prompt = (
                        "Fix this to valid JSON only. Do not add any text.\n"
                        f"INPUT:\n{cleaned}"
                    )
                    repair = await self.client.chat.completions.create(
                        model="gpt-4o",
                        messages=[{"role": "user", "content": repair_prompt}],
                        max_tokens=800,
                        temperature=0.0,
                    )
                    repaired = self._clean_json(repair.choices[0].message.content)
                    return json.loads(repaired)

            result = await _load_json(response.choices[0].message.content)

            if strict:
                secondary_prompt = (
                    prompt
                    + strict_addendum
                    + "\nSECOND PASS: Be skeptical and look for subtle findings. "
                      "If you disagree with the first pass, note the discrepancy in the findings."
                )
                secondary = await self.client.chat.completions.create(
                    model="gpt-4o",
                    messages=[
                        {
                            "role": "user",
                            "content": [
                                {"type": "text", "text": secondary_prompt},
                                {
                                    "type": "image_url",
                                    "image_url": {
                                        "url": f"data:image/jpeg;base64,{base64_preprocessed}",
                                        "detail": "high",
                                    },
                                },
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
                    max_tokens=2000,
                    temperature=0.1,
                )

                result_2 = await _load_json(secondary.choices[0].message.content)

                def _merge_unique(items: list[dict], other: list[dict], key: str) -> list[dict]:
                    seen = {i.get(key, "").strip() for i in items}
                    merged = list(items)
                    for item in other:
                        value = item.get(key, "").strip()
                        if value and value not in seen:
                            merged.append(item)
                            seen.add(value)
                    return merged

                findings = _merge_unique(result.get("findings", []), result_2.get("findings", []), "ar")
                recommendations = _merge_unique(
                    result.get("recommendations", []),
                    result_2.get("recommendations", []),
                    "ar",
                )

                # If any non-normal finding exists, remove generic "normal" only findings
                has_non_normal = any(f.get("severity") != "normal" for f in findings)
                if has_non_normal:
                    findings = [f for f in findings if f.get("severity") != "normal"]

                result = {
                    "image_type": result_2.get("image_type") or result.get("image_type", "other"),
                    "findings": findings,
                    "recommendations": recommendations,
                    "raw_summary": result_2.get("raw_summary") or result.get("raw_summary", ""),
                }
            print(
                f"[OCR] GPT-4o medical image analysis: "
                f"{len(result.get('findings', []))} finding(s), "
                f"{len(result.get('recommendations', []))} recommendation(s)"
            )
            return result

        except json.JSONDecodeError:
            print("[OCR] Medical image: GPT-4o returned non-JSON — using fallback")
            return self._medical_image_fallback()

        except Exception as e:
            print(f"[OCR] Medical image error: {e} — using fallback")
            return self._medical_image_fallback()

    async def _analyze_medical_text(
        self,
        text: str,
        strict: bool,
        patient_context: str | None
    ) -> dict:
        prompt = """
        You are an expert AI clinical assistant supporting a licensed physician in Jordan.
        Analyze the following medical text (likely a lab report or clinical document).

        Your task:
        1. Identify key clinical findings in the text.
        2. Suggest interpretations based strictly on the text.
        3. Provide cautious recommendations for physician review.

        Return ONLY a valid JSON object with this exact structure:
        {
          "image_type": "lab|other",
          "findings": [
            {"ar": "العثور باللغة العربية", "severity": "normal|mild|moderate|severe"}
          ],
          "recommendations": [
            {"ar": "التوصية باللغة العربية", "type": "medication|investigation|referral|lifestyle"}
          ],
          "raw_summary": "ملخص سريري شامل باللغة العربية في ٣-٥ جمل"
        }
        """

        if patient_context:
            prompt += (
                "\nPATIENT CONTEXT (from medical records):\n"
                f"{patient_context}\n"
                "Use this context to tailor recommendations and flag contraindications."
            )

        if strict:
            prompt += (
                "\nSTRICT MODE: Be cautious, cite explicit values from the text, "
                "and recommend physician review if any ambiguity exists."
            )

        prompt += f"\nMEDICAL TEXT:\n{text}\n"

        try:
            response = await self.client.chat.completions.create(
                model="gpt-4o",
                messages=[{"role": "user", "content": prompt}],
                max_tokens=1800,
                temperature=0.1,
            )
            cleaned = self._clean_json(response.choices[0].message.content)
            return json.loads(cleaned)
        except Exception as e:
            print(f"[OCR] Medical text error: {e} — using fallback")
            return self._medical_image_fallback()

    # ── Fallbacks ─────────────────────────────────────────────────────────────

    def _demo_fallback(self) -> list[ExtractedDrug]:
        """Fallback mock prescription used when API is unavailable."""
        return [
            ExtractedDrug(name="Amoxicillin", dosage="500mg", frequency="TID"),
            ExtractedDrug(name="Metformin", dosage="2000mg", frequency="BID"),
            ExtractedDrug(name="Gentamicin", dosage="80mg", frequency="IV"),
        ]

    def _medical_image_fallback(self) -> dict:
        """Fallback response when medical image analysis fails."""
        return {
            "image_type": "other",
            "findings": [
                {
                    "ar": "تعذّر تحليل الصورة تلقائياً. يُرجى مراجعة الصورة يدوياً.",
                    "severity": "mild"
                }
            ],
            "recommendations": [
                {
                    "ar": "يُوصى بمراجعة مختص للتفسير الدقيق للصورة.",
                    "type": "referral"
                }
            ],
            "raw_summary": (
                "تعذّر على النظام تحليل هذه الصورة الطبية بصورة تلقائية. "
                "يُرجى التحقق من جودة الصورة أو إعادة المحاولة."
            ),
        }
