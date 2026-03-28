import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { TitleBar } from './components/layout/TitleBar';
import { Sidebar } from './components/layout/Sidebar';
import { StatusBar } from './components/layout/StatusBar';
import { LoginScreen } from './components/auth/LoginScreen';
import { InstanceList } from './components/instances/InstanceList';
import { ModsTab } from './components/mods/ModsTab';
import { ShadersTab } from './components/shaders/ShadersTab';
import { SettingsPage } from './components/settings/SettingsPage';
import { useAuthStore } from './stores/auth-store';
import { SelectedInstanceProvider } from './stores/selected-instance-context';

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
    <SelectedInstanceProvider>
      <HashRouter>
        <div className="app-shell">
          <TitleBar />
          <div className="app-body">
            <Sidebar />
            <main className="app-content">
              <Routes>
                <Route path="/" element={<Navigate to="/instances" replace />} />
                <Route path="/instances" element={<InstanceList />} />
                <Route path="/mods" element={<ModsTab />} />
                <Route path="/shaders" element={<ShadersTab />} />
                <Route path="/settings" element={<SettingsPage />} />
              </Routes>
            </main>
          </div>
          <StatusBar />
        </div>
      </HashRouter>
    </SelectedInstanceProvider>
  );
}
