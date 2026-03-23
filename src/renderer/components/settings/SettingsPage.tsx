import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/auth-store';

const inputStyle: React.CSSProperties = {
  background: 'var(--bg-elevated)',
  border: '1px solid var(--border)',
  borderRadius: 'var(--radius-sm)',
  color: 'var(--text-primary)',
  padding: '4px 8px',
  fontSize: 13,
};

export function SettingsPage() {
  const [settings, setSettings] = useState<LauncherSettings | null>(null);
  const [appInfo, setAppInfo] = useState<{ version: string; dataPath: string } | null>(null);
  const [cacheClearing, setCacheClearing] = useState(false);
  const { profile, authMode, setProfile, setAuthMode } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    window.launcher.settings.get().then(setSettings);
    window.launcher.settings.getAppInfo().then(setAppInfo);
  }, []);

  function save<K extends keyof LauncherSettings>(key: K, value: LauncherSettings[K]) {
    window.launcher.settings.set(key, value);
    setSettings(prev => prev ? { ...prev, [key]: value } : prev);
  }

  function formatMemory(mb: number): string {
    return mb >= 1024 ? `${(mb / 1024).toFixed(1)} GB` : `${mb} MB`;
  }

  async function handleRelogin() {
    await window.launcher.auth.logout();
    setProfile(null);
    navigate('/login');
  }

  function handleDefaultAuthMode(mode: 'microsoft' | 'offline') {
    save('defaultAuthMode', mode);
    setAuthMode(mode);
  }

  async function handleClearCache() {
    if (!window.confirm('Clear cache (temp and natives directories)? The game will re-download these files on next launch.')) return;
    setCacheClearing(true);
    try {
      await window.launcher.settings.clearCache();
    } finally {
      setCacheClearing(false);
    }
  }

  if (!settings) return null;

  return (
    <div className="settings">

      {/* 1. Account */}
      <section className="settings__section">
        <h2 className="settings__section-title">Account</h2>

        <div className="settings__account">
          <div className="settings__avatar">👤</div>
          <div className="settings__account-info">
            <div className="settings__account-name">{profile?.name ?? 'Unknown'}</div>
            <span className={`settings__auth-badge settings__auth-badge--${authMode}`}>
              {authMode === 'microsoft' ? 'Microsoft' : 'Offline'}
            </span>
          </div>
        </div>

        <div className="settings__row">
          <span className="settings__label">Default auth mode</span>
          <div style={{ display: 'flex', gap: 6 }}>
            <button
              className={`btn btn--sm ${authMode === 'microsoft' ? 'btn--primary' : 'btn--ghost'}`}
              onClick={() => handleDefaultAuthMode('microsoft')}
            >
              Microsoft
            </button>
            <button
              className={`btn btn--sm ${authMode === 'offline' ? 'btn--primary' : 'btn--ghost'}`}
              onClick={() => handleDefaultAuthMode('offline')}
            >
              Offline
            </button>
          </div>
        </div>

        <div className="settings__row">
          <span className="settings__label">Switch Account</span>
          <button className="btn btn--ghost btn--sm" onClick={handleRelogin}>
            Switch Account
          </button>
        </div>
      </section>

      {/* 2. Java & Performance */}
      <section className="settings__section">
        <h2 className="settings__section-title">Java &amp; Performance</h2>

        <div className="settings__slider-row">
          <div className="settings__slider-header">
            <span className="settings__label">Minimum Memory</span>
            <span className="settings__slider-value">{formatMemory(settings.defaultMinMemory)}</span>
          </div>
          <input
            type="range"
            className="settings__slider"
            min={512}
            max={8192}
            step={256}
            value={settings.defaultMinMemory}
            onChange={e => save('defaultMinMemory', +e.target.value)}
          />
        </div>

        <div className="settings__slider-row">
          <div className="settings__slider-header">
            <span className="settings__label">Maximum Memory</span>
            <span className="settings__slider-value">{formatMemory(settings.defaultMaxMemory)}</span>
          </div>
          <input
            type="range"
            className="settings__slider"
            min={512}
            max={16384}
            step={256}
            value={settings.defaultMaxMemory}
            onChange={e => save('defaultMaxMemory', +e.target.value)}
          />
        </div>

        <div className="settings__row">
          <span className="settings__label">Java Path Override</span>
          <input
            type="text"
            value={settings.javaPath}
            onChange={e => save('javaPath', e.target.value)}
            placeholder="Leave empty for auto-detect"
            style={{
              background: 'var(--bg-elevated)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-sm)',
              color: 'var(--text-primary)',
              padding: '6px 10px',
              fontSize: 13,
              flex: 1,
            }}
          />
        </div>
      </section>

      {/* 3. Game */}
      <section className="settings__section">
        <h2 className="settings__section-title">Game</h2>

        <div className="settings__row">
          <span className="settings__label">Close launcher when game launches</span>
          <label className="settings__toggle">
            <input
              type="checkbox"
              checked={settings.closeOnLaunch}
              onChange={e => save('closeOnLaunch', e.target.checked)}
            />
            <span className="settings__toggle-track" />
          </label>
        </div>

        <div className="settings__row">
          <span className="settings__label">Default Resolution</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <input
              type="number"
              value={settings.defaultResolutionWidth}
              onChange={e => save('defaultResolutionWidth', +e.target.value)}
              style={{ width: 70, ...inputStyle }}
            />
            <span style={{ color: 'var(--text-muted)' }}>×</span>
            <input
              type="number"
              value={settings.defaultResolutionHeight}
              onChange={e => save('defaultResolutionHeight', +e.target.value)}
              style={{ width: 70, ...inputStyle }}
            />
          </div>
        </div>
      </section>

      {/* 4. BlockHaven */}
      <section className="settings__section">
        <h2 className="settings__section-title">BlockHaven</h2>

        <div className="settings__row">
          <span className="settings__label">Default Host</span>
          <input
            type="text"
            value={settings.blockhavenDefaultHost}
            onChange={e => save('blockhavenDefaultHost', e.target.value)}
            style={{ flex: 1, ...inputStyle }}
          />
        </div>

        <div className="settings__row">
          <span className="settings__label">Default Port</span>
          <input
            type="number"
            value={settings.blockhavenDefaultPort}
            onChange={e => save('blockhavenDefaultPort', +e.target.value)}
            style={{ width: 80, ...inputStyle }}
          />
        </div>

        <p className="settings__hint" style={{ marginTop: 8 }}>
          These values pre-fill the server field when creating new instances.
        </p>
      </section>

      {/* 5. About */}
      <section className="settings__section">
        <h2 className="settings__section-title">About</h2>

        <div className="settings__row">
          <span className="settings__label">Launcher Version</span>
          <span style={{ color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)', fontSize: 12 }}>
            {appInfo?.version ?? '…'}
          </span>
        </div>

        <div>
          <span className="settings__label">Data Directory</span>
          <span className="settings__data-path">{appInfo?.dataPath ?? '…'}</span>
          <div className="settings__about-actions">
            <button
              className="btn btn--ghost btn--sm"
              onClick={() => window.launcher.settings.openDataFolder()}
            >
              Open Folder
            </button>
            <button
              className="btn btn--danger btn--sm"
              onClick={handleClearCache}
              disabled={cacheClearing}
            >
              {cacheClearing ? 'Clearing…' : 'Clear Cache'}
            </button>
          </div>
        </div>
      </section>

    </div>
  );
}
