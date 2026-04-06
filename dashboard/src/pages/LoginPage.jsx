import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, Heart, Mail, Lock, Loader2 } from 'lucide-react';
import { authService } from '../services/authService';

export default function LoginPage() {
  const navigate = useNavigate();
  const [role, setRole] = useState('Municipal');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await authService.signIn(email, password, role === 'Municipal' ? 'Municipal Staff' : 'NGO');
      navigate('/dashboard');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card fade-in">
        {/* Logo */}
        <div className="login-logo">
          <img src="/logo.png" alt="CivicConnect Logo" />
        </div>

        <h1 className="login-title">Municipal Dashboard</h1>
        <p className="login-subtitle">Sign in to manage citizen reports and municipal services</p>

        {/* Role Tabs */}
        <div className="login-tabs">
          <button
            type="button"
            className={`login-tab ${role === 'Municipal' ? 'active' : ''}`}
            onClick={() => setRole('Municipal')}
          >
            <Building2 size={16} />
            Municipal
          </button>
          <button
            type="button"
            className={`login-tab ${role === 'NGO' ? 'active' : ''}`}
            onClick={() => setRole('NGO')}
          >
            <Heart size={16} />
            NGO
          </button>
        </div>

        {/* Error Message */}
        {error && <div className="login-error">{error}</div>}

        {/* Login Form */}
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
              placeholder="Enter your email"
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
              `Sign In as ${role === 'Municipal' ? 'Municipal Staff' : 'NGO'}`
            )}
          </button>
        </form>

        <p style={{ textAlign: 'center', fontSize: 12, color: 'var(--text-tertiary)', marginTop: 20 }}>
          Demo: <strong>municipal@civicconnect.com</strong> / <strong>admin123</strong>
        </p>
      </div>
    </div>
  );
}
