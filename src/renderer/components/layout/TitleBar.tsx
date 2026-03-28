import React from 'react';
import { useAuthStore } from '../../stores/auth-store';

export function TitleBar() {
  const { profile } = useAuthStore();

  return (
    <header className="title-bar">
      <div className="title-bar__drag-region">
        <div className="title-bar__brand">
          <img src="./icon.png" alt="" className="title-bar__icon" />
          <span className="title-bar__name">BlockHaven Minecraft Launcher</span>
        </div>

        {profile && (
          <div className="title-bar__user">
            <img
              src={`https://mc-heads.net/avatar/${profile.id}/20`}
              alt={profile.name}
              className="title-bar__avatar"
              onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
            />
            <span className="title-bar__username">{profile.name}</span>
          </div>
        )}
      </div>

      <div className="title-bar__controls">
        <button onClick={() => window.launcher.window.minimize()} aria-label="Minimize">
          <svg width="12" height="12" viewBox="0 0 12 12">
            <rect y="5" width="12" height="2" fill="currentColor" />
          </svg>
        </button>
        <button onClick={() => window.launcher.window.maximize()} aria-label="Maximize">
          <svg width="12" height="12" viewBox="0 0 12 12">
            <rect x="1" y="1" width="10" height="10" stroke="currentColor" strokeWidth="1.5" fill="none" />
          </svg>
        </button>
        <button
          onClick={() => window.launcher.window.close()}
          className="title-bar__close"
          aria-label="Close"
        >
          <svg width="12" height="12" viewBox="0 0 12 12">
            <line x1="1" y1="1" x2="11" y2="11" stroke="currentColor" strokeWidth="1.5" />
            <line x1="11" y1="1" x2="1" y2="11" stroke="currentColor" strokeWidth="1.5" />
          </svg>
        </button>
      </div>
    </header>
  );
}
