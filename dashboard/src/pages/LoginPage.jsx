import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, Heart, Eye, Mail, Lock, Loader2, ChevronDown } from 'lucide-react';
import { authService } from '../services/authService';

export default function LoginPage() {
  const navigate = useNavigate();
  const [role, setRole] = useState('Municipal');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [departments, setDepartments] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Fetch departments for Municipal role
  useEffect(() => {
    fetch('/api/departments')
      .then(r => r.ok ? r.json() : [])
      .then(setDepartments)
      .catch(() => setDepartments([]));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const roleMap = {
        Municipal: 'municipal',
        Supervisor: 'supervisor',
        NGO: 'ngo',
      };
      await authService.signIn(email, password, roleMap[role] || 'municipal');
      navigate('/dashboard');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const roles = [
    { key: 'Supervisor', icon: Eye, label: 'Supervisor', color: '#8B5CF6', desc: 'Oversee all departments' },
    { key: 'Municipal', icon: Building2, label: 'Municipal', color: '#10B981', desc: 'Department operations' },
    { key: 'NGO', icon: Heart, label: 'NGO', color: '#F59E0B', desc: 'Civic partner' },
  ];

  return (
    <div className="login-page">
      <div className="login-card fade-in">
        {/* Logo */}
        <div className="login-logo">
          <img src="/logo.png" alt="CivicConnect Logo" />
        </div>

        <h1 className="login-title">Authority Dashboard</h1>
        <p className="login-subtitle">Sign in to manage civic issues and department operations</p>

        {/* 3 Role Tabs */}
        <div className="login-tabs login-tabs-3">
          {roles.map(({ key, icon: Icon, label, color }) => (
            <button
              key={key}
              type="button"
              className={`login-tab ${role === key ? 'active' : ''}`}
              onClick={() => { setRole(key); setError(''); }}
              style={role === key ? { borderColor: color, color: color } : {}}
            >
              <Icon size={16} />
              {label}
            </button>
          ))}
        </div>

        {/* Role Description */}
        <div className="login-role-desc">
          <span className="login-role-badge" style={{ background: roles.find(r => r.key === role)?.color }}>
            {role}
          </span>
          <span className="login-role-text">{roles.find(r => r.key === role)?.desc}</span>
        </div>

        {/* Error */}
        {error && <div className="login-error">{error}</div>}

        {/* Form */}
        <form className="login-form" onSubmit={handleSubmit}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label" htmlFor="login-email">
              <Mail size={14} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 4 }} />
              Email
            </label>
            <input
              id="login-email"
              type="email"
              className="form-input"
              placeholder="Enter your official email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label" htmlFor="login-password">
              <Lock size={14} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 4 }} />
              Password
            </label>
            <input
              id="login-password"
              type="password"
              className="form-input"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
          </div>

          {/* Department selector — only for Municipal */}
          {role === 'Municipal' && (
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" htmlFor="login-department">
                <Building2 size={14} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 4 }} />
                Department
              </label>
              <div className="select-wrapper">
                <select
                  id="login-department"
                  className="form-input form-select"
                  value={departmentId}
                  onChange={(e) => setDepartmentId(e.target.value)}
                >
                  <option value="">Select your department</option>
                  {departments.map((dept) => (
                    <option key={dept.id} value={dept.id}>
                      {dept.icon} {dept.name}
                    </option>
                  ))}
                </select>
                <ChevronDown size={16} className="select-icon" />
              </div>
            </div>
          )}

          <button
            type="submit"
            className="btn btn-primary btn-block btn-lg login-btn"
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 size={18} className="spinner" style={{ border: 'none', animation: 'spin 0.8s linear infinite' }} />
                Signing in...
              </>
            ) : (
              `Sign In as ${role}`
            )}
          </button>
        </form>

        <div className="login-credentials">
          <p className="login-credentials-title">Demo Credentials</p>
          <div className="login-credentials-grid">
            <div className="login-cred-item">
              <span className="login-cred-role">👑 Supervisor</span>
              <span className="login-cred-email">supervisor@civicconnect.in</span>
            </div>
            <div className="login-cred-item">
              <span className="login-cred-role">🏛️ Municipal</span>
              <span className="login-cred-email">roads@civicconnect.in</span>
            </div>
            <div className="login-cred-item">
              <span className="login-cred-role">👤 Citizen</span>
              <span className="login-cred-email">test1@gmail.com</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
