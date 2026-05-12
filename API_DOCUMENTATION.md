# Rafeeq API — Backend Contract

> **Last updated:** 2026-05-12  
> **Frontend repo:** `front/`  
> **API client:** `src/lib/api.ts`  
> **Types:** `src/lib/types.ts`

This document specifies every HTTP endpoint that the Rafeeq frontend calls.  
The frontend uses a **backend-first, mock-fallback** pattern: if `NEXT_PUBLIC_API_URL` is set and the request succeeds, live data is used. If it is unset or the request fails, the UI silently falls back to the mock data in `src/lib/data.ts`.

---

## Base URL

```
NEXT_PUBLIC_API_URL=https://api.rafeeq.jo   # production
NEXT_PUBLIC_API_URL=http://localhost:8000    # local dev
```

Set this in `.env.local` (copy from `.env.example`).

---

## Response Envelope

**Every endpoint** must return this JSON envelope:

```json
{
  "success": true,
  "data": { },
  "message": null,
  "timestamp": "2026-05-12T08:30:00Z"
}
```

| Field | Type | Notes |
|---|---|---|
| `success` | `boolean` | `false` triggers the mock fallback + console warning |
| `data` | `T` | The typed payload (see per-endpoint schemas below) |
| `message` | `string \| null` | Optional error/info message |
| `timestamp` | `string` | ISO 8601 server timestamp |

**Error responses** should also use this envelope with `success: false` and an HTTP status >= 400:

```json
{
  "success": false,
  "data": null,
  "message": "Patient not found",
  "timestamp": "2026-05-12T08:30:00Z"
}
```

---

## Authentication

The frontend does not currently inject auth headers. All endpoints are assumed to be authenticated via a session cookie or a gateway-level token injected by the infra team. If bearer token auth is added, update `apiFetch()` in `src/lib/api.ts` to include `Authorization: Bearer <token>`.

---

## Endpoints

### 1. Patient Profile

#### `GET /api/patients/{patientId}`

Returns the patient's full profile as stored in Hakeem.

**Path params:**
| Param | Type | Example |
|---|---|---|
| `patientId` | `string` | `JO-2026-KHL-4821` |

**Response `data` schema:**
```ts
{
  id:           string        // Hakeem unique ID
  nameAr:       string        // Full Arabic name
  nameEn:       string        // Full English name
  age:          number
  gender:       "male" | "female"
  nationalId:   string        // Masked, e.g. "9****3847"
  bloodType:    string        // e.g. "A+"
  city:         string        // Arabic city name
  healthScore:  number        // 0-100 composite score
  hakeemSynced: boolean       // Whether record is live-synced from Hakeem
  lastSyncedAt: string        // ISO 8601
  conditions:   string[]      // Arabic chronic condition names
  allergies:    string[]      // Arabic allergy names
}
```

**Example response:**
```json
{
  "success": true,
  "data": {
    "id": "JO-2026-KHL-4821",
    "nameAr": "خالد العمري",
    "nameEn": "Khalid Al-Omari",
    "age": 52,
    "gender": "male",
    "nationalId": "9****3847",
    "bloodType": "A+",
    "city": "عمّان",
    "healthScore": 74,
    "hakeemSynced": true,
    "lastSyncedAt": "2026-05-12T08:30:00Z",
    "conditions": ["داء السكري من النوع 2", "ارتفاع ضغط الدم"],
    "allergies": ["البنسلين"]
  },
  "message": null,
  "timestamp": "2026-05-12T08:30:00Z"
}
```

---

### 2. Health Score

#### `GET /api/patients/{patientId}/health-score`

Returns the composite health score and per-metric breakdown displayed in the circular gauge.

**Response `data` schema:**
```ts
{
  overall:    number        // 0-100
  subMetrics: Array<{
    label: string           // Arabic label, e.g. "التزام الدواء"
    value: number           // 0-100
    color: string           // hex color for the progress bar
  }>
}
```

**Example response:**
```json
{
  "success": true,
  "data": {
    "overall": 74,
    "subMetrics": [
      { "label": "التزام الدواء", "value": 95, "color": "#22C55E" },
      { "label": "نشاط بدني",    "value": 55, "color": "#F59E0B" },
      { "label": "تغذية",        "value": 70, "color": "#52B788" }
    ]
  },
  "message": null,
  "timestamp": "2026-05-12T08:30:00Z"
}
```

---

### 3. Quick Stats (Hero KPIs)

#### `GET /api/patients/{patientId}/quick-stats`

Returns the three KPI chips shown on the Patient Dashboard hero card.

**Response `data` schema:**
```ts
{
  hba1c:                string    // e.g. "7.1%"
  hba1cDelta:           string    // e.g. "0.3% تحسّن"
  hba1cGood:            boolean
  bloodPressure:        string    // e.g. "138/88"
  bloodPressureDelta:   string    // e.g. "تحسّن"
  bloodPressureGood:    boolean
  medicationToday:      string    // e.g. "4/4"
  medicationDelta:      string    // e.g. "مكتمل"
  medicationGood:       boolean
}
```

---

### 4. AI Insight Feed

#### `GET /api/patients/{patientId}/insights`

Returns the AI-generated insight feed shown on the Patient Dashboard. Messages **must** be in Jordanian Arabic dialect.

**Response `data` schema:**
```ts
Array<{
  id:       number
  emoji:    string              // single emoji
  textAr:   string              // Jordanian dialect Arabic text
  textEn:   string              // English translation
  time:     string              // Relative time string in Arabic, e.g. "قبل ساعتين"
  tag:      string              // Arabic category tag, e.g. "سكر الدم"
  severity: "green" | "yellow" | "red" | "blue"
}>
```

**Tone guide:**
- `severity: "green"` — positive, use phrases like "سحا وعافية", "مبروك", "ممتاز"
- `severity: "yellow"` — gentle caution, use "خذ نفسك", "راقب"
- `severity: "red"` — urgent, clear language
- `severity: "blue"` — informational reminder

---

### 5. Medications

#### `GET /api/patients/{patientId}/medications`

Returns all active medications with Ramadan-aware timing metadata.

**Response `data` schema:**
```ts
Array<{
  id:      number
  name:    string               // Arabic medication name + dose
  nameEn:  string
  dose:    string               // Arabic dosage instruction
  doseEn:  string
  ramadan: boolean              // true = dose time adjusted for Ramadan
  timing:  "iftar" | "suhoor" | "night" | "morning" | "noon"
  color:   string               // hex — assigned by backend for consistent UI color
}>
```

**Note:** `color` must be stable across requests — the Ramadan timeline groups medications by `timing`.

---

### 6. HbA1c History

#### `GET /api/patients/{patientId}/labs/hba1c`

Returns monthly HbA1c readings for the area chart.

**Query params:**
| Param | Type | Default |
|---|---|---|
| `months` | `number` | `7` |

**Response `data` schema:**
```ts
Array<{
  month: string     // Arabic month name, e.g. "مايو"
  value: number     // HbA1c percentage, e.g. 7.1
}>
```

Return in **chronological order** (oldest first).

---

### 7. Blood Pressure History

#### `GET /api/patients/{patientId}/labs/blood-pressure`

Returns daily BP readings for the line chart.

**Query params:**
| Param | Type | Default |
|---|---|---|
| `days` | `number` | `7` |

**Response `data` schema:**
```ts
Array<{
  day:       string    // Arabic day name, e.g. "الأحد"
  systolic:  number    // mmHg
  diastolic: number    // mmHg
}>
```

Return in chronological order (oldest first).

---

### 8. Risk Flags

#### `GET /api/patients/{patientId}/risk-flags`

Returns standing risk flags for the Doctor View traffic-light panel.

**Response `data` schema:**
```ts
Array<{
  id:      number
  level:   "red" | "yellow" | "green"
  icon:    string              // emoji
  titleAr: string
  titleEn: string
  descAr:  string
  descEn:  string
  drugs:   string[]            // Arabic drug names involved
}>
```

Sort order: red first, then yellow, then green.

---

### 9. Hakeem History

#### `GET /api/patients/{patientId}/hakeem-history`

Returns the patient's historical visits from the Hakeem system.

**Query params:**
| Param | Type | Default |
|---|---|---|
| `limit` | `number` | `10` |

**Response `data` schema:**
```ts
Array<{
  date:   string    // YYYY-MM-DD
  event:  string    // Arabic description
  result: string    // Arabic result
  doctor: string    // Arabic doctor name with title, e.g. "د. سمير النجار"
}>
```

---

### 10. Prescription Analysis (OCR Upload)

#### `POST /api/prescriptions/analyze`

Accepts a prescription file (PDF or image) via `multipart/form-data`, performs OCR and AI risk analysis.

**Request body (multipart/form-data):**
| Field | Type | Notes |
|---|---|---|
| `file` | `File` | PDF, JPG, or PNG — max 10 MB |
| `patientId` | `string` | Cross-check against patient allergies + medications |

**Response `data` schema:**
```ts
{
  medicationCount: number
  warningCount:    number
  allergyCount:    number
  riskFlags: RiskFlag[]           // same shape as endpoint #8
  extractedMedications: Array<{
    drug: string                  // Arabic drug name from OCR
    note: string                  // Arabic compatibility note
    ok:   boolean                 // false = conflict detected
  }>
}
```

**Performance target:** < 5 seconds end-to-end. The frontend shows a scan-line animation during processing.

---

### 11. Chat History

#### `GET /api/patients/{patientId}/chat/history`

Returns previous messages for the AI chat session.

**Query params:**
| Param | Type | Default |
|---|---|---|
| `limit` | `number` | `50` |

**Response `data` schema:**
```ts
Array<{
  id:     number
  role:   "ai" | "user"
  textAr: string
  textEn: string
  time:   string    // HH:MM 24-hour format
}>
```

Return in chronological order (oldest first). First message should be the AI greeting.

---

### 12. Send Chat Message

#### `POST /api/patients/{patientId}/chat/message`

Sends a user message and returns the AI reply.

**Request body (JSON):**
```ts
{
  patientId: string
  message:   string    // Arabic text from the user
  lang?:     "ar" | "en"   // defaults to "ar"
}
```

**Response `data` schema:**
```ts
{
  id:     number
  role:   "ai"
  textAr: string        // AI response in Jordanian Arabic dialect
  textEn: string
  time:   string        // HH:MM
}
```

**Performance target:** < 3 seconds. The frontend shows a typing indicator while waiting.

---

### 13. Suggested Prompts

#### `GET /api/patients/{patientId}/chat/suggested-prompts`

Returns the AI-curated list of suggested prompt pills.

**Response `data` schema:**
```ts
Array<{
  id:     number
  textAr: string    // Arabic prompt text
  textEn: string    // English prompt text
}>
```

Return 4-6 prompts maximum. Prompts should be contextual to the patient's conditions.

---

### 14. Family Members

#### `GET /api/patients/{patientId}/family`

Returns all family members linked to the primary patient's account.

**Response `data` schema:**
```ts
Array<{
  id:          number
  nameAr:      string
  role:        "patient" | "spouse" | "son" | "daughter" | "parent" | "other"
  avatar:      string    // single Arabic letter for initials
  color:       string    // hex — must be stable across requests
  healthScore: number    // 0-100
}>
```

---

### 15. Family Summary

#### `GET /api/patients/{patientId}/family/summary`

Returns aggregated health statistics across all family members.

**Response `data` schema:**
```ts
{
  avgHealthScore:      number
  weeklyAppointments: number
  activeMedications:  number
  pendingLabResults:  number
}
```

---

## Summary Table

| # | Method | Path | Used by | Mock fallback |
|---|---|---|---|---|
| 1 | GET | `/api/patients/{id}` | Dashboard, Sidebar | `MOCK_PATIENT` |
| 2 | GET | `/api/patients/{id}/health-score` | HealthScore widget | `MOCK_HEALTH_SCORE` |
| 3 | GET | `/api/patients/{id}/quick-stats` | Dashboard hero card | `MOCK_QUICK_STATS` |
| 4 | GET | `/api/patients/{id}/insights` | Dashboard insight feed | `MOCK_INSIGHTS` |
| 5 | GET | `/api/patients/{id}/medications` | Dashboard, LabsView | `MOCK_MEDICATIONS` |
| 6 | GET | `/api/patients/{id}/labs/hba1c` | LabsView chart | `MOCK_HBA1C` |
| 7 | GET | `/api/patients/{id}/labs/blood-pressure` | LabsView chart | `MOCK_BP` |
| 8 | GET | `/api/patients/{id}/risk-flags` | DoctorView | `MOCK_RISK_FLAGS` |
| 9 | GET | `/api/patients/{id}/hakeem-history` | DoctorView | `MOCK_HAKEEM_HISTORY` |
| 10 | POST | `/api/prescriptions/analyze` | DoctorView upload | `MOCK_PRESCRIPTION_RESULT` |
| 11 | GET | `/api/patients/{id}/chat/history` | ChatView | `MOCK_CHAT_MESSAGES` |
| 12 | POST | `/api/patients/{id}/chat/message` | ChatView send | hardcoded AI reply |
| 13 | GET | `/api/patients/{id}/chat/suggested-prompts` | ChatView pills | `MOCK_SUGGESTED_PROMPTS` |
| 14 | GET | `/api/patients/{id}/family` | FamilyView | `MOCK_FAMILY_MEMBERS` |
| 15 | GET | `/api/patients/{id}/family/summary` | FamilyView | `MOCK_FAMILY_SUMMARY` |

---

## CORS

```
Access-Control-Allow-Origin: http://localhost:3000   (dev)
Access-Control-Allow-Origin: https://rafeeq.jo       (prod)
Access-Control-Allow-Methods: GET, POST, OPTIONS
Access-Control-Allow-Headers: Content-Type, Accept, Authorization
```

---

## Frontend env setup

```bash
# .env.local
NEXT_PUBLIC_API_URL=http://localhost:8000
```

Once set, all 15 endpoints above will be called live. Remove or leave empty to run in mock/demo mode with no backend dependency.
