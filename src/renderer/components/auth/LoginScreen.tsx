import React, { useState, useCallback } from 'react';
import { useAuthStore } from '../../stores/auth-store';

type LoginPhase = 'idle' | 'device-code' | 'polling' | 'error';

export function LoginScreen() {
  const [phase, setPhase] = useState<LoginPhase>('idle');
  const [deviceCode, setDeviceCode] = useState<{ userCode: string; verificationUri: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const { setProfile } = useAuthStore();

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

  return (
    <div className="login-screen">
      <div className="login-card">
        <div className="login-card__header">
          <span className="login-card__logo">⛏</span>
          <h1>BlockHaven</h1>
          <p className="login-card__subtitle">Minecraft Launcher</p>
        </div>

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
      </div>
    </div>
  );
}
