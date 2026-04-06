import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Map, AlertTriangle, Settings, LogOut } from 'lucide-react';
import { authService } from '../../services/authService';

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/map',       icon: Map,             label: 'Map View'  },
  { to: '/problems',  icon: AlertTriangle,   label: 'Problems'  },
  { to: '/settings',  icon: Settings,        label: 'Settings'  },
];

export default function Sidebar() {
  const navigate = useNavigate();
  const user = authService.getUser();

  const handleLogout = async () => {
    await authService.signOut();
    navigate('/login');
  };

  return (
    <aside className="sidebar" id="sidebar">
      {/* Brand */}
      <div className="sidebar-brand">
        <img src="/logo.png" alt="CivicConnect" className="sidebar-logo" />
        <div className="sidebar-brand-text">
          <span className="sidebar-brand-name">Civic Connect</span>
          <span className="sidebar-brand-tagline">Service Dashboard</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="sidebar-nav">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `sidebar-nav-item ${isActive ? 'active' : ''}`
            }
          >
            <Icon className="sidebar-nav-icon" size={20} />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="sidebar-footer">
        <div className="sidebar-user" onClick={handleLogout} role="button" tabIndex={0} title="Click to sign out">
          <div className="sidebar-user-avatar">
            {user?.name?.[0]?.toUpperCase() || 'U'}
          </div>
          <div className="sidebar-user-info">
            <div className="sidebar-user-name">{user?.name || 'User'}</div>
            <div className="sidebar-user-role">{user?.role || 'Staff'}</div>
          </div>
          <LogOut size={16} style={{ color: 'var(--text-sidebar)', opacity: 0.6 }} />
        </div>
      </div>
    </aside>
  );
}
