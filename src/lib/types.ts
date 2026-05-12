// ─── Rafeeq — Shared API Types ────────────────────────────────────────────────
// Every type here maps 1-to-1 with a backend response field.
// Keep this file in sync with the API_DOCUMENTATION.md contract.

// ── Patient ──────────────────────────────────────────────────────────────────
export interface Patient {
  id: string;
  nameAr: string;
  nameEn: string;
  age: number;
  gender: 'male' | 'female';
  nationalId: string;       // masked, e.g. "9****3847"
  bloodType: string;
  city: string;
  healthScore: number;      // 0–100
  hakeemSynced: boolean;
  lastSyncedAt: string;     // ISO 8601
  conditions: string[];     // Arabic disease names
  allergies: string[];      // Arabic allergy names
}

// ── Health Score ─────────────────────────────────────────────────────────────
export interface HealthScoreData {
  overall: number;          // 0–100
  subMetrics: {
    label: string;          // Arabic label
    value: number;          // 0–100
    color: string;          // hex
  }[];
}

// ── Quick Stats (hero card) ──────────────────────────────────────────────────
export interface QuickStats {
  hba1c: string;            // e.g. "7.1%"
  hba1cDelta: string;       // e.g. "↓ 0.3%"
  hba1cGood: boolean;
  bloodPressure: string;    // e.g. "138/88"
  bloodPressureDelta: string;
  bloodPressureGood: boolean;
  medicationToday: string;  // e.g. "4/4"
  medicationDelta: string;
  medicationGood: boolean;
}

// ── AI Insight ───────────────────────────────────────────────────────────────
export interface Insight {
  id: number;
  emoji: string;
  textAr: string;
  textEn: string;
  time: string;             // relative time string (Arabic), e.g. "قبل ساعتين"
  tag: string;              // Arabic tag, e.g. "سكر الدم"
  severity: 'green' | 'yellow' | 'red' | 'blue';
}

// ── Medication ───────────────────────────────────────────────────────────────
export interface Medication {
  id: number;
  name: string;             // Arabic
  nameEn: string;
  dose: string;             // Arabic dosage description
  doseEn: string;
  ramadan: boolean;
  timing: 'iftar' | 'suhoor' | 'night' | 'morning' | 'noon';
  color: string;            // hex, for UI display
}

// ── HbA1c data point ─────────────────────────────────────────────────────────
export interface HbA1cPoint {
  month: string;            // Arabic month name
  value: number;            // percentage, e.g. 7.1
}

// ── Blood Pressure data point ────────────────────────────────────────────────
export interface BPPoint {
  day: string;              // Arabic day name
  systolic: number;
  diastolic: number;
}

// ── Risk Flag ────────────────────────────────────────────────────────────────
export interface RiskFlag {
  id: number;
  level: 'red' | 'yellow' | 'green';
  icon: string;             // emoji
  titleAr: string;
  titleEn: string;
  descAr: string;
  descEn: string;
  drugs: string[];          // Arabic drug names involved
}

// ── Hakeem History Entry ─────────────────────────────────────────────────────
export interface HakeemEntry {
  date: string;             // YYYY-MM-DD
  event: string;            // Arabic event description
  result: string;           // Arabic result
  doctor: string;           // Arabic doctor name with title
}

// ── Chat ─────────────────────────────────────────────────────────────────────
export interface ChatMessage {
  id: number;
  role: 'ai' | 'user';
  textAr: string;
  textEn: string;
  time: string;             // HH:MM (24-hour)
}

export interface SendMessageRequest {
  patientId: string;
  message: string;          // Arabic text from user
  lang?: 'ar' | 'en';
}

export interface SendMessageResponse {
  message: ChatMessage;
}

// ── Suggested Prompt ─────────────────────────────────────────────────────────
export interface SuggestedPrompt {
  id: number;
  textAr: string;
  textEn: string;
}

// ── Family Member ────────────────────────────────────────────────────────────
export interface FamilyMember {
  id: number;
  nameAr: string;
  role: 'patient' | 'spouse' | 'son' | 'daughter' | 'parent' | 'other';
  avatar: string;           // single Arabic letter for initials display
  color: string;            // hex
  healthScore: number;      // 0–100
}

export interface FamilySummary {
  avgHealthScore: number;
  weeklyAppointments: number;
  activeMedications: number;
  pendingLabResults: number;
}

// ── Prescription Analysis (OCR upload) ───────────────────────────────────────
export interface PrescriptionAnalysisResult {
  medicationCount: number;
  warningCount: number;
  allergyCount: number;
  riskFlags: RiskFlag[];
  extractedMedications: {
    drug: string;           // Arabic drug name
    note: string;           // Arabic note about compatibility
    ok: boolean;
  }[];
}

// ── Generic API wrapper ──────────────────────────────────────────────────────
export interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
  timestamp: string;        // ISO 8601
}

// ── Generic fetch state ──────────────────────────────────────────────────────
export interface FetchState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}
