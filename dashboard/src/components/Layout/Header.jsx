import React from 'react';
import { Sun, Moon, Building2, Heart } from 'lucide-react';
import { authService } from '../../services/authService';

export default function Header({ title, subtitle, theme, toggleTheme }) {
  const user = authService.getUser();

  return (
    <header className="app-header" id="app-header">
      <div className="header-left">
        <h1 className="header-title">{title}</h1>
        {subtitle && <p className="header-subtitle">{subtitle}</p>}
      </div>

      <div className="header-right">
        {/* Theme Toggle */}
        <button
          className={`theme-toggle ${theme === 'dark' ? 'dark' : ''}`}
          onClick={toggleTheme}
          title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
          aria-label="Toggle theme"
        >
          <div className="theme-toggle-knob">
            {theme === 'dark'
              ? <Moon className="theme-toggle-icon" size={14} />
              : <Sun className="theme-toggle-icon" size={14} />
            }
          </div>
        </button>

        {/* Role Badge */}
        <div className="header-role-badge">
          {user?.role === 'NGO'
            ? <Heart size={14} />
            : <Building2 size={14} />
          }
          <span>{user?.role || 'Staff'}</span>
        </div>

        {/* Username */}
        <span className="header-username">{user?.name || 'User'}</span>
      </div>
    </header>
  );
}
