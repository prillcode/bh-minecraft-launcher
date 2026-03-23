import React, { useState, useCallback, useEffect } from 'react';
import { useAuthStore } from '../../stores/auth-store';

type LoginPhase = 'idle' | 'device-code' | 'polling' | 'error';
type AuthTab = 'microsoft' | 'offline';

export function LoginScreen() {
  const [tab, setTab] = useState<AuthTab>('microsoft');

  useEffect(() => {
    window.launcher.settings.get().then((s) => setTab(s.defaultAuthMode));
  }, []);

  const switchTab = (newTab: AuthTab) => {
    setTab(newTab);
    window.launcher.settings.setDefaultAuthMode(newTab);
  };
  const [phase, setPhase] = useState<LoginPhase>('idle');
  const [deviceCode, setDeviceCode] = useState<{ userCode: string; verificationUri: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [offlineUsername, setOfflineUsername] = useState('');
  const [offlineError, setOfflineError] = useState<string | null>(null);
  const { setProfile, offlineLogin } = useAuthStore();

  const copyCode = useCallback((code: string) => {
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, []);

  const handleLogin = async () => {
    try {
      setPhase('device-code');
      setError(null);

      // Step 1: Get device code for user to enter in browser
      const code = await window.launcher.auth.startLogin();
      setDeviceCode(code);

      setPhase('polling');

      // Step 2: Poll until user completes browser auth
      const profile = await window.launcher.auth.pollLogin();
      setProfile(profile);
    } catch (err: any) {
      setError(err.message ?? 'Authentication failed');
      setPhase('error');
    }
  };

  const handleOfflineLogin = async () => {
    setOfflineError(null);

    const username = offlineUsername.trim();
    if (username.length < 3 || username.length > 16) {
      setOfflineError('Username must be 3-16 characters');
      return;
    }
    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      setOfflineError('Username can only contain letters, numbers, and underscores');
      return;
    }

    try {
      await offlineLogin(username);
    } catch (err: any) {
      setOfflineError(err.message ?? 'Offline login failed');
    }
  };

  return (
    <div className="login-screen">
      <div className="login-screen__window-controls">
        <button
          onClick={() => window.launcher.window.minimize()}
          className="login-screen__window-btn"
          aria-label="Minimize"
        >
          <svg width="12" height="12" viewBox="0 0 12 12">
            <rect y="5" width="12" height="2" fill="currentColor" />
          </svg>
        </button>
        <button
          onClick={() => window.launcher.window.close()}
          className="login-screen__window-btn login-screen__window-btn--close"
          aria-label="Close"
        >
          <svg width="12" height="12" viewBox="0 0 12 12">
            <line x1="1" y1="1" x2="11" y2="11" stroke="currentColor" strokeWidth="1.5" />
            <line x1="11" y1="1" x2="1" y2="11" stroke="currentColor" strokeWidth="1.5" />
          </svg>
        </button>
      </div>
      <div className="login-card">
        <div className="login-card__header">
          <span className="login-card__logo">⛏</span>
          <h1>BlockHaven</h1>
          <p className="login-card__subtitle">Minecraft Launcher</p>
        </div>

        <div className="login-card__toggle">
          <button
            className={`login-card__toggle-btn ${tab === 'microsoft' ? 'login-card__toggle-btn--active' : ''}`}
            onClick={() => switchTab('microsoft')}
          >
            Microsoft Account
          </button>
          <button
            className={`login-card__toggle-btn ${tab === 'offline' ? 'login-card__toggle-btn--active' : ''}`}
            onClick={() => switchTab('offline')}
          >
            Offline Mode
          </button>
        </div>

        {tab === 'microsoft' && (
          <>
            {phase === 'idle' && (
              <button className="login-card__btn" onClick={handleLogin}>
                Sign in with Microsoft
              </button>
            )}

            {phase === 'device-code' && deviceCode && (
              <div className="login-card__device-code">
                <p>Open your browser and go to:</p>
                <a
                  href={deviceCode.verificationUri}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="login-card__url"
                >
                  {deviceCode.verificationUri}
                </a>
                <p>Then enter this code:</p>
                <div className="login-card__code">
                  {deviceCode.userCode}
                  <button className="login-card__copy-btn" onClick={() => copyCode(deviceCode.userCode)}>
                    {copied ? 'Copied!' : 'Copy'}
                  </button>
                </div>
              </div>
            )}

            {phase === 'polling' && (
              <div className="login-card__polling">
                <div className="loader" />
                <p>Waiting for you to sign in...</p>
                {deviceCode && (
                  <>
                    <a
                      href={deviceCode.verificationUri}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="login-card__url"
                    >
                      {deviceCode.verificationUri}
                    </a>
                    <div className="login-card__code-reminder">
                      Code: <strong>{deviceCode.userCode}</strong>
                      <button className="login-card__copy-btn" onClick={() => copyCode(deviceCode.userCode)}>
                        {copied ? 'Copied!' : 'Copy'}
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}

            {phase === 'error' && (
              <div className="login-card__error">
                <p>{error}</p>
                <button className="login-card__btn" onClick={handleLogin}>
                  Try Again
                </button>
              </div>
            )}
          </>
        )}

        {tab === 'offline' && (
          <div className="login-card__offline">
            <input
              type="text"
              className="login-card__input"
              placeholder="Enter username"
              value={offlineUsername}
              onChange={(e) => setOfflineUsername(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleOfflineLogin()}
              maxLength={16}
            />
            {offlineError && (
              <p className="login-card__error-text">{offlineError}</p>
            )}
            <button className="login-card__btn" onClick={handleOfflineLogin}>
              Play Offline
            </button>
            <p className="login-card__note">
              For use with offline-mode servers only. No skin or multiplayer authentication.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
