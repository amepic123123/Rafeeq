'use client';

import { useRef, useCallback, useState } from 'react';
import { useRiskFlags, useHakeemHistory, usePrescriptionAnalysis, Skeleton, usePatient, useHealthScore } from '@/lib/hooks';
import LabsView from '@/components/LabsView';

export default function DoctorView() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPatient, setSelectedPatient] = useState<string | null>(null);
  const [innerTab, setInnerTab] = useState<'overview' | 'labs' | 'ai'>('overview');
  const [symptoms, setSymptoms] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [dictationLang, setDictationLang] = useState<'ar-JO' | 'en-AE'>('ar-JO');
  const recognitionRef = useRef<any>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: patient, loading: lPatient } = usePatient(selectedPatient || undefined);
  const { data: health, loading: lHealth } = useHealthScore(selectedPatient || undefined);

  const { data: riskFlags,     loading: lRisk }    = useRiskFlags(selectedPatient || undefined);
  const { data: hakeemHistory, loading: lHakeem }  = useHakeemHistory(selectedPatient || undefined);
  const {
    result, isScanning, progress, analyze, reset,
  } = usePrescriptionAnalysis(selectedPatient || '');

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) analyze(file);
  }, [analyze]);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) analyze(file);
  }, [analyze]);

  const levelClass = (level: string) => level === 'red' ? 'risk-red' : level === 'yellow' ? 'risk-yellow' : 'risk-green';
  const levelLabel = (level: string) => level === 'red' ? '🔴 خطر' : level === 'yellow' ? '🟡 تنبيه' : '🟢 آمن';

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setSelectedPatient(searchQuery.trim());
    }
  };

  const handleBack = () => {
    setSelectedPatient(null);
    setSearchQuery('');
    setInnerTab('overview');
    setSymptoms('');
    setAiSuggestion(null);
    reset();
  };

  const handleAiConsult = () => {
    if (!symptoms.trim()) return;
    setIsAiLoading(true);
    setAiSuggestion(null);
    setTimeout(() => {
      setIsAiLoading(false);
      setAiSuggestion(`بناءً على الأعراض الحالية ("${symptoms}") وتاريخ المريض الطبي (ارتفاع ضغط الدم، سكري من النوع الثاني)، يُنصح بتجنب الأدوية التي ترفع ضغط الدم مثل مضادات الاحتقان الموضعية. \n\nالتوصية المبدئية:\n1. Paracetamol 500mg للتحكم بالألم والحرارة.\n2. إجراء تحليل دم شامل (CBC) للتحقق من وجود التهاب.\nيرجى مراجعة التفاعلات الدوائية المحتملة مع "Metformin" و "Amlodipine" المسجلة في ملف المريض.`);
    }, 2500);
  };

  const handleMicrophoneClick = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('عذراً، متصفحك لا يدعم خاصية الإملاء الصوتي.');
      return;
    }

    if (isRecording) {
      // If already recording, stop it
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsRecording(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognitionRef.current = recognition;
    
    recognition.lang = dictationLang;
    recognition.continuous = true;
    recognition.interimResults = true;
    
    let currentFinalTranscript = symptoms;

    recognition.onstart = () => setIsRecording(true);
    
    recognition.onresult = (event: any) => {
      let interimTranscript = '';
      let newFinalTranscript = '';
      
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          newFinalTranscript += event.results[i][0].transcript;
        } else {
          interimTranscript += event.results[i][0].transcript;
        }
      }
      
      if (newFinalTranscript) {
        currentFinalTranscript += (currentFinalTranscript ? ' ' : '') + newFinalTranscript;
        setSymptoms(currentFinalTranscript);
      } else if (interimTranscript) {
        // Optional: show interim text if needed, but for simplicity we append it dynamically
        setSymptoms(currentFinalTranscript + (currentFinalTranscript ? ' ' : '') + interimTranscript);
      }
    };
    
    recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      if (event.error === 'network') {
        alert('حدث خطأ في الاتصال بخوادم التعرف على الصوت (Network Error). يرجى التحقق من اتصالك بالإنترنت أو إيقاف الـ VPN، أو استخدام الكتابة اليدوية بدلاً من ذلك.');
      }
      setIsRecording(false);
    };
    
    recognition.onend = () => {
      setIsRecording(false);
    };
    
    try {
      recognition.start();
    } catch (e) {
      console.error('Failed to start speech recognition:', e);
      setIsRecording(false);
    }
  };

  if (!selectedPatient) {
    return (
      <div className="p-6 space-y-8 max-w-5xl mx-auto" dir="rtl">
        {/* Doctor Header */}
        <div className="flex items-center justify-between fade-up-1">
          <div>
            <h2 className="text-2xl font-bold" style={{ color: '#1A2B22', fontFamily: "'IBM Plex Sans Arabic'" }}>مرحباً بك د. أحمد صبحي</h2>
            <p className="text-sm mt-1" style={{ color: '#8FA89B', fontFamily: "'IBM Plex Sans Arabic'" }}>بوابة حكيم الطبية المتقدمة</p>
          </div>
          <div className="text-left bg-white p-3 rounded-2xl border border-emerald-100 shadow-sm text-center min-w-[100px]">
            <div className="text-xl font-bold" style={{ color: '#2D6A4F' }}>12</div>
            <div className="text-[10px]" style={{ color: '#8FA89B', fontFamily: "'IBM Plex Sans Arabic'" }}>مريض اليوم</div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="glass-card p-8 fade-up-2 text-center">
          <div className="w-16 h-16 rounded-full mx-auto flex items-center justify-center mb-4" style={{ background: 'rgba(82,183,136,0.1)' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#2D6A4F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          </div>
          <h3 className="font-semibold text-lg mb-6" style={{ color: '#1A2B22', fontFamily: "'IBM Plex Sans Arabic'" }}>البحث في السجل الوطني (حكيم)</h3>
          <form onSubmit={handleSearch} className="flex max-w-xl mx-auto relative shadow-sm rounded-xl">
            <input
              type="text"
              placeholder="أدخل الرقم الوطني للمريض (مثال: JO-2026-KHL-4821)"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="flex-1 px-5 py-3.5 rounded-r-xl border border-l-0 outline-none text-sm transition-all focus:border-emerald-500"
              style={{ borderColor: 'rgba(82,183,136,0.3)', background: 'rgba(255,255,255,0.9)', color: '#1A2B22', fontFamily: "'IBM Plex Sans Arabic'" }}
              dir="rtl"
            />
            <button
              type="submit"
              className="px-8 rounded-l-xl text-white font-semibold transition-all hover:opacity-90 active:scale-95"
              style={{ background: 'linear-gradient(135deg, #2D6A4F, #52B788)', fontFamily: "'IBM Plex Sans Arabic'" }}
            >
              بحث
            </button>
          </form>
        </div>

        {/* Recent Patients */}
        <div className="fade-up-3">
          <h3 className="font-semibold mb-4 flex items-center gap-2" style={{ color: '#1A2B22', fontFamily: "'IBM Plex Sans Arabic'" }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
            المرضى المراجعين حديثاً
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {[
              { id: 'JO-2026-KHL-4821', name: 'خالد العمري', age: 74, lastVisit: 'اليوم، 08:30 ص', status: 'مراجعة أدوية' },
              { id: 'JO-2025-SRA-9923', name: 'سارة أحمد', age: 42, lastVisit: 'أمس', status: 'تحاليل مخبرية' },
              { id: 'JO-2024-MHD-1102', name: 'محمد النجار', age: 58, lastVisit: 'منذ 3 أيام', status: 'متابعة سكري' },
            ].map((p, i) => (
              <div
                key={p.id}
                onClick={() => setSelectedPatient(p.id)}
                className={`glass-card p-5 cursor-pointer hover:-translate-y-1 hover:shadow-md transition-all duration-300 fade-up-${i+4}`}
              >
                <div className="flex items-center gap-3 mb-4 border-b pb-3 border-emerald-50">
                  <div className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-inner" style={{ background: 'linear-gradient(135deg, #40916C, #74C69D)' }}>
                    {p.name.charAt(0)}
                  </div>
                  <div>
                    <div className="font-semibold text-sm" style={{ color: '#1A2B22', fontFamily: "'IBM Plex Sans Arabic'" }}>{p.name}</div>
                    <div className="text-[11px]" style={{ color: '#8FA89B', fontFamily: "'Inter'" }}>{p.id}</div>
                  </div>
                </div>
                <div className="text-xs space-y-2" style={{ color: '#4A6357', fontFamily: "'IBM Plex Sans Arabic'" }}>
                  <div className="flex justify-between items-center"><span className="text-gray-400">العمر:</span> <span className="font-medium">{p.age} سنة</span></div>
                  <div className="flex justify-between items-center"><span className="text-gray-400">آخر زيارة:</span> <span className="font-medium">{p.lastVisit}</span></div>
                  <div className="flex justify-between items-center"><span className="text-gray-400">الحالة:</span> <span className="font-medium px-2 py-0.5 rounded-md" style={{ background: 'rgba(82,183,136,0.1)', color: '#2D6A4F' }}>{p.status}</span></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto" dir="rtl">

      {/* Header */}
      <div className="fade-up-1 flex items-center justify-between">
        <div>
          <button onClick={handleBack} className="flex items-center gap-1.5 text-xs font-semibold mb-2 transition-colors hover:text-emerald-700" style={{ color: '#52B788', fontFamily: "'IBM Plex Sans Arabic'" }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M5 12l4-4M5 12l4 4"/></svg>
            العودة للبحث
          </button>
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-bold" style={{ color: '#1A2B22', fontFamily: "'IBM Plex Sans Arabic'" }}>ملف المريض: {lPatient ? '...' : patient?.nameAr || selectedPatient}</h2>
            <span className="text-xs px-2 py-0.5 rounded-full font-semibold" style={{ background: 'rgba(45,106,79,0.1)', color: '#2D6A4F', fontFamily: "'Inter'" }}>{selectedPatient}</span>
          </div>
        </div>
        
        {/* Quick Vitals Summary */}
        <div className="hidden md:flex items-center gap-4 bg-white p-3 rounded-2xl border border-emerald-50 shadow-sm">
          <div className="text-center px-3 border-l border-gray-100">
            <div className="text-[10px] text-gray-400 mb-0.5" style={{ fontFamily: "'IBM Plex Sans Arabic'" }}>العمر</div>
            <div className="text-sm font-bold text-gray-800">{lPatient ? '-' : patient?.age}</div>
          </div>
          <div className="text-center px-3 border-l border-gray-100">
            <div className="text-[10px] text-gray-400 mb-0.5" style={{ fontFamily: "'IBM Plex Sans Arabic'" }}>فصيلة الدم</div>
            <div className="text-sm font-bold text-red-500">{lPatient ? '-' : patient?.bloodType}</div>
          </div>
          <div className="text-center px-3">
            <div className="text-[10px] text-gray-400 mb-0.5" style={{ fontFamily: "'IBM Plex Sans Arabic'" }}>المؤشر الصحي</div>
            <div className="text-sm font-bold" style={{ color: '#2D6A4F' }}>{lHealth ? '-' : health?.overall}/100</div>
          </div>
        </div>
      </div>

      {/* Inner Tabs */}
      <div className="flex items-center gap-4 border-b border-emerald-100 pb-2 fade-up-2">
        <button
          onClick={() => setInnerTab('overview')}
          className={`px-4 py-2 font-semibold text-sm rounded-lg transition-all ${
            innerTab === 'overview'
              ? 'bg-emerald-50 text-emerald-800'
              : 'text-gray-500 hover:bg-gray-50'
          }`}
          style={{ fontFamily: "'IBM Plex Sans Arabic'" }}
        >
          النظرة العامة والوصفات
        </button>
        <button
          onClick={() => setInnerTab('labs')}
          className={`px-4 py-2 font-semibold text-sm rounded-lg transition-all ${
            innerTab === 'labs'
              ? 'bg-emerald-50 text-emerald-800'
              : 'text-gray-500 hover:bg-gray-50'
          }`}
          style={{ fontFamily: "'IBM Plex Sans Arabic'" }}
        >
          التحاليل المخبرية
        </button>
        <button
          onClick={() => setInnerTab('ai')}
          className={`px-4 py-2 font-semibold text-sm rounded-lg transition-all flex items-center gap-2 ${
            innerTab === 'ai'
              ? 'bg-emerald-50 text-emerald-800'
              : 'text-gray-500 hover:bg-gray-50'
          }`}
          style={{ fontFamily: "'IBM Plex Sans Arabic'" }}
        >
          <span className="text-lg">✨</span> مساعد الوصفات
        </button>
      </div>

      {innerTab === 'overview' ? (
        <>
          {/* Upload + Risk */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 fade-up-2">

            {/* OCR Upload */}
        <div className="glass-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold" style={{ color: '#1A2B22', fontFamily: "'IBM Plex Sans Arabic'" }}>📄 رفع الوصفة الطبية</h3>
            <span className="text-xs" style={{ color: '#8FA89B' }}>OCR + AI</span>
          </div>

          <div
            id="ocr-upload-zone"
            className={`upload-zone relative p-8 flex flex-col items-center justify-center gap-3 cursor-pointer`}
            onDragOver={e => e.preventDefault()}
            onDrop={handleDrop}
            onClick={() => !isScanning && !result && fileInputRef.current?.click()}
          >
            <input ref={fileInputRef} type="file" accept=".pdf,image/*" className="hidden" onChange={handleFileChange} />

            {isScanning ? (
              <div className="w-full flex flex-col items-center gap-4">
                <div className="relative w-24 h-32 rounded-xl overflow-hidden" style={{ background: 'rgba(45,106,79,0.08)', border: '1px solid rgba(82,183,136,0.2)' }}>
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="mx-3 my-2 h-1.5 rounded-full opacity-30" style={{ background: '#2D6A4F', width: `${60 + i * 8}%` }} />
                  ))}
                  <div className="scan-line absolute left-0 right-0 h-0.5" style={{ background: 'linear-gradient(90deg, transparent, #52B788, transparent)' }} />
                </div>
                <div className="text-sm font-medium gradient-text" style={{ fontFamily: "'Inter'" }}>جاري الفحص بالذكاء الاصطناعي...</div>
                {/* Upload progress bar */}
                {progress > 0 && progress < 100 && (
                  <div className="w-full max-w-[140px] h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(45,106,79,0.10)' }}>
                    <div className="h-full rounded-full transition-all" style={{ width: `${progress}%`, background: 'linear-gradient(90deg, #2D6A4F, #52B788)' }} />
                  </div>
                )}
                <div className="flex gap-1">
                  {[0, 1, 2].map(i => <div key={i} className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ background: '#52B788', animationDelay: `${i * 0.15}s` }} />)}
                </div>
              </div>
            ) : result ? (
              <div className="text-center">
                <div className="text-4xl mb-2">✅</div>
                <div className="font-semibold text-sm" style={{ color: '#2D6A4F', fontFamily: "'IBM Plex Sans Arabic'" }}>تم فحص الوصفة بنجاح!</div>
                <div className="text-xs mt-1" style={{ color: '#8FA89B' }}>
                  {result.medicationCount} أدوية، {result.warningCount} تحذير، {result.allergyCount} حساسية
                </div>
                <button onClick={e => { e.stopPropagation(); reset(); }} className="mt-3 text-xs underline" style={{ color: '#52B788' }}>رفع وصفة جديدة</button>
              </div>
            ) : (
              <>
                <div className="text-4xl">📎</div>
                <div className="text-sm font-medium" style={{ color: '#4A6357', fontFamily: "'IBM Plex Sans Arabic'" }}>اسحب الوصفة هنا أو انقر للاختيار</div>
                <div className="text-xs" style={{ color: '#8FA89B' }}>PDF · JPG · PNG — حتى 10 ميغابايت</div>
              </>
            )}
          </div>
        </div>

        {/* Risk Analysis Panel */}
        <div className="glass-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold" style={{ color: '#1A2B22', fontFamily: "'IBM Plex Sans Arabic'" }}>⚠️ لوحة تحليل المخاطر</h3>
            <div className="flex gap-1.5">
              {['#EF4444', '#F59E0B', '#22C55E'].map(c => <span key={c} className="w-3 h-3 rounded-full" style={{ background: c }} />)}
            </div>
          </div>
          <div className="space-y-3">
            {lRisk
              ? [1, 2, 3, 4].map(i => <Skeleton key={i} h="h-16" />)
              : (result?.riskFlags ?? riskFlags ?? []).map((flag, i) => (
                  <div key={flag.id} className={`p-3 rounded-2xl ${levelClass(flag.level)} fade-up-${i + 2}`}>
                    <div className="flex items-start gap-2">
                      <span className="text-lg shrink-0">{flag.icon}</span>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-sm" style={{ fontFamily: "'IBM Plex Sans Arabic'" }}>{flag.titleAr}</span>
                          <span className="text-[10px] px-2 py-0.5 rounded-full font-bold" style={{ background: 'rgba(0,0,0,0.08)' }}>{levelLabel(flag.level)}</span>
                        </div>
                        <p className="text-xs mt-0.5 leading-relaxed" style={{ fontFamily: "'IBM Plex Sans Arabic'" }}>{flag.descAr}</p>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {flag.drugs.map(d => <span key={d} className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: 'rgba(0,0,0,0.08)', fontFamily: "'IBM Plex Sans Arabic'" }}>{d}</span>)}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
            }
          </div>
        </div>
      </div>

      {/* Hakeem Sync */}
      <div className="glass-card p-5 fade-up-4">
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-semibold" style={{ color: '#1A2B22', fontFamily: "'IBM Plex Sans Arabic'" }}>🔄 مقارنة مع سجل حكيم</h3>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            <span className="text-xs" style={{ color: '#2D6A4F', fontFamily: "'Inter'" }}>متزامن • آخر تحديث: 08:30</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Hakeem history column */}
          <div>
            <div className="text-xs font-semibold mb-3 pb-2 border-b" style={{ color: '#2D6A4F', borderColor: 'rgba(45,106,79,0.15)', fontFamily: "'IBM Plex Sans Arabic'" }}>📋 سجل حكيم السابق</div>
            <div className="space-y-2">
              {lHakeem
                ? [1, 2, 3, 4].map(i => <Skeleton key={i} h="h-12" />)
                : (hakeemHistory ?? []).map(h => (
                    <div key={h.date} className="flex items-center gap-3 p-2.5 rounded-xl" style={{ background: 'rgba(45,106,79,0.04)', border: '1px solid rgba(45,106,79,0.08)' }}>
                      <div className="text-[10px] px-2 py-1 rounded-lg text-center shrink-0" style={{ background: 'rgba(45,106,79,0.10)', color: '#2D6A4F', fontFamily: "'Inter'", minWidth: 68 }}>{h.date}</div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-medium truncate" style={{ color: '#1A2B22', fontFamily: "'IBM Plex Sans Arabic'" }}>{h.event}</div>
                        <div className="text-[11px]" style={{ color: '#8FA89B' }}>{h.doctor} · {h.result}</div>
                      </div>
                    </div>
                  ))
              }
            </div>
          </div>

          {/* New prescription column (from OCR result or placeholder) */}
          <div>
            <div className="text-xs font-semibold mb-3 pb-2 border-b" style={{ color: '#F97316', borderColor: 'rgba(249,115,22,0.15)', fontFamily: "'IBM Plex Sans Arabic'" }}>🆕 الوصفة الجديدة (للمراجعة)</div>
            <div className="space-y-2">
              {(result?.extractedMedications ?? []).map(item => (
                <div key={item.drug} className="flex items-center gap-3 p-2.5 rounded-xl"
                  style={{ background: item.ok ? 'rgba(34,197,94,0.05)' : 'rgba(239,68,68,0.05)', border: item.ok ? '1px solid rgba(34,197,94,0.15)' : '1px solid rgba(239,68,68,0.15)' }}
                >
                  <span className="text-base">{item.ok ? '✅' : '🚨'}</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-medium truncate" style={{ color: '#1A2B22', fontFamily: "'IBM Plex Sans Arabic'" }}>{item.drug}</div>
                    <div className="text-[11px]" style={{ color: item.ok ? '#16A34A' : '#DC2626', fontFamily: "'IBM Plex Sans Arabic'" }}>{item.note}</div>
                  </div>
                </div>
              ))}
              {!result && (
                <div className="text-xs text-center py-6" style={{ color: '#8FA89B', fontFamily: "'IBM Plex Sans Arabic'" }}>
                  ارفع وصفة طبية لتظهر نتائج التحليل هنا
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
      ) : innerTab === 'labs' ? (
        <div className="fade-up-2 -mx-6">
          <LabsView patientId={selectedPatient} />
        </div>
      ) : (
        <div className="fade-up-2 glass-card p-6 md:p-8 max-w-3xl mx-auto mt-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #2D6A4F, #52B788)' }}>
              <span className="text-2xl">✨</span>
            </div>
            <div>
              <h3 className="font-bold text-lg" style={{ color: '#1A2B22', fontFamily: "'IBM Plex Sans Arabic'" }}>المساعد الطبي الذكي</h3>
              <p className="text-xs" style={{ color: '#8FA89B', fontFamily: "'IBM Plex Sans Arabic'" }}>تحليل الأعراض وتقديم توصيات دوائية بناءً على السجل الطبي الكامل</p>
            </div>
          </div>
          
          <div className="space-y-4">
            <div className="relative">
              <label className="block text-sm font-semibold mb-2" style={{ color: '#4A6357', fontFamily: "'IBM Plex Sans Arabic'" }}>الأعراض الحالية للمريض:</label>
              <textarea
                value={symptoms}
                onChange={(e) => setSymptoms(e.target.value)}
                placeholder="مثال: يشكو المريض من صداع نصفي مستمر منذ يومين مع ارتفاع طفيف في الحرارة..."
                className="w-full p-4 pb-12 rounded-xl border outline-none resize-none h-36 transition-colors focus:border-emerald-500"
                style={{ borderColor: 'rgba(82,183,136,0.3)', background: 'rgba(255,255,255,0.8)', color: '#1A2B22', fontFamily: "'IBM Plex Sans Arabic'" }}
                dir="rtl"
              />
              <button
                type="button"
                onClick={handleMicrophoneClick}
                title="تحدث بدلاً من الكتابة"
                className={`absolute left-3 bottom-3 p-2.5 rounded-full transition-all flex items-center justify-center ${
                  isRecording 
                    ? 'bg-red-50 text-red-500 animate-pulse shadow-sm' 
                    : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100 hover:text-emerald-700'
                }`}
              >
                {isRecording ? (
                  <span className="w-5 h-5 rounded-full bg-red-500 animate-ping" />
                ) : (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="22"/><line x1="8" y1="22" x2="16" y2="22"/></svg>
                )}
              </button>
              <button
                type="button"
                onClick={() => setDictationLang(l => l === 'ar-JO' ? 'en-AE' : 'ar-JO')}
                className="absolute right-3 bottom-3 text-xs font-bold px-2 py-1.5 rounded-lg transition-colors hover:bg-emerald-50 bg-white shadow-sm border border-emerald-100"
                style={{ color: '#4A6357', fontFamily: "'IBM Plex Sans Arabic'" }}
                title="تغيير لغة الإملاء الصوتي"
              >
                {dictationLang === 'ar-JO' ? 'عربي' : 'EN'}
              </button>
            </div>
            
            <button
              onClick={handleAiConsult}
              disabled={!symptoms.trim() || isAiLoading}
              className="w-full py-3 rounded-xl text-white font-bold transition-all hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              style={{ background: 'linear-gradient(135deg, #2D6A4F, #52B788)', fontFamily: "'IBM Plex Sans Arabic'" }}
            >
              {isAiLoading ? (
                <>
                  <span className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                  جاري تحليل البيانات (RAG)...
                </>
              ) : (
                <>استشارة الذكاء الاصطناعي</>
              )}
            </button>

            {aiSuggestion && (
              <div className="mt-6 p-5 rounded-2xl border" style={{ background: 'rgba(45,106,79,0.03)', borderColor: 'rgba(45,106,79,0.1)' }}>
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-sm">🤖</span>
                  <span className="font-bold text-sm" style={{ color: '#2D6A4F', fontFamily: "'IBM Plex Sans Arabic'" }}>توصيات رافيق AI:</span>
                </div>
                <p className="text-sm leading-relaxed whitespace-pre-wrap" style={{ color: '#1A2B22', fontFamily: "'IBM Plex Sans Arabic'" }}>
                  {aiSuggestion}
                </p>
                <div className="mt-4 flex gap-2">
                  <button className="px-4 py-2 rounded-lg text-xs font-semibold text-white transition-all hover:opacity-90" style={{ background: '#52B788', fontFamily: "'IBM Plex Sans Arabic'" }}>
                    إضافة للوصفة
                  </button>
                  <button className="px-4 py-2 rounded-lg text-xs font-semibold transition-all hover:bg-gray-100" style={{ color: '#4A6357', border: '1px solid #E5E7EB', fontFamily: "'IBM Plex Sans Arabic'" }}>
                    تعديل الأعراض
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
