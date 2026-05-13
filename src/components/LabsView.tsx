'use client';

import { useHbA1cHistory, useBloodPressureHistory, useMedications, Skeleton } from '@/lib/hooks';
import {
  LineChart, Line, AreaChart, Area, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine,
  BarChart, Bar, Cell
} from 'recharts';

interface LabsViewProps {
  patientId?: string;
}


const CustomTooltip = ({ active, payload, label }: {
  active?: boolean;
  payload?: { value: number; color: string; name: string }[];
  label?: string;
}) => {
  if (active && payload && payload.length) {
    return (
      <div className="glass-card px-3 py-2 text-xs" style={{ fontFamily: "'Inter'", minWidth: 100 }}>
        <div className="font-semibold mb-1" style={{ color: '#1A2B22' }}>{label}</div>
        {payload.map(p => (
          <div key={p.name} style={{ color: p.color }}>{p.name}: <strong>{p.value}</strong></div>
        ))}
      </div>
    );
  }
  return null;
};

// activityData should come from API in the future
const activityData: any[] = [];

export default function LabsView({ patientId }: LabsViewProps = {}) {
  const { data: hba1cData, loading: lHba1c } = useHbA1cHistory(patientId, 7);
  const { data: bpData,    loading: lBp }    = useBloodPressureHistory(patientId, 7);
  const { data: medications, loading: lMeds } = useMedications(patientId);

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto" dir="rtl">

      <div className="fade-up-1">
        <h2 className="text-xl font-bold" style={{ color: '#1A2B22', fontFamily: "'IBM Plex Sans Arabic'" }}>📊 تحليل التحاليل المخبرية</h2>
        <p className="text-sm mt-1" style={{ color: '#8FA89B', fontFamily: "'IBM Plex Sans Arabic'" }}>مؤشرات السكر وضغط الدم مع جدول الدواء الرمضاني</p>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 fade-up-2">

        {/* HbA1c */}
        <div className="glass-card p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold text-sm" style={{ color: '#1A2B22', fontFamily: "'IBM Plex Sans Arabic'" }}>مستوى السكر التراكمي (HbA1c)</h3>
              <p className="text-xs mt-0.5" style={{ color: '#8FA89B', fontFamily: "'Inter'" }}>آخر 7 أشهر · الهدف: أقل من 7%</p>
            </div>
            <div className="px-3 py-1.5 rounded-xl text-xs font-bold" style={{ background: 'rgba(34,197,94,0.10)', color: '#16A34A', fontFamily: "'Inter'" }}>↓ تحسّن</div>
          </div>

          {lHba1c ? (
            <Skeleton h="h-44" />
          ) : (
            <ResponsiveContainer width="100%" height={180}>
              <AreaChart data={hba1cData ?? []} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="hba1cGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#52B788" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#52B788" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(45,106,79,0.06)" />
                <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#8FA89B', fontFamily: 'IBM Plex Sans Arabic' }} />
                <YAxis domain={[6.5, 9]} tick={{ fontSize: 10, fill: '#8FA89B', fontFamily: 'Inter' }} />
                <Tooltip content={<CustomTooltip />} />
                <ReferenceLine y={7} stroke="#22C55E" strokeDasharray="4 4" label={{ value: 'هدف 7%', position: 'right', fontSize: 10, fill: '#22C55E' }} />
                <Area type="monotone" dataKey="value" name="HbA1c" stroke="#2D6A4F" strokeWidth={2.5} fill="url(#hba1cGrad)" dot={{ fill: '#52B788', r: 4, strokeWidth: 0 }} activeDot={{ r: 6, fill: '#2D6A4F' }} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Blood Pressure */}
        <div className="glass-card p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold text-sm" style={{ color: '#1A2B22', fontFamily: "'IBM Plex Sans Arabic'" }}>ضغط الدم الأسبوعي</h3>
              <p className="text-xs mt-0.5" style={{ color: '#8FA89B', fontFamily: "'Inter'" }}>7 أيام · الهدف: 120/80</p>
            </div>
            <div className="px-3 py-1.5 rounded-xl text-xs font-bold" style={{ background: 'rgba(245,158,11,0.10)', color: '#D97706', fontFamily: "'Inter'" }}>مراقبة</div>
          </div>

          {lBp ? (
            <Skeleton h="h-44" />
          ) : (
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={bpData ?? []} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(45,106,79,0.06)" />
                <XAxis dataKey="day" tick={{ fontSize: 10, fill: '#8FA89B', fontFamily: 'IBM Plex Sans Arabic' }} />
                <YAxis domain={[70, 160]} tick={{ fontSize: 10, fill: '#8FA89B', fontFamily: 'Inter' }} />
                <Tooltip content={<CustomTooltip />} />
                <ReferenceLine y={120} stroke="#22C55E" strokeDasharray="4 4" />
                <ReferenceLine y={80} stroke="#22C55E" strokeDasharray="4 4" />
                <Line type="monotone" dataKey="systolic" name="انقباضي" stroke="#EF4444" strokeWidth={2} dot={{ fill: '#EF4444', r: 3 }} activeDot={{ r: 5 }} />
                <Line type="monotone" dataKey="diastolic" name="انبساطي" stroke="#52B788" strokeWidth={2} dot={{ fill: '#52B788', r: 3 }} activeDot={{ r: 5 }} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Activity Tracker */}
      <div className="glass-card p-5 fade-up-3">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="font-semibold text-base" style={{ color: '#1A2B22', fontFamily: "'IBM Plex Sans Arabic'" }}>🏃‍♂️ تحليل النشاط البدني</h3>
            <p className="text-xs mt-0.5" style={{ color: '#8FA89B', fontFamily: "'IBM Plex Sans Arabic'" }}>معدل الخطوات اليومي · الهدف: 6,000 خطوة</p>
          </div>
          <div className="text-left">
            <div className="text-lg font-bold" style={{ color: '#2D6A4F', fontFamily: "'Inter'" }}>NaN</div>
            <div className="text-[10px]" style={{ color: '#22C55E' }}>NaN</div>
          </div>
        </div>

        <div className="h-48 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={activityData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.04)" />
              <XAxis 
                dataKey="day" 
                tick={{ fontSize: 10, fill: '#8FA89B', fontFamily: 'IBM Plex Sans Arabic' }} 
                axisLine={false}
                tickLine={false}
              />
              <YAxis hide />
              <Tooltip 
                cursor={{ fill: 'rgba(82,183,136,0.05)' }}
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="glass-card px-3 py-2 text-xs" style={{ fontFamily: "'Inter'" }}>
                        <div className="font-bold">{payload[0].value} خطوة</div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Bar 
                dataKey="steps" 
                radius={[6, 6, 0, 0]}
                barSize={32}
              >
                {activityData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={entry.steps >= 6000 ? '#52B788' : '#D4A96A'} 
                    fillOpacity={0.8}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="flex justify-between mt-4 pt-4 border-t border-black/5">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-[#52B788]" />
            <span className="text-[10px]" style={{ color: '#8FA89B' }}>تم تحقيق الهدف</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-[#D4A96A]" />
            <span className="text-[10px]" style={{ color: '#8FA89B' }}>أقل من الهدف</span>
          </div>
        </div>
      </div>
    </div>
  );
}
