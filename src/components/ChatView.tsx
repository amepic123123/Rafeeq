'use client';

import { useState, useRef, useEffect } from 'react';
import { chatMessages, suggestedPrompts } from '@/lib/data';

type Message = { id: number; role: 'ai' | 'user'; textAr: string; textEn: string; time: string };

export default function ChatView() {
  const [messages, setMessages] = useState<Message[]>(chatMessages);
  const [input, setInput] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const sendMessage = (textAr: string) => {
    if (!textAr.trim()) return;

    const userMsg: Message = {
      id: Date.now(),
      role: 'user',
      textAr,
      textEn: textAr,
      time: new Date().toLocaleTimeString('ar-JO', { hour: '2-digit', minute: '2-digit' }),
    };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    setTimeout(() => {
      const aiResponses = [
        'شكراً على سؤالك يا خالد! بناءً على سجلك الصحي في حكيم، أنصحك بمراجعة طبيبك لهاد الموضوع. سحا وعافية! 🌿',
        'بناءً على تحاليلك الأخيرة، وضعك الصحي تحسّن بشكل ملحوظ. استمر بنفس النهج وربنا يعافيك! 💪',
        'سؤال ممتاز! رفيق يتحقق من بيانات حكيم الخاصة فيك ويوفر لك أفضل إجابة ممكنة. مبروك على التزامك الصحي! 🎉',
      ];
      const aiMsg: Message = {
        id: Date.now() + 1,
        role: 'ai',
        textAr: aiResponses[Math.floor(Math.random() * aiResponses.length)],
        textEn: '',
        time: new Date().toLocaleTimeString('ar-JO', { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages(prev => [...prev, aiMsg]);
      setIsTyping(false);
    }, 1800);
  };

  return (
    <div className="flex flex-col h-full" dir="rtl">

      {/* Chat Header */}
      <div
        className="px-6 py-4 flex items-center gap-4 border-b"
        style={{ borderColor: 'rgba(255,255,255,0.4)', background: 'rgba(255,255,255,0.5)' }}
      >
        {/* Orb mini */}
        <div className="w-10 h-10 ai-orb shrink-0" />
        <div>
          <div className="font-semibold text-sm" style={{ color: '#1A2B22', fontFamily: "'IBM Plex Sans Arabic'" }}>
            رفيق — مساعدك الصحي الذكي
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
            <span className="text-xs" style={{ color: '#52B788', fontFamily: "'Inter'" }}>
              متصل • Verified via Hakeem
            </span>
          </div>
        </div>
        <span className="hakeem-badge mr-auto">✓ حكيم</span>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
        {messages.map((msg, i) => (
          <div
            key={msg.id}
            className={`flex ${msg.role === 'user' ? 'justify-start' : 'justify-end'} fade-up`}
            style={{ animationDelay: `${i * 0.04}s` }}
          >
            {msg.role === 'ai' && (
              <div className="w-7 h-7 ai-orb shrink-0 ml-2 mt-1" />
            )}
            <div className="max-w-[72%]">
              <div
                className={`px-4 py-3 text-sm leading-relaxed ${
                  msg.role === 'user' ? 'chat-bubble-user' : 'chat-bubble-ai'
                }`}
                style={{ fontFamily: "'IBM Plex Sans Arabic'" }}
              >
                {msg.textAr}
              </div>
              <div
                className={`text-[10px] mt-1 ${msg.role === 'user' ? 'text-left' : 'text-right'}`}
                style={{ color: '#8FA89B', fontFamily: "'Inter'" }}
              >
                {msg.time}
              </div>
            </div>
          </div>
        ))}

        {/* Typing indicator */}
        {isTyping && (
          <div className="flex justify-end fade-up">
            <div className="w-7 h-7 ai-orb shrink-0 ml-2 mt-1" />
            <div
              className="chat-bubble-ai px-4 py-3 flex gap-1 items-center"
            >
              {[0, 1, 2].map(i => (
                <div
                  key={i}
                  className="w-1.5 h-1.5 rounded-full animate-bounce"
                  style={{ background: '#52B788', animationDelay: `${i * 0.15}s` }}
                />
              ))}
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Suggested prompts */}
      <div
        className="px-6 py-2 flex gap-2 overflow-x-auto"
        style={{ scrollbarWidth: 'none' }}
      >
        {suggestedPrompts.map(p => (
          <button
            key={p.id}
            className="prompt-pill shrink-0"
            style={{ fontFamily: "'IBM Plex Sans Arabic'" }}
            onClick={() => sendMessage(p.textAr)}
          >
            {p.textAr}
          </button>
        ))}
      </div>

      {/* Input Bar */}
      <div
        className="px-6 pb-6 pt-3"
        style={{ borderTop: '1px solid rgba(255,255,255,0.4)' }}
      >
        <div
          className="flex items-center gap-3 px-4 py-3 rounded-2xl"
          style={{
            background: 'rgba(255,255,255,0.85)',
            border: '1px solid rgba(82,183,136,0.25)',
            boxShadow: '0 4px 20px rgba(45,106,79,0.08)',
          }}
        >
          {/* Voice button */}
          <button
            id="voice-input-btn"
            onClick={() => setIsRecording(r => !r)}
            className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-all"
            style={{
              background: isRecording ? '#EF4444' : 'rgba(45,106,79,0.08)',
              color: isRecording ? 'white' : '#2D6A4F',
            }}
          >
            {isRecording ? (
              /* Animated waveform */
              <div className="flex items-end gap-0.5 h-4">
                {[4, 7, 5, 8, 4, 6, 3].map((h, i) => (
                  <div
                    key={i}
                    className="wave-bar w-0.5 rounded-full bg-white"
                    style={{ height: h * 2, animationDelay: `${i * 0.1}s` }}
                  />
                ))}
              </div>
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
                <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
                <line x1="12" y1="19" x2="12" y2="23"/>
                <line x1="8" y1="23" x2="16" y2="23"/>
              </svg>
            )}
          </button>

          {/* Text input */}
          <input
            id="chat-input"
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && sendMessage(input)}
            placeholder="اسأل رفيق أي شيء عن صحتك..."
            className="flex-1 bg-transparent outline-none text-sm"
            style={{ color: '#1A2B22', fontFamily: "'IBM Plex Sans Arabic'" }}
            dir="rtl"
          />

          {/* Send button */}
          <button
            id="send-btn"
            onClick={() => sendMessage(input)}
            disabled={!input.trim()}
            className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-all disabled:opacity-40 hover:scale-105"
            style={{ background: 'linear-gradient(135deg, #2D6A4F, #52B788)', color: 'white' }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="22" y1="2" x2="11" y2="13"/>
              <polygon points="22 2 15 22 11 13 2 9 22 2"/>
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
