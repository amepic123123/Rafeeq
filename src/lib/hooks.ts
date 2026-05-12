'use client';
// ─── Rafeeq — React Data Hooks ────────────────────────────────────────────────
// All components consume data through these hooks exclusively.
// Each hook uses the pattern: load on mount, expose { data, loading, error }.

import { useState, useEffect, useCallback, useRef } from 'react';
import type { FetchState } from './types';
import * as api from './api';
import type {
  Patient, HealthScoreData, QuickStats, Insight, Medication,
  HbA1cPoint, BPPoint, RiskFlag, HakeemEntry, ChatMessage,
  SuggestedPrompt, FamilyMember, FamilySummary, PrescriptionAnalysisResult,
} from './types';

// ── Generic fetch hook factory ────────────────────────────────────────────────
function useFetch<T>(fetcher: () => Promise<T>, skip = false): FetchState<T> {
  const [state, setState] = useState<FetchState<T>>({
    data: null, loading: !skip, error: null,
  });

  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  useEffect(() => {
    if (skip) {
      setState({ data: null, loading: false, error: null });
      return;
    }

    let cancelled = false;
    setState(prev => ({ ...prev, loading: true, error: null }));

    fetcherRef.current()
      .then(data => { if (!cancelled) setState({ data, loading: false, error: null }); })
      .catch(err  => { if (!cancelled) setState({ data: null, loading: false, error: String(err) }); });

    return () => { cancelled = true; };
  }, [skip]); // Only re-run if skip changes, otherwise relies on component unmount/remount.

  return state;
}

// ─────────────────────────────────────────────────────────────────────────────
// ─────────────────────────────────────────────────────────────────────────────
// Patient hooks
// ─────────────────────────────────────────────────────────────────────────────

export function usePatient(patientId?: string): FetchState<Patient> {
  return useFetch(() => api.getPatient(patientId!), !patientId);
}

export function useHealthScore(patientId?: string): FetchState<HealthScoreData> {
  return useFetch(() => api.getHealthScore(patientId!), !patientId);
}

export function useQuickStats(patientId?: string): FetchState<QuickStats> {
  return useFetch(() => api.getQuickStats(patientId!), !patientId);
}

export function useInsights(patientId?: string): FetchState<Insight[]> {
  return useFetch(() => api.getInsights(patientId!), !patientId);
}

export function useMedications(patientId?: string): FetchState<Medication[]> {
  return useFetch(() => api.getMedications(patientId!), !patientId);
}

// ─────────────────────────────────────────────────────────────────────────────
// Lab hooks
// ─────────────────────────────────────────────────────────────────────────────

export function useHbA1cHistory(patientId?: string, months = 7): FetchState<HbA1cPoint[]> {
  return useFetch(() => api.getHbA1cHistory(patientId!, months), !patientId);
}

export function useBloodPressureHistory(patientId?: string, days = 7): FetchState<BPPoint[]> {
  return useFetch(() => api.getBloodPressureHistory(patientId!, days), !patientId);
}

// ─────────────────────────────────────────────────────────────────────────────
// Doctor / clinical hooks
// ─────────────────────────────────────────────────────────────────────────────

export function useRiskFlags(patientId?: string): FetchState<RiskFlag[]> {
  return useFetch(() => api.getRiskFlags(patientId!), !patientId);
}

export function useHakeemHistory(patientId?: string, limit = 10): FetchState<HakeemEntry[]> {
  return useFetch(() => api.getHakeemHistory(patientId!, limit), !patientId);
}

// ─────────────────────────────────────────────────────────────────────────────
// Chat hooks
// ─────────────────────────────────────────────────────────────────────────────

export function useChatHistory(patientId?: string): FetchState<ChatMessage[]> {
  return useFetch(() => api.getChatHistory(patientId!), !patientId);
}

export function useSuggestedPrompts(patientId?: string): FetchState<SuggestedPrompt[]> {
  return useFetch(() => api.getSuggestedPrompts(patientId!), !patientId);
}

/**
 * useSendMessage — returns a stable `send` function that hits the backend,
 * appends the user message and AI response to a local message list,
 * and manages typing indicator state.
 */
export function useSendMessage(patientId: string) {
  const [isSending, setIsSending] = useState(false);

  const send = useCallback(
    async (
      textAr: string,
      onNewMessages: (msgs: ChatMessage[]) => void,
    ) => {
      if (!textAr.trim() || isSending) return;
      setIsSending(true);

      const userMsg: ChatMessage = {
        id: Date.now(),
        role: 'user',
        textAr,
        textEn: textAr,
        time: new Date().toLocaleTimeString('ar-JO', { hour: '2-digit', minute: '2-digit' }),
      };
      onNewMessages([userMsg]);

      try {
        const aiMsg = await api.sendChatMessage(patientId, { patientId, message: textAr, lang: 'ar' });
        onNewMessages([aiMsg]);
      } catch {
        // sendChatMessage already has a mock fallback — this path shouldn't be hit
      } finally {
        setIsSending(false);
      }
    },
    [patientId, isSending],
  );

  return { send, isSending };
}

// ─────────────────────────────────────────────────────────────────────────────
// Family hooks
// ─────────────────────────────────────────────────────────────────────────────

export function useFamilyMembers(patientId?: string): FetchState<FamilyMember[]> {
  return useFetch(() => api.getFamilyMembers(patientId!), !patientId);
}

export function useFamilySummary(patientId?: string): FetchState<FamilySummary> {
  return useFetch(() => api.getFamilySummary(patientId!), !patientId);
}

// ─────────────────────────────────────────────────────────────────────────────
// Prescription upload hook
// ─────────────────────────────────────────────────────────────────────────────

export function usePrescriptionAnalysis(patientId: string) {
  const [result, setResult]     = useState<PrescriptionAnalysisResult | null>(null);
  const [isScanning, setScanning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError]       = useState<string | null>(null);

  const analyze = useCallback(async (file: File) => {
    setScanning(true);
    setProgress(0);
    setError(null);
    setResult(null);

    try {
      const data = await api.analyzePrescription(patientId, file, pct => setProgress(pct));
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setScanning(false);
    }
  }, [patientId]);

  const reset = useCallback(() => {
    setResult(null);
    setProgress(0);
    setError(null);
  }, []);

  return { result, isScanning, progress, error, analyze, reset };
}

// Skeleton lives in a .tsx file since this file cannot contain JSX
export { Skeleton } from '@/components/Skeleton';
