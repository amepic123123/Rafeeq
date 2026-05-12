'use client';

import { hba1cData, bpData, medications } from '@/lib/data';
import {
  LineChart, Line, AreaChart, Area, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine,
} from 'recharts';

const CustomTooltip = ({ active, payload, label }: {
  active?: boolean;
  payload?: { value: number; color: string; name: string }[];
  label?: string;
}) => {
  if (active && payload && payload.length) {
    return (
      <div
        className="glass-card px-3 py-2 text-xs"
        style={{ fontFamily: "'Inter'", minWidth: 100 }}
      >
        <div className="font-semibold mb-1" style={{ color: '#1A2B22' }}>{label}</div>
        {payload.map(p => (
          <div key={p.name} style={{ color: p.color }}>
            {p.name}: <strong>{p.value}</strong>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

const timelineSlots = [
  { label: 'السحور', icon: '🌙', time: '03:30', color: '#8B5CF6', type: 'suhoor' },
  { label: 'بعد السحور', icon: '💊', time: '03:45', color: '#2D6A4F', type: 'suhoor-med' },
  { label: 'الفجر', icon: '🕌', time: '04:15', color: '#8B5CF6', type: 'prayer' },
  { label: 'الإفطار', icon: '🌅', time: '19:00', color: '#F97316', type: 'iftar' },
  { label: 'مع الإفطار', icon: '💊', time: '19:15', color: '#2D6A4F', type: 'iftar-med' },
  { label: 'بعد الإفطار', icon: '💊', time: '19:30', color: '#2D6A4F', type: 'iftar-med2' },
  { label: 'النوم', icon: '😴', time: '23:30', color: '#4A6357', type: 'sleep' },
];

export default function LabsView() {
  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto" dir="rtl">

      {/* Header */}
      <div className="fade-up-1">
        <h2 className="text-xl font-bold" style={{ color: '#1A2B22', fontFamily: "'IBM Plex Sans Arabic'" }}>
          📊 تحليل التحاليل المخبرية
        </h2>
        <p className="text-sm mt-1" style={{ color: '#8FA89B', fontFamily: "'IBM Plex Sans Arabic'" }}>
          مؤشرات السكر وضغط الدم مع جدول الدواء الرمضاني
        </p>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 fade-up-2">

        {/* HbA1c Chart */}
        <div className="glass-card p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold text-sm" style={{ color: '#1A2B22', fontFamily: "'IBM Plex Sans Arabic'" }}>
                مستوى السكر التراكمي (HbA1c)
              </h3>
              <p className="text-xs mt-0.5" style={{ color: '#8FA89B', fontFamily: "'Inter'" }}>
                آخر 7 أشهر · الهدف: أقل من 7%
              </p>
            </div>
            <div
              className="px-3 py-1.5 rounded-xl text-xs font-bold"
              style={{ background: 'rgba(34,197,94,0.10)', color: '#16A34A', fontFamily: "'Inter'" }}
            >
              ↓ تحسّن 15%
            </div>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={hba1cData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="hba1cGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#52B788" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#52B788" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(45,106,79,0.06)" />
              <XAxis
                dataKey="month"
                tick={{ fontSize: 10, fill: '#8FA89B', fontFamily: 'IBM Plex Sans Arabic' }}
              />
              <YAxis
                domain={[6.5, 9]}
                tick={{ fontSize: 10, fill: '#8FA89B', fontFamily: 'Inter' }}
              />
              <Tooltip content={<CustomTooltip />} />
              <ReferenceLine y={7} stroke="#22C55E" strokeDasharray="4 4" label={{ value: 'هدف 7%', position: 'right', fontSize: 10, fill: '#22C55E' }} />
              <Area
                type="monotone"
                dataKey="value"
                name="HbA1c"
                stroke="#2D6A4F"
                strokeWidth={2.5}
                fill="url(#hba1cGrad)"
                dot={{ fill: '#52B788', r: 4, strokeWidth: 0 }}
                activeDot={{ r: 6, fill: '#2D6A4F' }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Blood Pressure Chart */}
        <div className="glass-card p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold text-sm" style={{ color: '#1A2B22', fontFamily: "'IBM Plex Sans Arabic'" }}>
                ضغط الدم الأسبوعي
              </h3>
              <p className="text-xs mt-0.5" style={{ color: '#8FA89B', fontFamily: "'Inter'" }}>
                7 أيام · الهدف: 120/80
              </p>
            </div>
            <div
              className="px-3 py-1.5 rounded-xl text-xs font-bold"
              style={{ background: 'rgba(245,158,11,0.10)', color: '#D97706', fontFamily: "'Inter'" }}
            >
              مراقبة
            </div>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={bpData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(45,106,79,0.06)" />
              <XAxis
                dataKey="day"
                tick={{ fontSize: 10, fill: '#8FA89B', fontFamily: 'IBM Plex Sans Arabic' }}
              />
              <YAxis
                domain={[70, 160]}
                tick={{ fontSize: 10, fill: '#8FA89B', fontFamily: 'Inter' }}
              />
              <Tooltip content={<CustomTooltip />} />
              <ReferenceLine y={120} stroke="#22C55E" strokeDasharray="4 4" />
              <ReferenceLine y={80} stroke="#22C55E" strokeDasharray="4 4" />
              <Line
                type="monotone"
                dataKey="systolic"
                name="انقباضي"
                stroke="#EF4444"
                strokeWidth={2}
                dot={{ fill: '#EF4444', r: 3 }}
                activeDot={{ r: 5 }}
              />
              <Line
                type="monotone"
                dataKey="diastolic"
                name="انبساطي"
                stroke="#52B788"
                strokeWidth={2}
                dot={{ fill: '#52B788', r: 3 }}
                activeDot={{ r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Ramadan-Aware Medication Timeline */}
      <div className="glass-card p-5 fade-up-3">
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-semibold" style={{ color: '#1A2B22', fontFamily: "'IBM Plex Sans Arabic'" }}>
            🌙 جدول الدواء الرمضاني
          </h3>
          <span
            className="text-xs px-3 py-1.5 rounded-full font-medium"
            style={{ background: 'rgba(249,115,22,0.10)', color: '#F97316', fontFamily: "'IBM Plex Sans Arabic'" }}
          >
            معدّل لرمضان
          </span>
        </div>

        {/* Timeline */}
        <div className="relative">
          {/* Vertical line */}
          <div
            className="absolute right-[22px] top-0 bottom-0 w-0.5"
            style={{ background: 'linear-gradient(to bottom, rgba(139,92,246,0.3), rgba(249,115,22,0.3), rgba(45,106,79,0.15))' }}
          />

          <div className="space-y-4">
            {timelineSlots.map((slot, i) => {
              const medForSlot = medications.filter(m =>
                (slot.type.startsWith('iftar') && m.timing === 'iftar') ||
                (slot.type.startsWith('suhoor') && m.timing === 'suhoor')
              );
              return (
                <div key={slot.type + i} className="flex items-start gap-4 pr-2">
                  {/* Dot */}
                  <div className="relative flex items-center justify-center w-11 h-11 shrink-0">
                    <div
                      className="w-4 h-4 rounded-full z-10 flex items-center justify-center"
                      style={{
                        background: slot.color,
                        boxShadow: `0 0 0 4px ${slot.color}25`,
                      }}
                    />
                  </div>

                  {/* Content */}
                  <div className="flex-1 pb-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-base">{slot.icon}</span>
                      <span className="font-medium text-sm" style={{ color: '#1A2B22', fontFamily: "'IBM Plex Sans Arabic'" }}>
                        {slot.label}
                      </span>
                      <span className="text-xs mr-auto" style={{ color: '#8FA89B', fontFamily: "'Inter'" }}>
                        {slot.time}
                      </span>
                    </div>
                    {medForSlot.length > 0 && (
                      <div className="flex flex-wrap gap-2 mr-8">
                        {medForSlot.map(m => (
                          <div
                            key={m.id}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs"
                            style={{
                              background: `${m.color}12`,
                              border: `1px solid ${m.color}25`,
                              color: m.color,
                              fontFamily: "'IBM Plex Sans Arabic'",
                            }}
                          >
                            <div className="w-2 h-2 rounded-full" style={{ background: m.color }} />
                            {m.name}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
