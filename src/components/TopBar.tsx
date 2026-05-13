'use client';

import { useState } from 'react';
import { View } from './RafeeqApp';
import { usePatient } from '@/lib/hooks';

const viewTitles: Record<View, { ar: string; en: string }> = {
  dashboard: { ar: 'لوحة المريض', en: 'Patient Dashboard' },
  chat:      { ar: 'مساعد الذكاء الاصطناعي', en: 'AI Assistant' },
  labs:      { ar: 'تحليل التحاليل المخبرية', en: 'Lab Analytics' },
  doctor:    { ar: 'المساعد السريري للطبيب', en: "Doctor's Clinical View" },
  family:    { ar: 'وضع العائلة', en: 'Family Mode' },
  allergies: { ar: 'الحساسيات', en: 'Allergies' },
};

interface TopBarProps {
  activeView: View;
  caregiverMode: boolean;
  onCaregiverToggle: () => void;
  userRole: 'patient' | 'doctor';
}

export default function TopBar({ activeView, caregiverMode, onCaregiverToggle, userRole }: TopBarProps) {
  const [searchFocused, setSearchFocused] = useState(false);
  const { data: patient } = usePatient(userRole === 'doctor' ? '' : undefined);
  const title = viewTitles[activeView];

  return (
    <header
      className="shrink-0 flex items-center gap-4 px-6 py-3 border-b"
      style={{
        background: 'rgba(255,255,255,0.72)',
        backdropFilter: 'blur(20px)',
        borderColor: 'rgba(255,255,255,0.5)',
        boxShadow: '0 1px 12px rgba(45,106,79,0.06)',
      }}
      dir="rtl"
    >
      {/* Page title */}
      <div className="flex-1 min-w-0">
        <h1
          className="font-semibold text-base truncate"
          style={{ color: '#1A2B22', fontFamily: "'IBM Plex Sans Arabic'" }}
        >
          {title.ar}
        </h1>
        <p className="text-xs truncate" style={{ color: '#8FA89B', fontFamily: "'Inter'" }}>
          {title.en}
        </p>
      </div>

      {/* Search */}
      <div className={`relative transition-all duration-300 ${searchFocused ? 'w-64' : 'w-48'}`}>
        <input
          id="global-search"
          type="text"
          placeholder="ابحث... (Cmd+K)"
          onFocus={() => setSearchFocused(true)}
          onBlur={() => setSearchFocused(false)}
          className="w-full text-sm px-4 py-2 pr-9 rounded-xl outline-none transition-all"
          style={{
            background: 'rgba(45,106,79,0.06)',
            border: searchFocused ? '1px solid #52B788' : '1px solid transparent',
            color: '#1A2B22',
            fontFamily: "'IBM Plex Sans Arabic'",
          }}
          dir="rtl"
        />
        <span className="absolute left-3 top-1/2 -translate-y-1/2 opacity-40" style={{ color: '#2D6A4F' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8"/>
            <line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
        </span>
      </div>

      {/* Sanad auth chip */}
      <div
        className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-medium cursor-pointer transition-all hover:scale-105"
        style={{
          background: 'rgba(45,106,79,0.08)',
          color: '#2D6A4F',
          border: '1px solid rgba(45,106,79,0.15)',
          fontFamily: "'Inter'",
        }}
      >
        <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
        <span>Sanad ID ✓</span>
      </div>

      {/* Caregiver mode toggle (Doctor only) */}
      {userRole === 'doctor' && (
        <button
          id="caregiver-toggle"
          onClick={onCaregiverToggle}
          title="Caregiver Mode"
          className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-medium transition-all duration-300"
          style={{
            background: caregiverMode ? 'rgba(212,169,106,0.15)' : 'rgba(45,106,79,0.06)',
            color: caregiverMode ? '#A07C3A' : '#4A6357',
            border: caregiverMode ? '1px solid rgba(212,169,106,0.3)' : '1px solid transparent',
            fontFamily: "'IBM Plex Sans Arabic'",
          }}
        >
          {caregiverMode ? '🌿 مراقب' : '🏥 طبيب'}
        </button>
      )}

      {/* Profile switcher / Logout */}
      <button
        id="profile-switcher"
        onClick={() => {
          localStorage.removeItem('rafeeq_userRole');
          window.location.href = '/';
        }}
        title="تسجيل الخروج (Logout)"
        className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold transition-transform hover:scale-110 shrink-0"
        style={{ background: userRole === 'doctor' ? 'linear-gradient(135deg, #A07C3A, #D4A96A)' : 'linear-gradient(135deg, #2D6A4F, #52B788)' }}
      >
        {userRole === 'doctor' ? 'ط' : (patient?.nameAr ? patient.nameAr[0] : 'ج')}
      </button>
    </header>
  );
}
