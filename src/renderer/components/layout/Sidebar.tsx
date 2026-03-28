import React, { useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useSelectedInstance } from '../../stores/selected-instance-context';

const NAV_ITEMS = [
  { to: '/instances', label: 'Instances', icon: '🎮' },
  { to: '/mods', label: 'Mods', icon: '🧩' },
  { to: '/shaders', label: 'Shaders', icon: '✨' },
  { to: '/settings', label: 'Settings', icon: '⚙️' },
];

export function Sidebar() {
  const { selectedInstanceId } = useSelectedInstance();
  const [instances, setInstances] = useState<InstanceInfo[]>([]);
  const [launching, setLaunching] = useState(false);
  const [launchError, setLaunchError] = useState<string | null>(null);

  useEffect(() => {
    window.launcher.instances.list().then(setInstances);
  }, [selectedInstanceId]);

  const selectedInstance = instances.find((i) => i.id === selectedInstanceId) ?? null;

  const handlePlay = async () => {
    if (!selectedInstanceId) return;
    setLaunching(true);
    setLaunchError(null);
    try {
      await window.launcher.game.launch(selectedInstanceId);
    } catch (err: any) {
      setLaunchError(err.message ?? 'Launch failed.');
    } finally {
      setLaunching(false);
    }
  };

  return (
    <nav className="sidebar">
      <ul className="sidebar__nav">
        {NAV_ITEMS.map((item) => (
          <li key={item.to}>
            <NavLink
              to={item.to}
              className={({ isActive }) =>
                `sidebar__link ${isActive ? 'sidebar__link--active' : ''}`
              }
            >
              <span className="sidebar__icon">{item.icon}</span>
              <span className="sidebar__label">{item.label}</span>
            </NavLink>
          </li>
        ))}
      </ul>

      <div className="sidebar__play">
        {selectedInstance ? (
          <>
            <span className="sidebar__play-instance">{selectedInstance.name}</span>
            <button
              className="sidebar__play-btn"
              onClick={handlePlay}
              disabled={launching}
            >
              {launching ? '⏳ Launching...' : '▶ Play'}
            </button>
            {launchError && (
              <span className="sidebar__play-error">{launchError}</span>
            )}
          </>
        ) : (
          <button className="sidebar__play-btn" disabled>
            ▶ Play
          </button>
        )}
      </div>

      <div className="sidebar__footer">
        <button
          className="sidebar__logout"
          onClick={() => window.launcher.auth.logout().then(() => window.location.reload())}
        >
          Sign Out
        </button>
      </div>
    </nav>
  );
}
