'use client';

import { useState, useCallback } from 'react';
import LoginPage from '@/components/LoginPage';
import Sidebar from '@/components/Sidebar';
import TopBar from '@/components/TopBar';
import PatientDashboard from '@/components/PatientDashboard';
import DoctorView from '@/components/DoctorView';
import ChatView from '@/components/ChatView';
import LabsView from '@/components/LabsView';
import FamilyView from '@/components/FamilyView';

export type View = 'dashboard' | 'chat' | 'labs' | 'doctor' | 'family';

export default function RafeeqApp() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [activeView, setActiveView] = useState<View>('dashboard');
  const [caregiverMode, setCaregiverMode] = useState(false);

  const handleViewChange = useCallback((view: View) => {
    setActiveView(view);
  }, []);

  // ── Login Gate ──────────────────────────────────────────────────
  if (!isLoggedIn) {
    return <LoginPage onLogin={() => setIsLoggedIn(true)} />;
  }

  // ── Main App Shell ─────────────────────────────────────────────
  return (
    <div
      className={`flex h-screen overflow-hidden ${caregiverMode ? 'caregiver-mode' : ''}`}
      style={{ background: 'var(--bg)' }}
    >
      {/* Frosted Glass Sidebar */}
      <Sidebar activeView={activeView} onViewChange={handleViewChange} />

      {/* Main Content */}
      <div className="flex flex-col flex-1 overflow-hidden">
        <TopBar
          activeView={activeView}
          caregiverMode={caregiverMode}
          onCaregiverToggle={() => setCaregiverMode(v => !v)}
        />

        <main className="flex-1 overflow-auto">
          {activeView === 'dashboard' && <PatientDashboard caregiverMode={caregiverMode} />}
          {activeView === 'doctor'    && <DoctorView />}
          {activeView === 'chat'      && <ChatView />}
          {activeView === 'labs'      && <LabsView />}
          {activeView === 'family'    && <FamilyView />}
        </main>
      </div>
    </div>
  );
}
