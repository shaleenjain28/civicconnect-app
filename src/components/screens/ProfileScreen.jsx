// ─── Profile Screen ───
// Full-featured profile with stats, settings, language, and logout.

import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { api } from '../../services/api';

const ProfileScreen = () => {
  const { user, logout, updateUser } = useAuth();
  const { t, language, setLanguage, languages } = useLanguage();
  const [stats, setStats] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [editName, setEditName] = useState(user?.name || '');
  const [editPhone, setEditPhone] = useState(user?.phone || '');
  const [saving, setSaving] = useState(false);
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('cc_darkMode') === 'true');

  useEffect(() => {
    api.get('/users/me/stats').then(setStats).catch(console.error);
  }, []);

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      await updateUser({ name: editName, phone: editPhone });
      setShowEditProfile(false);
    } catch (err) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  const toggleDarkMode = () => {
    const newVal = !darkMode;
    setDarkMode(newVal);
    localStorage.setItem('cc_darkMode', String(newVal));
    document.documentElement.setAttribute('data-theme', newVal ? 'dark' : 'light');
  };

  const handleClearCache = () => {
    if (confirm('Clear all cached data?')) {
      localStorage.removeItem('cc_location');
      alert('Cache cleared!');
    }
  };

  const languageLabels = { en: 'English', hi: 'हिंदी', gu: 'ગુજરાતી' };

  const handleLogout = async () => {
    if (confirm('Are you sure you want to log out?')) {
      await logout();
    }
  };

  return (
    <div className="container">
      <div className="header">
        <h1 className="headerTitle">{t('profile')}</h1>
      </div>

      <div className="profile-scroll">
        {/* Avatar & Info */}
        <div className="profile-hero">
          <div className="profile-avatar-large">
            <span>{user?.name?.[0]?.toUpperCase() || 'U'}</span>
          </div>
          <h2 className="profile-name-large">{user?.name || 'User'}</h2>
          <p className="profile-email-text">{user?.email}</p>
          {user?.phone && <p className="profile-phone-text">📞 {user.phone}</p>}
          <span className="profile-role-badge">{user?.role || 'citizen'}</span>
        </div>

        {/* Impact Stats */}
        <div className="profile-section">
          <h3 className="profile-section-title">📊 {t('yourImpact')}</h3>
          <div className="profile-stats-grid">
            <div className="profile-stat-card">
              <span className="profile-stat-value">{stats?.totalReports ?? '—'}</span>
              <span className="profile-stat-label">{t('reports')}</span>
            </div>
            <div className="profile-stat-card accent">
              <span className="profile-stat-value">{stats?.totalUpvotesReceived ?? '—'}</span>
              <span className="profile-stat-label">{t('upvotesReceived')}</span>
            </div>
            <div className="profile-stat-card success">
              <span className="profile-stat-value">{stats?.issuesResolved ?? '—'}</span>
              <span className="profile-stat-label">{t('resolved')}</span>
            </div>
          </div>
        </div>

        {/* Settings */}
        <div className="profile-section">
          <h3 className="profile-section-title">⚙️ {t('settings')}</h3>

          {/* Language */}
          <div className="profile-setting-row">
            <div className="profile-setting-left">
              <span className="profile-setting-icon">🌐</span>
              <span>{t('language')}</span>
            </div>
            <select
              className="profile-setting-select"
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
            >
              {languages.map((lang) => (
                <option key={lang} value={lang}>{languageLabels[lang]}</option>
              ))}
            </select>
          </div>

          {/* Dark Mode */}
          <div className="profile-setting-row">
            <div className="profile-setting-left">
              <span className="profile-setting-icon">🌙</span>
              <span>{t('darkMode')}</span>
            </div>
            <button
              className={`profile-toggle ${darkMode ? 'on' : ''}`}
              onClick={toggleDarkMode}
            >
              <div className="profile-toggle-knob" />
            </button>
          </div>

          {/* Notifications */}
          <div className="profile-setting-row">
            <div className="profile-setting-left">
              <span className="profile-setting-icon">🔔</span>
              <span>{t('notifications')}</span>
            </div>
            <span className="profile-setting-value">On</span>
          </div>

          {/* Clear Cache */}
          <div className="profile-setting-row" onClick={handleClearCache} role="button" tabIndex={0}>
            <div className="profile-setting-left">
              <span className="profile-setting-icon">🗑️</span>
              <span>{t('clearCache')}</span>
            </div>
            <span className="profile-setting-arrow">›</span>
          </div>
        </div>

        {/* Account */}
        <div className="profile-section">
          <h3 className="profile-section-title">👤 {t('account')}</h3>

          <div className="profile-setting-row" onClick={() => setShowEditProfile(true)} role="button" tabIndex={0}>
            <div className="profile-setting-left">
              <span className="profile-setting-icon">✏️</span>
              <span>{t('editProfile')}</span>
            </div>
            <span className="profile-setting-arrow">›</span>
          </div>

          <div className="profile-setting-row">
            <div className="profile-setting-left">
              <span className="profile-setting-icon">🔒</span>
              <span>{t('changePassword')}</span>
            </div>
            <span className="profile-setting-arrow">›</span>
          </div>

          <div className="profile-setting-row">
            <div className="profile-setting-left">
              <span className="profile-setting-icon">📄</span>
              <span>{t('privacyPolicy')}</span>
            </div>
            <span className="profile-setting-arrow">›</span>
          </div>
        </div>

        {/* Logout */}
        <button className="profile-logout-btn" onClick={handleLogout}>
          🚪 {t('logOut')}
        </button>

        <p className="profile-footer">v2.0.0 • Made with ❤️ by CivicConnect</p>
      </div>

      {/* Edit Profile Modal */}
      {showEditProfile && (
        <div className="modalBackdrop" onClick={() => setShowEditProfile(false)}>
          <div className="profile-edit-modal" onClick={(e) => e.stopPropagation()}>
            <h2>{t('editProfile')}</h2>
            <div className="auth-field">
              <label>{t('name')}</label>
              <input value={editName} onChange={(e) => setEditName(e.target.value)} />
            </div>
            <div className="auth-field">
              <label>Phone</label>
              <input value={editPhone} onChange={(e) => setEditPhone(e.target.value)} placeholder="+91 98765 43210" />
            </div>
            <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
              <button className="auth-submit-btn" onClick={handleSaveProfile} disabled={saving} style={{ flex: 1 }}>
                {saving ? 'Saving...' : 'Save'}
              </button>
              <button className="profile-cancel-btn" onClick={() => setShowEditProfile(false)} style={{ flex: 1 }}>
                {t('cancel')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfileScreen;
