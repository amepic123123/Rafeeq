'use client';

import { useState, useRef, useEffect } from 'react';
import { useChatHistory, useSuggestedPrompts, useSendMessage, Skeleton } from '@/lib/hooks';
import type { ChatMessage } from '@/lib/types';

const PATIENT_ID = 'JO-2026-KHL-4821';

export default function ChatView() {
  const { data: initialMessages, loading: lHistory } = useChatHistory(PATIENT_ID);
  const { data: prompts,          loading: lPrompts  } = useSuggestedPrompts(PATIENT_ID);
  const { send, isSending }                            = useSendMessage(PATIENT_ID);

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput]       = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [dictationLang, setDictationLang] = useState<'ar-JO' | 'en-AE'>('ar-JO');
  const recognitionRef = useRef<any>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Seed messages from API once loaded
  useEffect(() => {
    if (initialMessages) setMessages(initialMessages);
  }, [initialMessages]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isSending]);

  const handleSend = async (textAr: string) => {
    if (!textAr.trim() || isSending) return;
    
    if (isRecording && recognitionRef.current) {
      recognitionRef.current.stop();
      setIsRecording(false);
    }

    setInput('');
    await send(textAr, newMsgs => setMessages(prev => [...prev, ...newMsgs]));
  };

  const handleMicrophoneClick = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('عذراً، متصفحك لا يدعم خاصية الإملاء الصوتي.');
      return;
    }

    if (isRecording) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsRecording(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognitionRef.current = recognition;
    
    recognition.lang = dictationLang;
    recognition.continuous = true;
    recognition.interimResults = true;
    
    let currentFinalTranscript = input;

    recognition.onstart = () => setIsRecording(true);
    
    recognition.onresult = (event: any) => {
      let interimTranscript = '';
      let newFinalTranscript = '';
      
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          newFinalTranscript += event.results[i][0].transcript;
        } else {
          interimTranscript += event.results[i][0].transcript;
        }
      }
      
      if (newFinalTranscript) {
        currentFinalTranscript += (currentFinalTranscript ? ' ' : '') + newFinalTranscript;
        setInput(currentFinalTranscript);
      } else if (interimTranscript) {
        setInput(currentFinalTranscript + (currentFinalTranscript ? ' ' : '') + interimTranscript);
      }
    };
    
    recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      if (event.error === 'network') {
        alert('حدث خطأ في الاتصال بخوادم التعرف على الصوت (Network Error). يرجى التحقق من اتصالك بالإنترنت أو إيقاف الـ VPN، أو استخدام الكتابة اليدوية بدلاً من ذلك.');
      }
      setIsRecording(false);
    };
    
    recognition.onend = () => setIsRecording(false);
    
    try {
      recognition.start();
    } catch (e) {
      console.error('Failed to start speech recognition:', e);
      setIsRecording(false);
    }
  };

  return (
    <div className="flex flex-col h-full" dir="rtl">

      {/* Chat Header */}
      <div className="px-6 py-4 flex items-center gap-4 border-b" style={{ borderColor: 'rgba(255,255,255,0.4)', background: 'rgba(255,255,255,0.5)' }}>
        <div className="w-10 h-10 ai-orb shrink-0" />
        <div>
          <div className="font-semibold text-sm" style={{ color: '#1A2B22', fontFamily: "'IBM Plex Sans Arabic'" }}>رفيق — مساعدك الصحي الذكي</div>
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
            <span className="text-xs" style={{ color: '#52B788', fontFamily: "'Inter'" }}>متصل • Verified via Hakeem</span>
          </div>
        </div>
        <span className="hakeem-badge mr-auto">✓ حكيم</span>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
        {lHistory
          ? [1, 2, 3].map(i => (
              <div key={i} className={`flex ${i % 2 === 0 ? 'justify-start' : 'justify-end'}`}>
                <Skeleton h="h-12" className={i % 2 === 0 ? 'w-2/3' : 'w-1/2'} />
              </div>
            ))
          : messages.map((msg, i) => (
              <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-start' : 'justify-end'} fade-up`} style={{ animationDelay: `${i * 0.04}s` }}>
                {msg.role === 'ai' && <div className="w-7 h-7 ai-orb shrink-0 ml-2 mt-1" />}
                <div className="max-w-[72%]">
                  <div className={`px-4 py-3 text-sm leading-relaxed ${msg.role === 'user' ? 'chat-bubble-user' : 'chat-bubble-ai'}`} style={{ fontFamily: "'IBM Plex Sans Arabic'" }}>
                    {msg.textAr}
                  </div>
                  <div className={`text-[10px] mt-1 ${msg.role === 'user' ? 'text-left' : 'text-right'}`} style={{ color: '#8FA89B', fontFamily: "'Inter'" }}>{msg.time}</div>
                </div>
              </div>
            ))
        }

        {/* Typing indicator */}
        {isSending && (
          <div className="flex justify-end fade-up">
            <div className="w-7 h-7 ai-orb shrink-0 ml-2 mt-1" />
            <div className="chat-bubble-ai px-4 py-3 flex gap-1 items-center">
              {[0, 1, 2].map(i => <div key={i} className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ background: '#52B788', animationDelay: `${i * 0.15}s` }} />)}
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Suggested prompts */}
      <div className="px-6 py-2 flex gap-2 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
        {lPrompts
          ? [1, 2, 3, 4].map(i => <Skeleton key={i} h="h-8" className="w-36 rounded-full shrink-0" />)
          : (prompts ?? []).map(p => (
              <button key={p.id} className="prompt-pill shrink-0" style={{ fontFamily: "'IBM Plex Sans Arabic'" }} onClick={() => handleSend(p.textAr)}>
                {p.textAr}
              </button>
            ))
        }
      </div>

      {/* Input Bar */}
      <div className="px-6 pb-6 pt-3" style={{ borderTop: '1px solid rgba(255,255,255,0.4)' }}>
        <div className="flex items-center gap-3 px-4 py-3 rounded-2xl" style={{ background: 'rgba(255,255,255,0.85)', border: '1px solid rgba(82,183,136,0.25)', boxShadow: '0 4px 20px rgba(45,106,79,0.08)' }}>
          {/* Voice button */}
          <button id="voice-input-btn" onClick={handleMicrophoneClick} className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-all" style={{ background: isRecording ? '#EF4444' : 'rgba(45,106,79,0.08)', color: isRecording ? 'white' : '#2D6A4F' }}>
            {isRecording ? (
              <div className="flex items-end gap-0.5 h-4">
                {[4, 7, 5, 8, 4, 6, 3].map((h, i) => <div key={i} className="wave-bar w-0.5 rounded-full bg-white" style={{ height: h * 2, animationDelay: `${i * 0.1}s` }} />)}
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

          <button
            onClick={() => setDictationLang(l => l === 'ar-JO' ? 'en-AE' : 'ar-JO')}
            className="text-xs font-bold px-2 py-1 rounded-lg transition-colors hover:bg-gray-100"
            style={{ color: '#4A6357', fontFamily: "'IBM Plex Sans Arabic'" }}
            title="تغيير لغة الإملاء الصوتي"
          >
            {dictationLang === 'ar-JO' ? 'عربي' : 'EN'}
          </button>

          <input
            id="chat-input" type="text" value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSend(input)}
            placeholder="اسأل رفيق أي شيء عن صحتك..."
            className="flex-1 bg-transparent outline-none text-sm" dir="rtl"
            style={{ color: '#1A2B22', fontFamily: "'IBM Plex Sans Arabic'" }}
          />

          <button
            id="send-btn" onClick={() => handleSend(input)} disabled={!input.trim() || isSending}
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
