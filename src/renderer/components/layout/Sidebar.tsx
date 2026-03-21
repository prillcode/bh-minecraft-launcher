import React from 'react';
import { NavLink } from 'react-router-dom';

const NAV_ITEMS = [
  { to: '/instances', label: 'Instances', icon: '🎮' },
  { to: '/mods', label: 'Mods', icon: '🧩' },
  { to: '/settings', label: 'Settings', icon: '⚙️' },
];

export function Sidebar() {
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
