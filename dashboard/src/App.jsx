import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { authService } from './services/authService';
import Sidebar from './components/Layout/Sidebar';
import Header from './components/Layout/Header';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import ProblemsPage from './pages/ProblemsPage';
import MapPage from './pages/MapPage';
import SettingsPage from './pages/SettingsPage';
import DepartmentsPage from './pages/DepartmentsPage';
import './index.css';

// Page metadata
const PAGE_META = {
  '/dashboard':   { title: 'Dashboard Overview',  subtitle: 'Monitor and manage citizen-reported problems across the municipality' },
  '/departments': { title: 'Departments',          subtitle: 'HOD contacts, issue breakdown, and department performance' },
  '/problems':    { title: 'Problem Management',   subtitle: 'View, filter, and manage all citizen-reported problems' },
  '/map':         { title: 'Interactive Map',      subtitle: 'View all reported problems on the map. Click on markers to see details' },
  '/escalated':   { title: 'Escalated Issues',     subtitle: 'Overdue issues that need immediate attention' },
  '/settings':    { title: 'Settings',             subtitle: 'Manage your account settings and preferences' },
};

function ProtectedLayout({ theme, toggleTheme }) {
  const location = useLocation();
  const currentPath = location.pathname;

  const meta = PAGE_META[currentPath] || PAGE_META['/dashboard'];

  if (!authService.isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="app-layout">
      <Sidebar />
      <div className="main-area">
        <Header title={meta.title} subtitle={meta.subtitle} theme={theme} toggleTheme={toggleTheme} />
        <div className="page-content">
          <Routes>
            <Route path="/dashboard"    element={<DashboardPage />} />
            <Route path="/departments"  element={<DepartmentsPage />} />
            <Route path="/problems"     element={<ProblemsPage />} />
            <Route path="/map"          element={<MapPage />} />
            <Route path="/escalated"    element={<ProblemsPage />} />
            <Route path="/settings"     element={<SettingsPage />} />
            <Route path="*"             element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [theme, setTheme] = useState(() => localStorage.getItem('dashboardTheme') || 'light');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('dashboardTheme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme(t => (t === 'light' ? 'dark' : 'light'));

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/*" element={<ProtectedLayout theme={theme} toggleTheme={toggleTheme} />} />
      </Routes>
    </BrowserRouter>
  );
}
