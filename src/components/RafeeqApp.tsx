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

export type UserRole = 'patient' | 'doctor';

export default function RafeeqApp() {
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [activeView, setActiveView] = useState<View>('dashboard');
  const [caregiverMode, setCaregiverMode] = useState(false);

  const handleViewChange = useCallback((view: View) => {
    setActiveView(view);
  }, []);

  // ── Login Gate ──────────────────────────────────────────────────
  if (!userRole) {
    return <LoginPage onLogin={(role) => {
      setUserRole(role);
      setActiveView(role === 'doctor' ? 'doctor' : 'dashboard');
    }} />;
  }

  // ── Main App Shell ─────────────────────────────────────────────
  return (
    <div
      className={`flex h-screen overflow-hidden ${caregiverMode ? 'caregiver-mode' : ''}`}
      style={{ background: 'var(--bg)' }}
    >
      {/* Frosted Glass Sidebar */}
      <Sidebar activeView={activeView} onViewChange={handleViewChange} userRole={userRole} />

      {/* Main Content */}
      <div className="flex flex-col flex-1 overflow-hidden">
        <TopBar
          activeView={activeView}
          caregiverMode={caregiverMode}
          onCaregiverToggle={() => setCaregiverMode(v => !v)}
          userRole={userRole}
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
