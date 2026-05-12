'use client';

import { useRef, useCallback } from 'react';
import { useRiskFlags, useHakeemHistory, usePrescriptionAnalysis, Skeleton } from '@/lib/hooks';

export default function DoctorView() {
  const patientId = 'JO-2026-KHL-4821'; // TODO: receive via context/prop once auth is wired
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: riskFlags,     loading: lRisk }    = useRiskFlags(patientId);
  const { data: hakeemHistory, loading: lHakeem }  = useHakeemHistory(patientId);
  const {
    result, isScanning, progress, analyze, reset,
  } = usePrescriptionAnalysis(patientId);

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

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto" dir="rtl">

      {/* Header */}
      <div className="fade-up-1">
        <h2 className="text-xl font-bold" style={{ color: '#1A2B22', fontFamily: "'IBM Plex Sans Arabic'" }}>🩺 المساعد السريري للطبيب</h2>
        <p className="text-sm mt-1" style={{ color: '#8FA89B', fontFamily: "'IBM Plex Sans Arabic'" }}>تحليل الوصفات، كشف التفاعلات، ومقارنة سجل حكيم</p>
      </div>

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
    </div>
  );
}
