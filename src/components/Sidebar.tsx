'use client';

import { View } from './RafeeqApp';

interface SidebarProps {
  activeView: View;
  onViewChange: (view: View) => void;
}

const navItems: { id: View; iconSvg: string; labelAr: string; labelEn: string }[] = [
  {
    id: 'dashboard',
    iconSvg: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>`,
    labelAr: 'لوحة المريض',
    labelEn: 'Dashboard',
  },
  {
    id: 'chat',
    iconSvg: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>`,
    labelAr: 'مساعد الذكاء',
    labelEn: 'AI Assistant',
  },
  {
    id: 'labs',
    iconSvg: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>`,
    labelAr: 'تحليل التحاليل',
    labelEn: 'Lab Analytics',
  },
  {
    id: 'doctor',
    iconSvg: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>`,
    labelAr: 'المساعد الطبي',
    labelEn: 'Doctor View',
  },
  {
    id: 'family',
    iconSvg: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>`,
    labelAr: 'وضع العائلة',
    labelEn: 'Family Mode',
  },
];

export default function Sidebar({ activeView, onViewChange }: SidebarProps) {
  return (
    <aside
      className="glass-sidebar flex flex-col w-64 shrink-0 h-full z-20"
      dir="rtl"
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-6 border-b border-white/30">
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-bold text-sm"
          style={{ background: 'linear-gradient(135deg, #2D6A4F, #52B788)' }}
        >
          ر
        </div>
        <div>
          <div className="font-bold text-base" style={{ color: '#1A2B22', fontFamily: "'IBM Plex Sans Arabic'" }}>
            رفيق
          </div>
          <div className="text-xs" style={{ color: '#8FA89B', fontFamily: "'Inter'" }}>
            Powered by Hakeem
          </div>
        </div>
        <span className="hakeem-badge mr-auto">✓ حكيم</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map(item => (
          <button
            key={item.id}
            id={`nav-${item.id}`}
            onClick={() => onViewChange(item.id)}
            className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition-all duration-200 cursor-pointer ${
              activeView === item.id
                ? 'nav-active'
                : 'hover:bg-emerald-deep/5 text-[#4A6357]'
            }`}
            style={activeView === item.id ? { color: '#2D6A4F' } : {}}
          >
            <span
              className="shrink-0"
              dangerouslySetInnerHTML={{ __html: item.iconSvg }}
            />
            <div className="text-right flex-1">
              <div style={{ fontFamily: "'IBM Plex Sans Arabic'" }}>{item.labelAr}</div>
              <div className="text-[10px] opacity-60" style={{ fontFamily: "'Inter'" }}>
                {item.labelEn}
              </div>
            </div>
          </button>
        ))}
      </nav>

      {/* Patient card */}
      <div className="px-4 py-4 border-t border-white/30">
        <div className="glass-card p-3 flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0"
            style={{ background: 'linear-gradient(135deg, #2D6A4F, #52B788)' }}
          >
            خ
          </div>
          <div className="flex-1 min-w-0 text-right">
            <div className="font-semibold text-sm truncate" style={{ color: '#1A2B22', fontFamily: "'IBM Plex Sans Arabic'" }}>
              خالد العمري
            </div>
            <div className="text-[11px]" style={{ color: '#8FA89B' }}>
              JO-2026-KHL-4821
            </div>
          </div>
          <div className="text-xs font-bold" style={{ color: '#52B788' }}>74</div>
        </div>
      </div>
    </aside>
  );
}
