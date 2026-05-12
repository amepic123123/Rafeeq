'use client';

import { useFamilyMembers, useFamilySummary, Skeleton } from '@/lib/hooks';

const PATIENT_ID = 'JO-2026-KHL-4821';

const roleLabels: Record<string, { ar: string }> = {
  patient:  { ar: 'المريض'  },
  spouse:   { ar: 'الزوجة'  },
  son:      { ar: 'الابن'   },
  daughter: { ar: 'الابنة'  },
  parent:   { ar: 'الوالد'  },
  other:    { ar: 'أخرى'    },
};

export default function FamilyView() {
  const { data: members, loading: lMembers } = useFamilyMembers(PATIENT_ID);
  const { data: summary, loading: lSummary } = useFamilySummary(PATIENT_ID);

  const summaryStats = summary
    ? [
        { label: 'متوسط المؤشر الصحي',  value: String(summary.avgHealthScore),        unit: '/100',    color: '#22C55E' },
        { label: 'مواعيد هذا الأسبوع',   value: String(summary.weeklyAppointments),    unit: 'مواعيد', color: '#52B788' },
        { label: 'أدوية نشطة',           value: String(summary.activeMedications),     unit: 'دواء',   color: '#8B5CF6' },
        { label: 'تحاليل معلقة',          value: String(summary.pendingLabResults),     unit: 'تحليل',  color: '#F97316' },
      ]
    : [];

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto" dir="rtl">

      <div className="fade-up-1">
        <h2 className="text-xl font-bold" style={{ color: '#1A2B22', fontFamily: "'IBM Plex Sans Arabic'" }}>👨‍👩‍👧‍👦 وضع العائلة</h2>
        <p className="text-sm mt-1" style={{ color: '#8FA89B', fontFamily: "'IBM Plex Sans Arabic'" }}>رفيق يدعم صحة أسرتك بالكامل — كل شخص بملفه الصحي الخاص</p>
      </div>

      {/* Family grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 fade-up-2">
        {lMembers
          ? [1, 2, 3, 4].map(i => <Skeleton key={i} h="h-64" className="rounded-3xl" />)
          : (members ?? []).map((member, i) => {
              const radius = 28;
              const circ   = 2 * Math.PI * radius;
              const offset = circ - (member.healthScore / 100) * circ;
              return (
                <div
                  key={member.id}
                  className={`glass-card p-5 flex flex-col items-center text-center cursor-pointer transition-all hover:scale-105 hover:-translate-y-1 fade-up-${i + 2}`}
                  style={{ borderTop: `3px solid ${member.color}` }}
                >
                  <div className="w-14 h-14 rounded-full flex items-center justify-center text-white text-xl font-bold mb-3 shadow-lg" style={{ background: `linear-gradient(135deg, ${member.color}CC, ${member.color})` }}>
                    {member.avatar}
                  </div>
                  <div className="font-semibold text-sm mb-0.5" style={{ color: '#1A2B22', fontFamily: "'IBM Plex Sans Arabic'" }}>{member.nameAr}</div>
                  <div className="text-xs mb-3" style={{ color: '#8FA89B', fontFamily: "'IBM Plex Sans Arabic'" }}>{roleLabels[member.role]?.ar}</div>

                  {/* Mini gauge */}
                  <div className="relative mb-3">
                    <svg width="70" height="70" viewBox="0 0 70 70">
                      <circle cx="35" cy="35" r={radius} fill="none" stroke="rgba(0,0,0,0.06)" strokeWidth="6" />
                      <circle cx="35" cy="35" r={radius} fill="none" stroke={member.color} strokeWidth="6" strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={offset} transform="rotate(-90 35 35)" style={{ transition: 'stroke-dashoffset 1.2s cubic-bezier(0.34,1.56,0.64,1)' }} />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-lg font-bold" style={{ color: '#1A2B22', fontFamily: "'Inter'" }}>{member.healthScore}</span>
                    </div>
                  </div>

                  <span className="text-xs px-3 py-1 rounded-full font-medium" style={{ background: `${member.color}15`, color: member.color, fontFamily: "'IBM Plex Sans Arabic'" }}>
                    {member.healthScore >= 90 ? 'ممتاز 🌟' : member.healthScore >= 75 ? 'جيد جداً ✅' : 'يحتاج متابعة ⚠️'}
                  </span>

                  <div className="flex gap-2 mt-3 w-full">
                    <button className="flex-1 py-1.5 rounded-xl text-[11px] font-medium transition-all hover:opacity-80" style={{ background: `${member.color}12`, color: member.color, fontFamily: "'IBM Plex Sans Arabic'" }}>الملف</button>
                    <button className="flex-1 py-1.5 rounded-xl text-[11px] font-medium transition-all hover:opacity-80" style={{ background: `${member.color}12`, color: member.color, fontFamily: "'IBM Plex Sans Arabic'" }}>سجل</button>
                  </div>
                </div>
              );
            })
        }
      </div>

      {/* Summary card */}
      <div className="glass-card p-6 fade-up-4" style={{ background: 'rgba(253,246,237,0.7)' }}>
        <h3 className="font-semibold mb-4" style={{ color: '#1A2B22', fontFamily: "'IBM Plex Sans Arabic'" }}>📈 ملخص الصحة العائلية</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {lSummary
            ? [1, 2, 3, 4].map(i => <Skeleton key={i} h="h-20" className="rounded-2xl" />)
            : summaryStats.map(stat => (
                <div key={stat.label} className="text-center p-3 rounded-2xl" style={{ background: 'rgba(255,255,255,0.6)' }}>
                  <div className="text-2xl font-bold" style={{ color: stat.color, fontFamily: "'Inter'" }}>{stat.value}</div>
                  <div className="text-xs mt-0.5" style={{ color: stat.color + 'AA', fontFamily: "'Inter'" }}>{stat.unit}</div>
                  <div className="text-xs mt-1" style={{ color: '#8FA89B', fontFamily: "'IBM Plex Sans Arabic'" }}>{stat.label}</div>
                </div>
              ))
          }
        </div>
      </div>
    </div>
  );
}
