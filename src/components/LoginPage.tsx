'use client';

import { useState } from 'react';

interface LoginPageProps {
  onLogin: (role: 'patient' | 'doctor') => void;
}

export default function LoginPage({ onLogin }: LoginPageProps) {
  const [nationalId, setNationalId] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent, role: 'patient' | 'doctor' = 'patient') => {
    e.preventDefault();
    setIsLoading(true);
    // Simulate login — replace with real API call
    setTimeout(() => {
      setIsLoading(false);
      onLogin(role);
    }, 1500);
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-[#0A1913]" dir="rtl">
      
      {/* Dynamic Animated Mesh Gradient Background */}
      <div className="absolute inset-0 w-full h-full">
        <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] bg-[#2D6A4F] rounded-full mix-blend-screen filter blur-[120px] opacity-60 animate-blob" />
        <div className="absolute top-[20%] -right-[10%] w-[60%] h-[60%] bg-[#081C15] rounded-full mix-blend-screen filter blur-[150px] opacity-80 animate-blob animation-delay-2000" />
        <div className="absolute -bottom-[20%] left-[20%] w-[50%] h-[50%] bg-[#1B4332] rounded-full mix-blend-screen filter blur-[120px] opacity-70 animate-blob animation-delay-4000" />
      </div>

      <div className="relative z-10 w-full max-w-[1000px] flex flex-col md:flex-row items-center justify-between gap-12 px-6">
        
        {/* Left Side: Branding */}
        <div className="flex-1 text-center md:text-right hidden md:block">
          <img
            src="/logo.png"
            alt="Rafeeq Logo"
            className="w-32 h-32 object-contain drop-shadow-2xl mb-8"
          />
          <h1 className="text-5xl lg:text-6xl font-bold mb-4 text-white" style={{ fontFamily: "'IBM Plex Sans Arabic'" }}>
            رفيق
          </h1>
          <h2 className="text-2xl font-light text-[#B7E4C7] mb-6" style={{ fontFamily: "'IBM Plex Sans Arabic'" }}>
            مستقبلك الصحي، بين يديك.
          </h2>
          <p className="text-lg text-[#95D5B2] leading-relaxed max-w-md opacity-80" style={{ fontFamily: "'IBM Plex Sans Arabic'" }}>
            المساعد الطبي الذكي المتكامل مع نظام حكيم. مدعوم بالذكاء الاصطناعي لتوفير تحليل لحظي، تتبع دقيق للأدوية، ورعاية صحية فائقة لك ولعائلتك.
          </p>
        </div>

        {/* Right Side: Glass Login Card */}
        <div className="w-full max-w-[450px]">
          <div className="bg-white/10 backdrop-blur-2xl border border-white/20 p-10 rounded-3xl shadow-[0_8px_32px_rgba(0,0,0,0.3)]">
            
            <div className="md:hidden flex flex-col items-center mb-8">
              <img
                src="/logo.png"
                alt="Rafeeq Logo"
                className="w-20 h-20 object-contain drop-shadow-2xl mb-4"
              />
              <h1 className="text-3xl font-bold text-white" style={{ fontFamily: "'IBM Plex Sans Arabic'" }}>رفيق</h1>
            </div>

            <div className="mb-8">
              <h2 className="text-2xl font-bold text-white mb-2" style={{ fontFamily: "'IBM Plex Sans Arabic'" }}>
                تسجيل الدخول
              </h2>
              <p className="text-[#95D5B2] text-sm" style={{ fontFamily: "'IBM Plex Sans Arabic'" }}>
                للوصول إلى ملفك الصحي الذكي
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-[#D8F3DC]" style={{ fontFamily: "'IBM Plex Sans Arabic'" }}>الرقم الوطني</label>
                <div className="relative">
                  <input
                    type="text"
                    value={nationalId}
                    onChange={(e) => setNationalId(e.target.value)}
                    className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3.5 text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-[#52B788] focus:border-transparent transition-all"
                    placeholder="JO-0000-XXX-000"
                    style={{ fontFamily: "'IBM Plex Sans Arabic'" }}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-[#D8F3DC]" style={{ fontFamily: "'IBM Plex Sans Arabic'" }}>كلمة المرور</label>
                <div className="relative">
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3.5 text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-[#52B788] focus:border-transparent transition-all"
                    placeholder="••••••••"
                    style={{ fontFamily: "'IBM Plex Sans Arabic'" }}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <label className="flex items-center gap-2 cursor-pointer group">
                  <input type="checkbox" className="w-4 h-4 rounded border-white/20 bg-black/20 accent-[#52B788]" />
                  <span className="text-sm text-[#B7E4C7] group-hover:text-white transition-colors" style={{ fontFamily: "'IBM Plex Sans Arabic'" }}>تذكرني</span>
                </label>
                <button type="button" className="text-sm text-[#52B788] hover:text-[#74C69D] font-medium transition-colors" style={{ fontFamily: "'IBM Plex Sans Arabic'" }}>
                  نسيت كلمة المرور؟
                </button>
              </div>

              <button
                type="submit"
                disabled={isLoading || !nationalId.trim() || !password.trim()}
                className="w-full bg-gradient-to-l from-[#2D6A4F] to-[#40916C] hover:from-[#40916C] hover:to-[#52B788] text-white rounded-xl py-4 font-bold text-lg shadow-[0_4px_14px_rgba(45,106,79,0.4)] transform hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                style={{ fontFamily: "'IBM Plex Sans Arabic'" }}
              >
                {isLoading ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-2 h-2 bg-white rounded-full animate-bounce" />
                    <div className="w-2 h-2 bg-white rounded-full animate-bounce animation-delay-200" />
                    <div className="w-2 h-2 bg-white rounded-full animate-bounce animation-delay-400" />
                  </div>
                ) : (
                  'تسجيل الدخول'
                )}
              </button>

            </form>

            {/* Quick Demo Logins */}
            <div className="mt-8 pt-6 border-t border-white/10 text-center">
              <p className="text-xs text-[#95D5B2] mb-4 uppercase tracking-widest font-semibold">Demo Access</p>
              <div className="flex flex-col gap-3">
                <button
                  type="button"
                  onClick={(e) => handleSubmit(e, 'doctor')}
                  className="w-full bg-[#1B4332]/50 hover:bg-[#1B4332] border border-[#2D6A4F] text-[#D8F3DC] rounded-xl py-3 text-sm font-medium transition-all"
                  style={{ fontFamily: "'IBM Plex Sans Arabic'" }}
                >
                  👨‍⚕️ الدخول كطبيب (د. أحمد)
                </button>
                <button
                  type="button"
                  onClick={(e) => handleSubmit(e, 'patient')}
                  className="w-full bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-xl py-3 text-sm font-medium transition-all"
                  style={{ fontFamily: "'IBM Plex Sans Arabic'" }}
                >
                  👤 الدخول كمريض (حساب تجريبي)
                </button>
              </div>
            </div>

          </div>
        </div>

      </div>

      {/* Global CSS required for the animated background blobs */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes blob {
          0% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}} />
    </div>
  );
}
