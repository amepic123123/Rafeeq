'use client';

import { usePatient, useQuickStats, useInsights, useMedications, useHealthScore, Skeleton } from '@/lib/hooks';
import HealthScore from './HealthScore';

interface PatientDashboardProps {
  caregiverMode: boolean;
}

export default function PatientDashboard({ caregiverMode }: PatientDashboardProps) {
  const { data: patient,    loading: lPatient }    = usePatient();
  const { data: quickStats, loading: lStats }      = useQuickStats();
  const { data: insights,   loading: lInsights }   = useInsights();
  const { data: medications,loading: lMeds }       = useMedications();
  const { data: scoreData,  loading: lScore }      = useHealthScore();

  const statItems = quickStats
    ? [
        { label: 'HbA1c',     value: quickStats.hba1c,         delta: quickStats.hba1cDelta,          good: quickStats.hba1cGood         },
        { label: 'ضغط الدم',   value: quickStats.bloodPressure, delta: quickStats.bloodPressureDelta,  good: quickStats.bloodPressureGood  },
      ]
    : [];

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto" dir="rtl">

      {/* Hero Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 fade-up-1">

        {/* Health Pulse Card — AI Orb */}
        <div
          className="glass-card p-6 lg:col-span-2 flex items-center gap-6 relative overflow-hidden"
          style={caregiverMode ? { background: 'rgba(253,246,237,0.85)' } : {}}
        >
          <div
            className="absolute -top-12 -left-12 w-48 h-48 rounded-full opacity-10 blur-2xl"
            style={{ background: 'radial-gradient(circle, #52B788, #2D6A4F)' }}
          />

          {/* AI Orb */}
          <div className="relative shrink-0">
            <div className="w-24 h-24 ai-orb" />
            <div className="absolute inset-0 rounded-full pulse-ring opacity-30" style={{ background: 'rgba(82,183,136,0.3)' }} />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-medium px-2 py-0.5 rounded-full" style={{ background: 'rgba(82,183,136,0.12)', color: '#2D6A4F' }}>
                نبض صحي مباشر
              </span>
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            </div>

            {lPatient ? (
              <Skeleton h="h-7" className="w-48 mb-2" />
            ) : (
              <h2 className="text-xl font-bold mb-1" style={{ color: '#1A2B22', fontFamily: "'IBM Plex Sans Arabic'" }}>
                صباح الخير، {patient?.nameAr?.split(' ')[0]}! ☀️
              </h2>
            )}

            <p className="text-sm mb-3" style={{ color: '#4A6357', fontFamily: "'IBM Plex Sans Arabic'" }}>
              يومك الصحي يبدو ممتاز — سكرك مستقر وضغطك تحسّن الأسبوع هاد.
            </p>

            {/* Quick stats row */}
            <div className="flex flex-wrap gap-3">
              {lStats
                ? [1, 2].map(i => <Skeleton key={i} h="h-14" className="w-20" />)
                : statItems.map(stat => (
                    <div key={stat.label} className="px-3 py-2 rounded-xl text-center" style={{ background: 'rgba(45,106,79,0.06)', minWidth: 80 }}>
                      <div className="text-xs mb-0.5" style={{ color: '#8FA89B', fontFamily: "'Inter'" }}>{stat.label}</div>
                      <div className="font-bold text-sm" style={{ color: '#1A2B22', fontFamily: "'Inter'" }}>{stat.value}</div>
                      <div className="text-[10px]" style={{ color: stat.good ? '#22C55E' : '#EF4444' }}>{stat.delta}</div>
                    </div>
                  ))
              }
            </div>
          </div>

          <div className="absolute top-4 left-4">
            <span className="hakeem-badge text-[10px]">✓ مُتحقق عبر حكيم</span>
          </div>
        </div>

        {/* Health Score Gauge */}
        {lScore
          ? <div className="glass-card p-6 flex items-center justify-center"><Skeleton h="h-40" className="w-40 rounded-full" /></div>
          : scoreData ? <HealthScore scoreData={scoreData} caregiverMode={caregiverMode} /> : <div className="glass-card p-6 flex items-center justify-center text-sm font-bold text-red-500" style={{ fontFamily: "'IBM Plex Sans Arabic'" }}>تعذر تحميل بيانات النسبة الصحية (API غير متاح)</div>
        }
      </div>

      {/* Insight Feed + Medications */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

        {/* AI Insight Feed */}
        <div className="glass-card p-5 fade-up-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-base" style={{ color: '#1A2B22', fontFamily: "'IBM Plex Sans Arabic'" }}>
              💡 رؤى رفيق
            </h3>
            <span className="text-xs" style={{ color: '#8FA89B' }}>اليوم</span>
          </div>
          <div className="space-y-3">
            {lInsights
              ? [1, 2, 3, 4].map(i => <Skeleton key={i} h="h-16" />)
              : (insights ?? []).map((insight, i) => (
                  <div
                    key={insight.id}
                    className={`flex gap-3 p-3 rounded-2xl transition-all hover:scale-[1.01] fade-up-${i + 2}`}
                    style={{
                      background: insight.severity === 'green' ? 'rgba(34,197,94,0.06)' : insight.severity === 'yellow' ? 'rgba(245,158,11,0.06)' : 'rgba(45,106,79,0.05)',
                      border:     insight.severity === 'green' ? '1px solid rgba(34,197,94,0.15)' : insight.severity === 'yellow' ? '1px solid rgba(245,158,11,0.15)' : '1px solid rgba(45,106,79,0.10)',
                    }}
                  >
                    <span className="text-xl shrink-0">{insight.emoji}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm leading-relaxed" style={{ color: '#1A2B22', fontFamily: "'IBM Plex Sans Arabic'" }}>{insight.textAr}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] px-2 py-0.5 rounded-full font-medium" style={{ background: 'rgba(45,106,79,0.08)', color: '#2D6A4F' }}>{insight.tag}</span>
                        <span className="text-[11px]" style={{ color: '#8FA89B' }}>{insight.time}</span>
                      </div>
                    </div>
                  </div>
                ))
            }
          </div>
        </div>

        {/* Medication Card */}
        <div className="glass-card p-5 fade-up-3">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-base" style={{ color: '#1A2B22', fontFamily: "'IBM Plex Sans Arabic'" }}>
              💊 أدويتي اليوم
            </h3>
            <span className="hakeem-badge">✓ حكيم</span>
          </div>
          <div className="space-y-3">
            {lMeds
              ? [1, 2, 3, 4].map(i => <Skeleton key={i} h="h-12" />)
              : (medications ?? []).map(med => (
                  <div key={med.id} className="flex items-center gap-3 p-3 rounded-2xl" style={{ background: 'rgba(45,106,79,0.04)', border: '1px solid rgba(45,106,79,0.08)' }}>
                    <div className="w-3 h-3 rounded-full shrink-0" style={{ background: med.color }} />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm truncate" style={{ color: '#1A2B22', fontFamily: "'IBM Plex Sans Arabic'" }}>{med.name}</div>
                      <div className="text-xs" style={{ color: '#4A6357' }}>{med.dose}</div>
                    </div>
                  </div>
                ))
            }
          </div>

          {/* Conditions */}
          <div className="mt-4 pt-4 border-t border-black/5">
            <div className="text-xs font-medium mb-2" style={{ color: '#8FA89B', fontFamily: "'IBM Plex Sans Arabic'" }}>الحالات المزمنة</div>
            <div className="flex flex-wrap gap-2">
              {lPatient
                ? <Skeleton h="h-5" className="w-48" />
                : (patient?.conditions ?? []).map(c => (
                    <span key={c} className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'rgba(82,183,136,0.10)', color: '#2D6A4F', border: '1px solid rgba(82,183,136,0.2)', fontFamily: "'IBM Plex Sans Arabic'" }}>{c}</span>
                  ))
              }
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
