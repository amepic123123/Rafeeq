// ─── Rafeeq — Mock fallback data ──────────────────────────────────────────────
// Used by api.ts when NEXT_PUBLIC_API_URL is unset or a request fails.
// This is the ONLY file that should contain hardcoded content.
// All components must consume data via hooks, never by importing this directly.

import type {
  Patient, HealthScoreData, QuickStats, Insight, Medication,
  HbA1cPoint, BPPoint, RiskFlag, HakeemEntry, ChatMessage,
  SuggestedPrompt, FamilyMember, FamilySummary, PrescriptionAnalysisResult,
} from './types';

export const MOCK_PATIENT: Patient = {
  id: 'JO-2026-KHL-4821',
  nameAr: 'خالد العمري',
  nameEn: 'Khalid Al-Omari',
  age: 52,
  gender: 'male',
  nationalId: '9****3847',
  bloodType: 'A+',
  city: 'عمّان',
  healthScore: 74,
  hakeemSynced: true,
  lastSyncedAt: '2026-05-12T08:30:00Z',
  conditions: ['داء السكري من النوع 2', 'ارتفاع ضغط الدم', 'خلل شحميات الدم'],
  allergies: ['البنسلين', 'السلفا'],
};

export const MOCK_HEALTH_SCORE: HealthScoreData = {
  overall: 74,
  subMetrics: [
    { label: 'التزام الدواء', value: 95, color: '#22C55E' },
    { label: 'نشاط بدني',    value: 55, color: '#F59E0B' },
    { label: 'تغذية',        value: 70, color: '#52B788' },
  ],
};

export const MOCK_QUICK_STATS: QuickStats = {
  hba1c:               '7.1%',
  hba1cDelta:          '↓ 0.3%',
  hba1cGood:           true,
  bloodPressure:       '138/88',
  bloodPressureDelta:  '↓ تحسّن',
  bloodPressureGood:   true,
  medicationToday:     '4/4',
  medicationDelta:     '✓ مكتمل',
  medicationGood:      true,
};

export const MOCK_INSIGHTS: Insight[] = [
  {
    id: 1,
    emoji: '💊',
    textAr: 'يا خالد، سكرك مستقر اليوم — ممتاز! حافظ على مواعيد الدواء.',
    textEn: 'Ya Khalid, your sugar is stable today — excellent! Keep up with your medication schedule.',
    time: 'قبل ساعتين',
    tag: 'سكر الدم',
    severity: 'green',
  },
  {
    id: 2,
    emoji: '🩺',
    textAr: 'ضغطك كان 138/88 الصبح — خذ نفسك واسترح شوي.',
    textEn: 'Your BP was 138/88 this morning — take it easy today.',
    time: 'الصبح',
    tag: 'ضغط الدم',
    severity: 'yellow',
  },
  {
    id: 3,
    emoji: '🌙',
    textAr: 'تذكير: موعد دواء ميتفورمين بعد الإفطار الساعة 7 مساءً.',
    textEn: 'Reminder: Metformin dose after Iftar at 7 PM.',
    time: 'اليوم',
    tag: 'رمضان',
    severity: 'blue',
  },
  {
    id: 4,
    emoji: '✅',
    textAr: 'سحا وعافية يا خالد — تحليل HbA1c تحسّن 0.3% هذا الشهر!',
    textEn: 'Saha w Afieh ya Khalid — HbA1c improved by 0.3% this month!',
    time: 'أمس',
    tag: 'تحاليل',
    severity: 'green',
  },
];

export const MOCK_MEDICATIONS: Medication[] = [
  { id: 1, name: 'ميتفورمين 1000 ملغ', nameEn: 'Metformin 1000mg',      dose: 'مرة بعد الإفطار',        doseEn: 'Once after Iftar',          ramadan: true,  timing: 'iftar',  color: '#2D6A4F' },
  { id: 2, name: 'أملوديبين 5 ملغ',    nameEn: 'Amlodipine 5mg',        dose: 'مرة صباحاً (قبل السحور)', doseEn: 'Once morning (before Suhoor)', ramadan: true, timing: 'suhoor', color: '#8B5CF6' },
  { id: 3, name: 'روسوفاستاتين 20 ملغ', nameEn: 'Rosuvastatin 20mg',     dose: 'مرة قبل النوم',           doseEn: 'Once before sleep',         ramadan: false, timing: 'night',  color: '#F97316' },
  { id: 4, name: 'أسبرين 100 ملغ',     nameEn: 'Aspirin 100mg',         dose: 'مرة مع الإفطار',          doseEn: 'Once with Iftar',           ramadan: true,  timing: 'iftar',  color: '#EF4444' },
];

export const MOCK_HBA1C: HbA1cPoint[] = [
  { month: 'نوفمبر', value: 8.4 },
  { month: 'ديسمبر', value: 8.1 },
  { month: 'يناير',  value: 7.9 },
  { month: 'فبراير', value: 7.7 },
  { month: 'مارس',   value: 7.5 },
  { month: 'إبريل',  value: 7.4 },
  { month: 'مايو',   value: 7.1 },
];

export const MOCK_BP: BPPoint[] = [
  { day: 'الأحد',    systolic: 145, diastolic: 92 },
  { day: 'الإثنين',  systolic: 142, diastolic: 90 },
  { day: 'الثلاثاء', systolic: 138, diastolic: 88 },
  { day: 'الأربعاء', systolic: 140, diastolic: 87 },
  { day: 'الخميس',   systolic: 135, diastolic: 85 },
  { day: 'الجمعة',   systolic: 132, diastolic: 84 },
  { day: 'السبت',    systolic: 138, diastolic: 88 },
];

export const MOCK_RISK_FLAGS: RiskFlag[] = [
  {
    id: 1, level: 'red', icon: '⚠️',
    titleAr: 'تفاعل دوائي محتمل', titleEn: 'Potential Drug Interaction',
    descAr: 'الجمع بين وارفارين والأسبرين يرفع خطر النزيف بشكل ملحوظ.',
    descEn: 'Combining Warfarin with Aspirin significantly increases bleeding risk.',
    drugs: ['وارفارين', 'أسبرين'],
  },
  {
    id: 2, level: 'yellow', icon: '🫘',
    titleAr: 'مراقبة وظائف الكلى', titleEn: 'Kidney Function Watch',
    descAr: 'ميتفورمين يستدعي مراقبة دورية لـ eGFR — آخر قراءة: 58 مل/دقيقة.',
    descEn: 'Metformin requires periodic eGFR monitoring — last reading: 58 mL/min.',
    drugs: ['ميتفورمين'],
  },
  {
    id: 3, level: 'red', icon: '🚨',
    titleAr: 'حساسية موثقة', titleEn: 'Documented Allergy',
    descAr: 'المريض لديه حساسية من البنسلين — الوصفة تحتوي على أموكسيسيلين!',
    descEn: 'Patient has documented Penicillin allergy — prescription contains Amoxicillin!',
    drugs: ['أموكسيسيلين'],
  },
  {
    id: 4, level: 'green', icon: '✅',
    titleAr: 'جرعة أملوديبين آمنة', titleEn: 'Amlodipine Dose Safe',
    descAr: 'الجرعة مناسبة لحالة المريض وتاريخه الصحي في حكيم.',
    descEn: 'Dose is appropriate given patient\'s condition and Hakeem health history.',
    drugs: ['أملوديبين'],
  },
];

export const MOCK_HAKEEM_HISTORY: HakeemEntry[] = [
  { date: '2026-03-15', event: 'فحص HbA1c',           result: '7.4%',    doctor: 'د. سمير النجار' },
  { date: '2026-02-01', event: 'مراجعة قلبية',         result: 'طبيعي',   doctor: 'د. ليلى حداد'  },
  { date: '2026-01-10', event: 'تجديد وصفة ميتفورمين', result: 'موافق',   doctor: 'د. خالد زريق'  },
  { date: '2025-11-22', event: 'فحص وظائف كلى',        result: 'eGFR 58', doctor: 'د. سمير النجار' },
];

export const MOCK_CHAT_MESSAGES: ChatMessage[] = [
  { id: 1, role: 'ai',   textAr: 'مرحبا بك يا خالد! 👋 أنا رفيق، مساعدك الصحي الذكي. كيف تقدر أساعدك اليوم؟', textEn: "Welcome Khalid! 👋 I'm Rafeeq, your smart health assistant. How can I help you today?", time: '09:00' },
  { id: 2, role: 'user', textAr: 'شو رأيك بتحاليلي الأخيرة؟',                                                     textEn: 'What do you think about my recent labs?',                                             time: '09:01' },
  { id: 3, role: 'ai',   textAr: 'مبروك يا خالد! 🎉 HbA1c تحسّن من 7.4% إلى 7.1% — هاد تقدم ممتاز خلال شهر. ضغطك كمان ماشي تمام. بس لازم نراقب وظائف الكلى الشهر الجاي. سحا وعافية!', textEn: "Mabrouk ya Khalid! 🎉 HbA1c improved from 7.4% to 7.1% — excellent progress. Saha w Afieh!", time: '09:01' },
];

export const MOCK_SUGGESTED_PROMPTS: SuggestedPrompt[] = [
  { id: 1, textAr: 'كيف أعدّل دوائي لرمضان؟',   textEn: 'Adjust for Ramadan'      },
  { id: 2, textAr: 'فسّرلي تحاليلي',             textEn: 'Explain my labs'         },
  { id: 3, textAr: 'شو الأكل المناسب لسكري؟',    textEn: 'Diet tips for diabetes'  },
  { id: 4, textAr: 'متى آخذ ضغطي؟',              textEn: 'When to check BP?'       },
];

export const MOCK_FAMILY_MEMBERS: FamilyMember[] = [
  { id: 1, nameAr: 'خالد العمري', role: 'patient',  avatar: 'خ', color: '#2D6A4F', healthScore: 74 },
  { id: 2, nameAr: 'سمر العمري',  role: 'spouse',   avatar: 'س', color: '#8B5CF6', healthScore: 88 },
  { id: 3, nameAr: 'يوسف خالد',  role: 'son',      avatar: 'ي', color: '#F97316', healthScore: 95 },
  { id: 4, nameAr: 'لينا خالد',  role: 'daughter', avatar: 'ل', color: '#EC4899', healthScore: 92 },
];

export const MOCK_FAMILY_SUMMARY: FamilySummary = {
  avgHealthScore:        87,
  weeklyAppointments:    3,
  activeMedications:     7,
  pendingLabResults:     1,
};

export const MOCK_PRESCRIPTION_RESULT: PrescriptionAnalysisResult = {
  medicationCount: 4,
  warningCount:    2,
  allergyCount:    1,
  riskFlags: MOCK_RISK_FLAGS,
  extractedMedications: [
    { drug: 'ميتفورمين 1000 ملغ', note: 'متوافق مع سجل حكيم',          ok: true  },
    { drug: 'أموكسيسيلين 500 ملغ', note: '⚠️ حساسية موثقة من البنسلين!', ok: false },
    { drug: 'أملوديبين 5 ملغ',     note: 'يتابع نفس الجرعة',            ok: true  },
    { drug: 'وارفارين 5 ملغ',      note: '⚠️ تفاعل مع الأسبرين',        ok: false },
  ],
};
