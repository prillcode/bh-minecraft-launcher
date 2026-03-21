import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { TitleBar } from './components/layout/TitleBar';
import { Sidebar } from './components/layout/Sidebar';
import { StatusBar } from './components/layout/StatusBar';
import { LoginScreen } from './components/auth/LoginScreen';
import { InstanceList } from './components/instances/InstanceList';
import { useAuthStore } from './stores/auth-store';

export function App() {
  const { profile, isLoading } = useAuthStore();

  if (isLoading) {
    return (
      <div className="app-loading">
        <div className="loader" />
        <p>Loading BlockHaven Launcher...</p>
      </div>
    );
  }

  if (!profile) {
    return <LoginScreen />;
  }

  return (
    <HashRouter>
      <div className="app-shell">
        <TitleBar />
        <div className="app-body">
          <Sidebar />
          <main className="app-content">
            <Routes>
              <Route path="/" element={<Navigate to="/instances" replace />} />
              <Route path="/instances" element={<InstanceList />} />
              <Route path="/mods" element={<div>Mod Browser (coming soon)</div>} />
              <Route path="/settings" element={<div>Settings (coming soon)</div>} />
            </Routes>
          </main>
        </div>
        <StatusBar />
      </div>
    </HashRouter>
  );
}
