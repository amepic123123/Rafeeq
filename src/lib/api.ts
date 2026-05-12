// ─── Rafeeq — API Client ──────────────────────────────────────────────────────
// Pattern: try real backend → on any failure fall back to mock data.
// Set NEXT_PUBLIC_API_URL in .env.local to point at the backend.
// All functions are async and return typed data, never raw Response objects.

import type {
  Patient, HealthScoreData, QuickStats, Insight, Medication,
  HbA1cPoint, BPPoint, RiskFlag, HakeemEntry, ChatMessage,
  SuggestedPrompt, FamilyMember, FamilySummary,
  PrescriptionAnalysisResult, SendMessageRequest, ApiResponse,
} from './types';

import {
  MOCK_PATIENT, MOCK_HEALTH_SCORE, MOCK_QUICK_STATS, MOCK_INSIGHTS,
  MOCK_MEDICATIONS, MOCK_HBA1C, MOCK_BP, MOCK_RISK_FLAGS,
  MOCK_HAKEEM_HISTORY, MOCK_CHAT_MESSAGES, MOCK_SUGGESTED_PROMPTS,
  MOCK_FAMILY_MEMBERS, MOCK_FAMILY_SUMMARY, MOCK_PRESCRIPTION_RESULT,
} from './data';

// ── Config ────────────────────────────────────────────────────────────────────
const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? '';
const DEFAULT_PATIENT_ID = 'JO-2026-KHL-4821';

// ── Core fetch wrapper ────────────────────────────────────────────────────────
/**
 * Generic fetch helper.
 * Throws on non-ok HTTP status or network error.
 * Unwraps the `data` field from the standard { data, success, timestamp } envelope.
 */
async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  if (!BASE_URL) {
    throw new Error('NEXT_PUBLIC_API_URL not configured — using mock data');
  }
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    ...options,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText);
    throw new Error(`API ${res.status}: ${text}`);
  }
  const json: ApiResponse<T> = await res.json();
  if (!json.success) {
    throw new Error(json.message ?? 'API returned success:false');
  }
  return json.data;
}

/**
 * Wraps a live fetch call with a fallback value.
 * Logs failures in development so the backend team can see what went wrong.
 */
async function withFallback<T>(live: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await live();
  } catch (err) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn('[Rafeeq API] Falling back to mock:', err instanceof Error ? err.message : err);
    }
    return fallback;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Patient APIs
// ─────────────────────────────────────────────────────────────────────────────

/**
 * GET /api/patients/{patientId}
 * Returns the full patient profile.
 */
export async function getPatient(patientId = DEFAULT_PATIENT_ID): Promise<Patient> {
  return withFallback(
    () => apiFetch<Patient>(`/api/patients/${patientId}`),
    MOCK_PATIENT,
  );
}

/**
 * GET /api/patients/{patientId}/health-score
 * Returns overall health score + per-metric breakdown.
 */
export async function getHealthScore(patientId = DEFAULT_PATIENT_ID): Promise<HealthScoreData> {
  return withFallback(
    () => apiFetch<HealthScoreData>(`/api/patients/${patientId}/health-score`),
    MOCK_HEALTH_SCORE,
  );
}

/**
 * GET /api/patients/{patientId}/quick-stats
 * Returns the three hero-card KPIs (HbA1c, BP, Medications Today).
 */
export async function getQuickStats(patientId = DEFAULT_PATIENT_ID): Promise<QuickStats> {
  return withFallback(
    () => apiFetch<QuickStats>(`/api/patients/${patientId}/quick-stats`),
    MOCK_QUICK_STATS,
  );
}

/**
 * GET /api/patients/{patientId}/insights
 * Returns the AI-generated insight feed shown on the dashboard.
 */
export async function getInsights(patientId = DEFAULT_PATIENT_ID): Promise<Insight[]> {
  return withFallback(
    () => apiFetch<Insight[]>(`/api/patients/${patientId}/insights`),
    MOCK_INSIGHTS,
  );
}

/**
 * GET /api/patients/{patientId}/medications
 * Returns all active medications with Ramadan-aware timing.
 */
export async function getMedications(patientId = DEFAULT_PATIENT_ID): Promise<Medication[]> {
  return withFallback(
    () => apiFetch<Medication[]>(`/api/patients/${patientId}/medications`),
    MOCK_MEDICATIONS,
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Lab APIs
// ─────────────────────────────────────────────────────────────────────────────

/**
 * GET /api/patients/{patientId}/labs/hba1c
 * Returns HbA1c monthly history for the chart.
 * Query param: ?months=7 (defaults to 7)
 */
export async function getHbA1cHistory(patientId = DEFAULT_PATIENT_ID, months = 7): Promise<HbA1cPoint[]> {
  return withFallback(
    () => apiFetch<HbA1cPoint[]>(`/api/patients/${patientId}/labs/hba1c?months=${months}`),
    MOCK_HBA1C,
  );
}

/**
 * GET /api/patients/{patientId}/labs/blood-pressure
 * Returns blood pressure readings for the last N days.
 * Query param: ?days=7 (defaults to 7)
 */
export async function getBloodPressureHistory(patientId = DEFAULT_PATIENT_ID, days = 7): Promise<BPPoint[]> {
  return withFallback(
    () => apiFetch<BPPoint[]>(`/api/patients/${patientId}/labs/blood-pressure?days=${days}`),
    MOCK_BP,
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Doctor / Clinical APIs
// ─────────────────────────────────────────────────────────────────────────────

/**
 * GET /api/patients/{patientId}/risk-flags
 * Returns standing risk flags (allergies, drug interactions, organ watch).
 */
export async function getRiskFlags(patientId = DEFAULT_PATIENT_ID): Promise<RiskFlag[]> {
  return withFallback(
    () => apiFetch<RiskFlag[]>(`/api/patients/${patientId}/risk-flags`),
    MOCK_RISK_FLAGS,
  );
}

/**
 * GET /api/patients/{patientId}/hakeem-history
 * Returns Hakeem-sourced medical history entries.
 * Query param: ?limit=10
 */
export async function getHakeemHistory(patientId = DEFAULT_PATIENT_ID, limit = 10): Promise<HakeemEntry[]> {
  return withFallback(
    () => apiFetch<HakeemEntry[]>(`/api/patients/${patientId}/hakeem-history?limit=${limit}`),
    MOCK_HAKEEM_HISTORY,
  );
}

/**
 * POST /api/prescriptions/analyze
 * Uploads a prescription file (PDF/image) for OCR and AI risk analysis.
 * Uses multipart/form-data — does NOT use apiFetch (different Content-Type).
 */
export async function analyzePrescription(
  patientId: string,
  file: File,
  onProgress?: (pct: number) => void,
): Promise<PrescriptionAnalysisResult> {
  return withFallback(async () => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('patientId', patientId);

    // XHR for upload progress support
    return new Promise<PrescriptionAnalysisResult>((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open('POST', `${BASE_URL}/api/prescriptions/analyze`);
      xhr.setRequestHeader('Accept', 'application/json');

      xhr.upload.addEventListener('progress', e => {
        if (e.lengthComputable && onProgress) {
          onProgress(Math.round((e.loaded / e.total) * 100));
        }
      });

      xhr.addEventListener('load', () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          const json: ApiResponse<PrescriptionAnalysisResult> = JSON.parse(xhr.responseText);
          resolve(json.data);
        } else {
          reject(new Error(`Upload failed: HTTP ${xhr.status}`));
        }
      });

      xhr.addEventListener('error', () => reject(new Error('Upload network error')));
      xhr.send(formData);
    });
  }, MOCK_PRESCRIPTION_RESULT);
}

// ─────────────────────────────────────────────────────────────────────────────
// Chat APIs
// ─────────────────────────────────────────────────────────────────────────────

/**
 * GET /api/patients/{patientId}/chat/history
 * Returns previous chat messages for the session.
 * Query param: ?limit=50
 */
export async function getChatHistory(patientId = DEFAULT_PATIENT_ID, limit = 50): Promise<ChatMessage[]> {
  return withFallback(
    () => apiFetch<ChatMessage[]>(`/api/patients/${patientId}/chat/history?limit=${limit}`),
    MOCK_CHAT_MESSAGES,
  );
}

/**
 * POST /api/patients/{patientId}/chat/message
 * Sends a user message and returns the AI response.
 */
export async function sendChatMessage(
  patientId: string,
  body: SendMessageRequest,
): Promise<ChatMessage> {
  return withFallback(async () => {
    return apiFetch<ChatMessage>(
      `/api/patients/${patientId}/chat/message`,
      { method: 'POST', body: JSON.stringify(body) },
    );
  }, {
    id: Date.now(),
    role: 'ai',
    textAr: 'شكراً على سؤالك يا خالد! بناءً على سجلك الصحي في حكيم، أنصحك بمراجعة طبيبك. سحا وعافية! 🌿',
    textEn: 'Thank you for your question! Based on your Hakeem health record, I recommend consulting your doctor. Saha w Afieh!',
    time: new Date().toLocaleTimeString('ar-JO', { hour: '2-digit', minute: '2-digit' }),
  });
}

/**
 * GET /api/patients/{patientId}/chat/suggested-prompts
 * Returns the AI-curated list of suggested prompt pills.
 */
export async function getSuggestedPrompts(patientId = DEFAULT_PATIENT_ID): Promise<SuggestedPrompt[]> {
  return withFallback(
    () => apiFetch<SuggestedPrompt[]>(`/api/patients/${patientId}/chat/suggested-prompts`),
    MOCK_SUGGESTED_PROMPTS,
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Family APIs
// ─────────────────────────────────────────────────────────────────────────────

/**
 * GET /api/patients/{patientId}/family
 * Returns family members linked to the primary patient.
 */
export async function getFamilyMembers(patientId = DEFAULT_PATIENT_ID): Promise<FamilyMember[]> {
  return withFallback(
    () => apiFetch<FamilyMember[]>(`/api/patients/${patientId}/family`),
    MOCK_FAMILY_MEMBERS,
  );
}

/**
 * GET /api/patients/{patientId}/family/summary
 * Returns aggregated family health statistics.
 */
export async function getFamilySummary(patientId = DEFAULT_PATIENT_ID): Promise<FamilySummary> {
  return withFallback(
    () => apiFetch<FamilySummary>(`/api/patients/${patientId}/family/summary`),
    MOCK_FAMILY_SUMMARY,
  );
}
