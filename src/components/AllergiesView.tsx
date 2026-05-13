'use client';

import { usePatient, Skeleton } from '@/lib/hooks';

export default function AllergiesView() {
  const { data: patient, loading } = usePatient();
  const allergies = patient?.allergies ?? [];

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto" dir="rtl">
      <div className="glass-card p-6 fade-up-1">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-base" style={{ color: '#1A2B22', fontFamily: "'IBM Plex Sans Arabic'" }}>
            🧫 حساسياتي
          </h3>
          <span className="text-xs" style={{ color: '#8FA89B', fontFamily: "'Inter'" }}>Hakeem</span>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => <Skeleton key={i} h="h-12" />)}
          </div>
        ) : allergies.length ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {allergies.map((allergy, i) => (
              <div
                key={`${allergy}-${i}`}
                className="flex items-center gap-3 p-3 rounded-2xl"
                style={{ background: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.15)' }}
              >
                <span className="text-lg">⚠️</span>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm truncate" style={{ color: '#7F1D1D', fontFamily: "'IBM Plex Sans Arabic'" }}>
                    {allergy}
                  </div>
                  <div className="text-[11px]" style={{ color: '#B91C1C' }}>تجنب التعرض لهذه المادة</div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-sm text-center py-6" style={{ color: '#8FA89B', fontFamily: "'IBM Plex Sans Arabic'" }}>
            لا توجد حساسيات مسجلة حالياً
          </div>
        )}
      </div>
    </div>
  );
}
