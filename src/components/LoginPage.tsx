'use client';

import { useState, useMemo } from 'react';
import { loginWithNationalId } from '@/lib/api';

interface LoginPageProps {
  onLogin: (role: 'patient' | 'doctor') => void;
}

/* Deterministic particles — generated once, stable across SSR/client */
const PARTICLES = Array.from({ length: 18 }, (_, i) => ({
  id: i,
  left: `${(i * 17 + 7) % 100}%`,
  size: 3 + ((i * 3) % 6),
  duration: 8 + (i % 7) * 2,
  delay: (i * 1.3) % 8,
  opacity: 0.15 + ((i * 0.04) % 0.35),
}));

export default function LoginPage({ onLogin }: LoginPageProps) {
  const [mode, setMode] = useState<'sanad' | 'credentials'>('sanad');
  const [nationalId, setNationalId] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Feature highlights on the visual side
  const features = useMemo(() => [
    { icon: '🩺', text: 'تحليل ذكي لتحاليلك المخبرية' },
    { icon: '💊', text: 'إدارة أدويتك بذكاء مع تنبيهات رمضان' },
    { icon: '🔒', text: 'بياناتك محمية عبر نظام حكيم الوطني' },
    { icon: '👨‍👩‍👧‍👦', text: 'متابعة صحة العائلة بالكامل' },
  ], []);

  const handleSubmit = async (e: React.FormEvent, roleOverride?: 'patient' | 'doctor') => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (roleOverride) {
        // Fast-path for demo buttons
        const demoId = roleOverride === 'doctor' ? '1111111111' : '9901234567';
        const demoPass = roleOverride === 'doctor' ? 'doctor123' : 'patient123';
        
        try {
          const res = await loginWithNationalId(demoId, demoPass);
          localStorage.setItem('rafeeq_token', res.access_token);
        } catch (err) {
          console.warn("Backend auth failed or unreachable, falling back to local demo mode", err);
        }
        onLogin(roleOverride);
      } else {
        // Real user credentials login
        if (mode === 'credentials') {
          const res = await loginWithNationalId(nationalId, password);
          localStorage.setItem('rafeeq_token', res.access_token);
          // For now, if we don't decode the JWT, we assume patient if they use credentials, unless we check nationalId
          const isDoctor = nationalId === '1111111111';
          onLogin(isDoctor ? 'doctor' : 'patient');
        } else {
          // Sanad mock
          setTimeout(() => onLogin('patient'), 1500);
        }
      }
    } catch (err: any) {
      alert("فشل تسجيل الدخول: " + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-screen overflow-hidden" dir="rtl">

      {/* ─── Left: Immersive Visual Panel ─────────────────────────── */}
      <div className="hidden lg:flex lg:w-[55%] relative login-aurora overflow-hidden items-center justify-center">

        {/* Floating particles */}
        {PARTICLES.map(p => (
          <div
            key={p.id}
            className="login-particle"
            style={{
              left: p.left,
              width: p.size,
              height: p.size,
              background: `rgba(183, 228, 199, ${p.opacity})`,
              animationDuration: `${p.duration}s`,
              animationDelay: `${p.delay}s`,
            }}
          />
        ))}

        {/* Central orb with orbits */}
        <div className="relative flex items-center justify-center">
          {/* Outer orbit */}
          <div
            className="login-orbit absolute"
            style={{ width: 320, height: 320, animationDuration: '20s' }}
          >
            <div className="login-orbit-dot" style={{ top: 0, left: '50%', transform: 'translateX(-50%)' }} />
            <div className="login-orbit-dot" style={{ bottom: 0, left: '50%', transform: 'translateX(-50%)' }} />
          </div>

          {/* Middle orbit */}
          <div
            className="login-orbit absolute"
            style={{ width: 240, height: 240, animationDuration: '14s', animationDirection: 'reverse' }}
          >
            <div className="login-orbit-dot" style={{ top: '50%', right: 0, transform: 'translateY(-50%)' }} />
          </div>

          {/* Inner orbit */}
          <div
            className="login-orbit absolute"
            style={{ width: 170, height: 170, animationDuration: '10s' }}
          >
            <div className="login-orbit-dot" style={{ bottom: 0, right: '20%' }} />
          </div>

          {/* The Orb */}
          <div className="login-orb w-36 h-36" />
        </div>

        {/* Branding overlay */}
        <div className="absolute top-10 right-10 text-right fade-up-1">
          <div className="flex items-center gap-3 mb-2">
            <img
              src="/logo.jpg"
              alt="Rafeeq Logo"
              className="w-14 h-14 object-contain rounded-2xl shadow-lg"
            />
            <div>
              <div className="text-white font-bold text-lg" style={{ fontFamily: "'IBM Plex Sans Arabic'" }}>رفيق</div>
              <div className="text-white/50 text-xs" style={{ fontFamily: "'Inter'" }}>Powered by Hakeem</div>
            </div>
          </div>
        </div>

        {/* Feature pills at bottom */}
        <div className="absolute bottom-10 left-10 right-10 fade-up-3">
          <div className="grid grid-cols-2 gap-3">
            {features.map((f, i) => (
              <div
                key={i}
                className="flex items-center gap-3 px-4 py-3 rounded-2xl"
                style={{
                  background: 'rgba(255,255,255,0.08)',
                  backdropFilter: 'blur(12px)',
                  border: '1px solid rgba(255,255,255,0.12)',
                }}
              >
                <span className="text-lg">{f.icon}</span>
                <span className="text-white/80 text-xs" style={{ fontFamily: "'IBM Plex Sans Arabic'" }}>{f.text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Arabic quote */}
        <div className="absolute top-1/2 left-10 right-10 -translate-y-1/2 text-center pointer-events-none fade-up-2" style={{ marginTop: 120 }}>
          <p className="text-white/30 text-sm italic" style={{ fontFamily: "'IBM Plex Sans Arabic'" }}>
            &ldquo;صحتك أمانة — رفيق يساعدك تحافظ عليها&rdquo;
          </p>
        </div>
      </div>

      {/* ─── Right: Login Form ─────────────────────────────────────── */}
      <div
        className="flex-1 flex items-center justify-center p-6 lg:p-12 relative overflow-hidden"
        style={{ background: '#F8F4F0' }}
      >
        {/* Subtle background shapes */}
        <div
          className="absolute -top-32 -right-32 w-64 h-64 rounded-full opacity-[0.05]"
          style={{ background: 'radial-gradient(circle, #52B788, transparent)' }}
        />
        <div
          className="absolute -bottom-24 -left-24 w-48 h-48 rounded-full opacity-[0.04]"
          style={{ background: 'radial-gradient(circle, #2D6A4F, transparent)' }}
        />

        <div className="w-full max-w-md">

          {/* Mobile logo (hidden on desktop) */}
          <div className="flex items-center gap-3 mb-8 lg:hidden login-enter-1">
            <img
              src="/logo.jpg"
              alt="Rafeeq Logo"
              className="w-12 h-12 object-contain rounded-xl shadow-md"
            />
            <div>
              <div className="font-bold text-lg" style={{ color: '#1A2B22', fontFamily: "'IBM Plex Sans Arabic'" }}>رفيق</div>
              <div className="text-xs" style={{ color: '#8FA89B' }}>Powered by Hakeem</div>
            </div>
          </div>

          {/* Welcome text */}
          <div className="mb-8 login-enter-1">
            <h1 className="text-2xl font-bold mb-2" style={{ color: '#1A2B22', fontFamily: "'IBM Plex Sans Arabic'" }}>
              مرحباً بعودتك 👋
            </h1>
            <p className="text-sm" style={{ color: '#8FA89B', fontFamily: "'IBM Plex Sans Arabic'" }}>
              سجّل دخولك للوصول إلى ملفك الصحي الذكي
            </p>
          </div>

          {/* Login glass card */}
          <div className="login-glass p-8">

            {/* Auth mode tabs */}
            <div className="flex rounded-2xl p-1 mb-6 login-enter-2" style={{ background: 'rgba(45,106,79,0.05)' }}>
              <button
                onClick={() => setMode('sanad')}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all"
                style={{
                  background: mode === 'sanad' ? 'white' : 'transparent',
                  color: mode === 'sanad' ? '#2D6A4F' : '#8FA89B',
                  boxShadow: mode === 'sanad' ? '0 2px 8px rgba(45,106,79,0.10)' : 'none',
                  fontFamily: "'IBM Plex Sans Arabic'",
                }}
              >
                🪪 سند الأردن
              </button>
              <button
                onClick={() => setMode('credentials')}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all"
                style={{
                  background: mode === 'credentials' ? 'white' : 'transparent',
                  color: mode === 'credentials' ? '#2D6A4F' : '#8FA89B',
                  boxShadow: mode === 'credentials' ? '0 2px 8px rgba(45,106,79,0.10)' : 'none',
                  fontFamily: "'IBM Plex Sans Arabic'",
                }}
              >
                🔑 رقم وطني
              </button>
            </div>

            {mode === 'sanad' ? (
              /* ── Sanad SSO ─────────────────────── */
              <div className="space-y-4">
                <button
                  className="login-btn-sanad flex items-center justify-center gap-3 login-enter-3"
                  style={{ fontFamily: "'IBM Plex Sans Arabic'" }}
                  onClick={handleSubmit}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <div className="flex gap-1">
                      {[0, 1, 2].map(i => (
                        <div key={i} className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ background: '#2D6A4F', animationDelay: `${i * 0.15}s` }} />
                      ))}
                    </div>
                  ) : (
                    <>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2D6A4F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                      </svg>
                      <span>تسجيل الدخول عبر سند</span>
                    </>
                  )}
                </button>

                <div className="flex items-center gap-3 login-enter-4">
                  <div className="flex-1 h-px" style={{ background: 'rgba(45,106,79,0.10)' }} />
                  <span className="text-xs" style={{ color: '#8FA89B', fontFamily: "'IBM Plex Sans Arabic'" }}>الطريقة الأسرع والأكثر أماناً</span>
                  <div className="flex-1 h-px" style={{ background: 'rgba(45,106,79,0.10)' }} />
                </div>

                <div
                  className="flex items-center gap-3 p-4 rounded-2xl login-enter-5"
                  style={{ background: 'rgba(45,106,79,0.04)', border: '1px solid rgba(82,183,136,0.12)' }}
                >
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                    style={{ background: 'linear-gradient(135deg, #2D6A4F, #52B788)' }}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                    </svg>
                  </div>
                  <div>
                    <div className="text-xs font-semibold" style={{ color: '#1A2B22', fontFamily: "'IBM Plex Sans Arabic'" }}>
                      تشفير من طرف إلى طرف
                    </div>
                    <div className="text-[11px]" style={{ color: '#8FA89B', fontFamily: "'IBM Plex Sans Arabic'" }}>
                      بياناتك الصحية محمية بمعايير حكيم الأمنية
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              /* ── Credentials ───────────────────── */
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="login-enter-3">
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: '#4A6357', fontFamily: "'IBM Plex Sans Arabic'" }}>
                    الرقم الوطني
                  </label>
                  <div className="relative">
                    <input
                      id="login-national-id"
                      type="text"
                      value={nationalId}
                      onChange={e => setNationalId(e.target.value)}
                      placeholder="أدخل الرقم الوطني"
                      className="login-input pr-11"
                      style={{ fontFamily: "'IBM Plex Sans Arabic'" }}
                      dir="rtl"
                      autoComplete="username"
                    />
                    <div className="absolute right-3.5 top-1/2 -translate-y-1/2">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#8FA89B" strokeWidth="2">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                        <circle cx="12" cy="7" r="4" />
                      </svg>
                    </div>
                  </div>
                </div>

                <div className="login-enter-4">
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: '#4A6357', fontFamily: "'IBM Plex Sans Arabic'" }}>
                    كلمة المرور
                  </label>
                  <div className="relative">
                    <input
                      id="login-password"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder="أدخل كلمة المرور"
                      className="login-input pr-11 pl-11"
                      style={{ fontFamily: "'IBM Plex Sans Arabic'" }}
                      dir="rtl"
                      autoComplete="current-password"
                    />
                    <div className="absolute right-3.5 top-1/2 -translate-y-1/2">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#8FA89B" strokeWidth="2">
                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                      </svg>
                    </div>
                    <button
                      type="button"
                      className="absolute left-3.5 top-1/2 -translate-y-1/2 cursor-pointer"
                      onClick={() => setShowPassword(!showPassword)}
                      tabIndex={-1}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#8FA89B" strokeWidth="2">
                        {showPassword ? (
                          <>
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                            <circle cx="12" cy="12" r="3" />
                          </>
                        ) : (
                          <>
                            <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                            <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                            <line x1="1" y1="1" x2="23" y2="23" />
                          </>
                        )}
                      </svg>
                    </button>
                  </div>
                </div>

                <div className="flex justify-between items-center login-enter-5">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" className="w-3.5 h-3.5 rounded accent-emerald-deep" />
                    <span className="text-xs" style={{ color: '#4A6357', fontFamily: "'IBM Plex Sans Arabic'" }}>تذكرني</span>
                  </label>
                  <button type="button" className="text-xs font-medium" style={{ color: '#52B788', fontFamily: "'IBM Plex Sans Arabic'" }}>
                    نسيت كلمة المرور؟
                  </button>
                </div>

                <button
                  type="submit"
                  className="login-btn-primary login-enter-6"
                  style={{ fontFamily: "'IBM Plex Sans Arabic'" }}
                  disabled={isLoading || !nationalId.trim() || !password.trim()}
                >
                  {isLoading ? (
                    <div className="flex justify-center gap-1">
                      {[0, 1, 2].map(i => (
                        <div key={i} className="w-1.5 h-1.5 rounded-full bg-white animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
                      ))}
                    </div>
                  ) : (
                    'تسجيل الدخول'
                  )}
                </button>
              </form>
            )}
          </div>

          {/* Footer */}
          <div className="mt-6 text-center login-enter-7">
            <p className="text-xs" style={{ color: '#8FA89B', fontFamily: "'IBM Plex Sans Arabic'" }}>
              ليس لديك حساب؟{' '}
              <button className="font-semibold" style={{ color: '#2D6A4F' }}>سجّل عبر حكيم</button>
            </p>
            <div className="mt-4 pt-4 border-t border-emerald-50 text-xs flex flex-col gap-2 items-center" style={{ color: '#8FA89B', fontFamily: "'IBM Plex Sans Arabic'" }}>
              <div className="font-semibold mb-1">تسجيل الدخول التجريبي:</div>
              <div className="flex gap-4">
                <button type="button" onClick={(e) => handleSubmit(e, 'doctor')} className="font-semibold transition-transform hover:scale-105 px-3 py-1.5 rounded-lg" style={{ background: 'rgba(212,169,106,0.15)', color: '#A07C3A' }}>
                  🏥 كطبيب (د. أحمد)
                </button>
                <button type="button" onClick={(e) => handleSubmit(e, 'patient')} className="font-semibold transition-transform hover:scale-105 px-3 py-1.5 rounded-lg" style={{ background: 'rgba(45,106,79,0.1)', color: '#2D6A4F' }}>
                  👤 كمريض (حساب د. أحمد الشخصي)
                </button>
              </div>
            </div>
            <div className="flex items-center justify-center gap-4 mt-4">
              <span className="text-[10px]" style={{ color: '#B7E4C7' }}>🔐 HIPAA Compliant</span>
              <span className="text-[10px]" style={{ color: '#B7E4C7' }}>·</span>
              <span className="text-[10px]" style={{ color: '#B7E4C7' }}>🇯🇴 Hakeem Certified</span>
              <span className="text-[10px]" style={{ color: '#B7E4C7' }}>·</span>
              <span className="text-[10px]" style={{ color: '#B7E4C7' }}>🛡️ End-to-End Encrypted</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
