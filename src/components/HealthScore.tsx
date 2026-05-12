'use client';

import { useEffect, useRef } from 'react';

interface HealthScoreProps {
  score: number;
  caregiverMode?: boolean;
}

export default function HealthScore({ score, caregiverMode }: HealthScoreProps) {
  const circleRef = useRef<SVGCircleElement>(null);

  const radius = 44;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  useEffect(() => {
    if (!circleRef.current) return;
    circleRef.current.style.setProperty('--gauge-offset', String(offset));
    circleRef.current.style.strokeDashoffset = String(circumference);
    requestAnimationFrame(() => {
      setTimeout(() => {
        if (circleRef.current) {
          circleRef.current.style.transition = 'stroke-dashoffset 1.4s cubic-bezier(0.34,1.56,0.64,1)';
          circleRef.current.style.strokeDashoffset = String(offset);
        }
      }, 200);
    });
  }, [score, offset, circumference]);

  const getScoreLabel = () => {
    if (score >= 80) return { ar: 'ممتاز', color: '#22C55E' };
    if (score >= 60) return { ar: 'جيد', color: '#52B788' };
    if (score >= 40) return { ar: 'متوسط', color: '#F59E0B' };
    return { ar: 'يحتاج عناية', color: '#EF4444' };
  };

  const label = getScoreLabel();

  return (
    <div
      className="glass-card p-6 flex flex-col items-center justify-center text-center"
      style={caregiverMode ? { background: 'rgba(253,246,237,0.85)' } : {}}
      dir="rtl"
    >
      <div
        className="text-sm font-medium mb-4"
        style={{ color: '#4A6357', fontFamily: "'IBM Plex Sans Arabic'" }}
      >
        مؤشر الصحة الشامل
      </div>

      {/* SVG Gauge */}
      <div className="relative">
        <svg width="120" height="120" viewBox="0 0 120 120">
          {/* Background track */}
          <circle
            cx="60"
            cy="60"
            r={radius}
            fill="none"
            stroke="rgba(45,106,79,0.08)"
            strokeWidth="10"
            strokeLinecap="round"
          />
          {/* Score arc */}
          <circle
            ref={circleRef}
            cx="60"
            cy="60"
            r={radius}
            fill="none"
            stroke="url(#scoreGrad)"
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={circumference}
            transform="rotate(-90 60 60)"
          />
          <defs>
            <linearGradient id="scoreGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#2D6A4F" />
              <stop offset="100%" stopColor="#74C69D" />
            </linearGradient>
          </defs>
        </svg>

        {/* Score number */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span
            className="text-3xl font-bold"
            style={{ color: '#1A2B22', fontFamily: "'Inter'" }}
          >
            {score}
          </span>
          <span className="text-xs" style={{ color: '#8FA89B', fontFamily: "'Inter'" }}>
            /100
          </span>
        </div>
      </div>

      {/* Label */}
      <div
        className="mt-3 px-4 py-1 rounded-full text-sm font-semibold"
        style={{ background: `${label.color}18`, color: label.color }}
      >
        {label.ar}
      </div>

      {/* Sub-metrics */}
      <div className="mt-4 w-full space-y-2">
        {[
          { label: 'التزام الدواء', pct: 95, color: '#22C55E' },
          { label: 'نشاط بدني', pct: 55, color: '#F59E0B' },
          { label: 'تغذية', pct: 70, color: '#52B788' },
        ].map(m => (
          <div key={m.label} className="text-right">
            <div className="flex justify-between mb-0.5">
              <span className="text-xs font-medium" style={{ color: '#1A2B22', fontFamily: "'IBM Plex Sans Arabic'" }}>
                {m.label}
              </span>
              <span className="text-xs" style={{ color: m.color, fontFamily: "'Inter'" }}>
                {m.pct}%
              </span>
            </div>
            <div className="w-full h-1.5 rounded-full" style={{ background: 'rgba(45,106,79,0.08)' }}>
              <div
                className="h-1.5 rounded-full transition-all duration-1000"
                style={{ width: `${m.pct}%`, background: m.color }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
