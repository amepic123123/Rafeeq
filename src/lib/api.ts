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

// ── Config ────────────────────────────────────────────────────────────────────
const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

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

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  };

  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('rafeeq_token');
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }

  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { ...headers, ...(options?.headers as Record<string, string>) },
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



// ─────────────────────────────────────────────────────────────────────────────
// Auth APIs
// ─────────────────────────────────────────────────────────────────────────────

export async function loginWithNationalId(nationalId: string, password: string): Promise<{ access_token: string; token_type: string }> {
  if (!BASE_URL) throw new Error('API not configured');

  const formData = new URLSearchParams();
  formData.append('username', nationalId);
  formData.append('password', password);

  const res = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: formData.toString()
  });

  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText);
    throw new Error(`Login failed: ${text}`);
  }

  return res.json();
}

// ─────────────────────────────────────────────────────────────────────────────
// Patient APIs
// ─────────────────────────────────────────────────────────────────────────────

export async function getPatient(patientId: string): Promise<Patient> {
  return apiFetch<Patient>(`/api/patients/${patientId}`);
}

export async function getHealthScore(patientId: string): Promise<HealthScoreData> {
  return apiFetch<HealthScoreData>(`/api/patients/${patientId}/health-score`);
}

export async function getQuickStats(patientId: string): Promise<QuickStats> {
  return apiFetch<QuickStats>(`/api/patients/${patientId}/quick-stats`);
}

export async function getInsights(patientId: string): Promise<Insight[]> {
  return apiFetch<Insight[]>(`/api/patients/${patientId}/insights`);
}

export async function getMedications(patientId: string): Promise<Medication[]> {
  return apiFetch<Medication[]>(`/api/patients/${patientId}/medications`);
}

// ─────────────────────────────────────────────────────────────────────────────
// Lab APIs
// ─────────────────────────────────────────────────────────────────────────────

export async function getHbA1cHistory(patientId: string, months = 7): Promise<HbA1cPoint[]> {
  return apiFetch<HbA1cPoint[]>(`/api/patients/${patientId}/labs/hba1c?months=${months}`);
}

export async function getBloodPressureHistory(patientId: string, days = 7): Promise<BPPoint[]> {
  return apiFetch<BPPoint[]>(`/api/patients/${patientId}/labs/blood-pressure?days=${days}`);
}

// ─────────────────────────────────────────────────────────────────────────────
// Doctor / Clinical APIs
// ─────────────────────────────────────────────────────────────────────────────

export async function getRiskFlags(patientId: string): Promise<RiskFlag[]> {
  return apiFetch<RiskFlag[]>(`/api/patients/${patientId}/risk-flags`);
}

export async function getHakeemHistory(patientId: string, limit = 10): Promise<HakeemEntry[]> {
  return apiFetch<HakeemEntry[]>(`/api/patients/${patientId}/hakeem-history?limit=${limit}`);
}

export async function getRecentPatients(): Promise<any[]> {
  return apiFetch<any[]>('/api/patients/doctor/recent-patients');
}

export async function analyzePrescription(
  patientId: string,
  file: File,
  onProgress?: (pct: number) => void,
): Promise<PrescriptionAnalysisResult> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('patientId', patientId);

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
}

// ─────────────────────────────────────────────────────────────────────────────
// Chat APIs
// ─────────────────────────────────────────────────────────────────────────────

export async function getChatHistory(patientId: string, limit = 50): Promise<ChatMessage[]> {
  return apiFetch<ChatMessage[]>(`/api/patients/${patientId}/chat/history?limit=${limit}`);
}

export async function sendChatMessage(
  patientId: string,
  body: SendMessageRequest,
): Promise<ChatMessage> {
  return apiFetch<ChatMessage>(
    `/api/patients/${patientId}/chat/message`,
    { method: 'POST', body: JSON.stringify(body) },
  );
}

export async function getSuggestedPrompts(patientId: string): Promise<SuggestedPrompt[]> {
  return apiFetch<SuggestedPrompt[]>(`/api/patients/${patientId}/chat/suggested-prompts`);
}

// ─────────────────────────────────────────────────────────────────────────────
// Family APIs
// ─────────────────────────────────────────────────────────────────────────────

export async function getFamilyMembers(patientId: string): Promise<FamilyMember[]> {
  return apiFetch<FamilyMember[]>(`/api/patients/${patientId}/family`);
}

export async function getFamilySummary(patientId: string): Promise<FamilySummary> {
  return apiFetch<FamilySummary>(`/api/patients/${patientId}/family/summary`);
}
