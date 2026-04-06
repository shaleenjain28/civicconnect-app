import React, { useState } from 'react';
import {
  User, Bell, Map, AlertTriangle, Monitor,
  Save, Mail, Phone, Building2, Lock,
} from 'lucide-react';
import { authService } from '../services/authService';

const tabs = [
  { id: 'profile',       icon: User,          label: 'Profile' },
  { id: 'notifications', icon: Bell,          label: 'Notifications' },
  { id: 'map',           icon: Map,           label: 'Map' },
  { id: 'problems',      icon: AlertTriangle, label: 'Problems' },
  { id: 'system',        icon: Monitor,       label: 'System' },
];

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('profile');
  const user = authService.getUser() || {};

  return (
    <div className="fade-in">
      {/* Page Header */}
      <div className="page-header-gradient">
        <h2 className="page-header-title">Settings</h2>
        <p className="page-header-desc">Manage your account settings and preferences</p>
      </div>

      {/* Tabs */}
      <div className="settings-tabs">
        {tabs.map(({ id, icon: Icon, label }) => (
          <button
            key={id}
            className={`settings-tab ${activeTab === id ? 'active' : ''}`}
            onClick={() => setActiveTab(id)}
          >
            <Icon size={16} />
            {label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="card">
        <div className="card-body">
          {activeTab === 'profile' && <ProfileTab user={user} />}
          {activeTab === 'notifications' && <NotificationsTab />}
          {activeTab === 'map' && <MapTab />}
          {activeTab === 'problems' && <ProblemsTab />}
          {activeTab === 'system' && <SystemTab />}
        </div>
      </div>
    </div>
  );
}

/* ========== Profile ========== */
function ProfileTab({ user }) {
  const [name, setName] = useState(user.name || '');
  const [email, setEmail] = useState(user.email || '');
  const [phone, setPhone] = useState(user.phone || '+91 98765 43210');
  const [dept, setDept] = useState(user.department || 'Electricity');
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    authService.updateProfile({ name, email, phone, department: dept });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="settings-section">
      <div className="settings-section-title">
        <User size={20} style={{ color: 'var(--primary-600)' }} />
        Profile Information
      </div>
      <p className="settings-section-desc">Update your personal information and account details</p>

      <div style={{ marginBottom: 16 }}>
        <span className="badge badge-inprogress" style={{ fontSize: 12 }}>
          {user.role || 'Municipal Staff'}
        </span>
      </div>

      <div className="settings-form-grid">
        <div className="form-group">
          <label className="form-label">Full Name</label>
          <input className="form-input" value={name} onChange={e => setName(e.target.value)} />
        </div>
        <div className="form-group">
          <label className="form-label">Email</label>
          <input className="form-input" type="email" value={email} onChange={e => setEmail(e.target.value)} />
        </div>
        <div className="form-group">
          <label className="form-label">Phone Number</label>
          <input className="form-input" value={phone} onChange={e => setPhone(e.target.value)} />
        </div>
        <div className="form-group">
          <label className="form-label">Department</label>
          <select className="form-input" value={dept} onChange={e => setDept(e.target.value)}>
            <option>Electricity</option>
            <option>Water Supply</option>
            <option>Roads</option>
            <option>Sanitation</option>
            <option>General</option>
          </select>
        </div>
      </div>

      <h4 style={{ fontSize: 15, fontWeight: 600, margin: '24px 0 16px', color: 'var(--text-primary)' }}>Change Password</h4>
      <div className="settings-form-grid">
        <div className="form-group">
          <label className="form-label">Current Password</label>
          <input className="form-input" type="password" placeholder="Enter current password" />
        </div>
        <div className="form-group">
          <label className="form-label">New Password</label>
          <input className="form-input" type="password" placeholder="Enter new password" />
        </div>
      </div>

      <button className="btn btn-primary save-settings-btn" onClick={handleSave}>
        <Save size={16} />
        {saved ? '✓ Saved!' : 'Save Settings'}
      </button>
    </div>
  );
}

/* ========== Notifications ========== */
function NotificationsTab() {
  const [emailNotif, setEmailNotif] = useState(true);
  const [pushNotif, setPushNotif] = useState(true);
  const [smsNotif, setSmsNotif] = useState(false);
  const [newProblem, setNewProblem] = useState(true);
  const [statusUpdate, setStatusUpdate] = useState(true);
  const [highPriority, setHighPriority] = useState(true);

  return (
    <div className="settings-section">
      <div className="settings-section-title">
        <Bell size={20} style={{ color: 'var(--primary-600)' }} />
        Notification Preferences
      </div>
      <p className="settings-section-desc">Choose how you want to be notified about updates</p>

      <ToggleRow label="Email Notifications" desc="Receive updates via email" value={emailNotif} onChange={setEmailNotif} />
      <ToggleRow label="Push Notifications" desc="Browser push notifications" value={pushNotif} onChange={setPushNotif} />
      <ToggleRow label="SMS Notifications" desc="Receive text message alerts" value={smsNotif} onChange={setSmsNotif} />

      <h4 style={{ fontSize: 15, fontWeight: 600, margin: '28px 0 16px', color: 'var(--text-primary)' }}>Notification Events</h4>
      <ToggleRow label="New Problem Reported" desc="When a citizen reports a new problem" value={newProblem} onChange={setNewProblem} />
      <ToggleRow label="Status Updates" desc="When a problem status changes" value={statusUpdate} onChange={setStatusUpdate} />
      <ToggleRow label="High Priority Alerts" desc="Immediate alerts for high-priority issues" value={highPriority} onChange={setHighPriority} />

      <button className="btn btn-primary save-settings-btn"><Save size={16} /> Save Preferences</button>
    </div>
  );
}

/* ========== Map ========== */
function MapTab() {
  return (
    <div className="settings-section">
      <div className="settings-section-title">
        <Map size={20} style={{ color: 'var(--primary-600)' }} />
        Map Preferences
      </div>
      <p className="settings-section-desc">Configure default map behavior and appearance</p>

      <div className="settings-form-grid">
        <div className="form-group">
          <label className="form-label">Default Zoom Level</label>
          <select className="form-input">
            <option>City Level (10)</option>
            <option>District Level (13)</option>
            <option>Street Level (16)</option>
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">Default Center</label>
          <input className="form-input" defaultValue="University Main Gate" />
        </div>
        <div className="form-group">
          <label className="form-label">Marker Style</label>
          <select className="form-input">
            <option>Color Dots</option>
            <option>Pin Icons</option>
            <option>Category Icons</option>
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">Map Style</label>
          <select className="form-input">
            <option>Standard</option>
            <option>Satellite</option>
            <option>Terrain</option>
          </select>
        </div>
      </div>

      <button className="btn btn-primary save-settings-btn"><Save size={16} /> Save Map Settings</button>
    </div>
  );
}

/* ========== Problems ========== */
function ProblemsTab() {
  return (
    <div className="settings-section">
      <div className="settings-section-title">
        <AlertTriangle size={20} style={{ color: 'var(--primary-600)' }} />
        Problem Defaults
      </div>
      <p className="settings-section-desc">Configure default behavior for problem management</p>

      <div className="settings-form-grid">
        <div className="form-group">
          <label className="form-label">Default Status Filter</label>
          <select className="form-input">
            <option>All Statuses</option>
            <option>Pending</option>
            <option>In Progress</option>
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">Default Sort</label>
          <select className="form-input">
            <option>Newest First</option>
            <option>Most Votes</option>
            <option>Highest Priority</option>
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">Auto-assign Department</label>
          <select className="form-input">
            <option>Manual Assignment</option>
            <option>Auto by Type</option>
            <option>Round Robin</option>
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">Items Per Page</label>
          <select className="form-input">
            <option>10</option>
            <option>25</option>
            <option>50</option>
          </select>
        </div>
      </div>

      <button className="btn btn-primary save-settings-btn"><Save size={16} /> Save Problem Settings</button>
    </div>
  );
}

/* ========== System ========== */
function SystemTab() {
  return (
    <div className="settings-section">
      <div className="settings-section-title">
        <Monitor size={20} style={{ color: 'var(--primary-600)' }} />
        System Settings
      </div>
      <p className="settings-section-desc">Manage system-wide preferences and data</p>

      <div className="settings-form-grid">
        <div className="form-group">
          <label className="form-label">Language</label>
          <select className="form-input">
            <option>English</option>
            <option>Hindi</option>
            <option>Gujarati</option>
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">Date Format</label>
          <select className="form-input">
            <option>DD/MM/YYYY</option>
            <option>MM/DD/YYYY</option>
            <option>YYYY-MM-DD</option>
          </select>
        </div>
      </div>

      <div style={{ marginTop: 24, display: 'flex', gap: 12 }}>
        <button className="btn btn-secondary"><Save size={16} /> Export Data</button>
        <button className="btn btn-secondary" style={{ borderColor: 'var(--status-high)', color: 'var(--status-high)' }}>Reset to Defaults</button>
      </div>
    </div>
  );
}

/* ========== Toggle Row Component ========== */
function ToggleRow({ label, desc, value, onChange }) {
  return (
    <div className="settings-toggle-row">
      <div className="settings-toggle-info">
        <div className="settings-toggle-label">{label}</div>
        {desc && <div className="settings-toggle-desc">{desc}</div>}
      </div>
      <button
        className={`toggle-switch ${value ? 'on' : ''}`}
        onClick={() => onChange(!value)}
        aria-label={label}
      >
        <div className="toggle-switch-knob" />
      </button>
    </div>
  );
}
