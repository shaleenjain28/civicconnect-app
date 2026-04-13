import React, { useState, useEffect } from 'react';
import {
  ChevronRight, Phone, Mail, User, Edit2, Save, X, Building2,
} from 'lucide-react';
import { dataService } from '../services/dataService';
import { authService } from '../services/authService';

export default function DepartmentsPage() {
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [hodEdit, setHodEdit] = useState({});

  const user = authService.getUser();
  const isSupervisor = user?.role === 'supervisor';

  useEffect(() => {
    loadDepartments();
  }, []);

  async function loadDepartments() {
    setLoading(true);
    try {
      const data = await dataService.getDepartments();
      setDepartments(data);
    } catch (err) {
      console.error('Failed to load departments:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleSaveHod(deptId) {
    try {
      await dataService.updateHod(deptId, hodEdit);
      setEditingId(null);
      loadDepartments();
    } catch (err) {
      alert('Failed to update HOD: ' + err.message);
    }
  }

  function startEdit(dept) {
    setEditingId(dept.id);
    setHodEdit({
      hodName: dept.hodName || '',
      hodTitle: dept.hodTitle || '',
      hodEmail: dept.hodEmail || '',
      hodPhone: dept.hodPhone || '',
    });
  }

  if (loading) {
    return <div className="loading-center"><div className="spinner" /></div>;
  }

  return (
    <>
      <div className="page-header" style={{ marginBottom: 24 }}>
        <div>
          <div className="page-title">
            <Building2 size={24} /> Departments
          </div>
          <p className="page-subtitle">{departments.length} departments registered • Click to expand</p>
        </div>
      </div>

      <div className="dept-page-grid">
        {departments.map(dept => {
          const isOpen = expandedId === dept.id;
          const isEditing = editingId === dept.id;

          // Calculate stats from dept.issues
          const total = dept.totalIssues || 0;
          const pending = dept.pendingIssues || 0;
          const active = dept.activeIssues || 0;
          const resolved = dept.resolvedIssues || 0;
          const escalated = dept.escalatedIssues || 0;

          return (
            <div key={dept.id} className="dept-page-card">
              {/* Header */}
              <div className="dept-page-header" onClick={() => setExpandedId(isOpen ? null : dept.id)}>
                <div className="dept-page-icon-wrap" style={{ background: `${dept.color}20` }}>
                  <span className="dept-page-icon">{dept.icon}</span>
                </div>
                <div className="dept-page-info">
                  <div className="dept-page-name">{dept.name}</div>
                  <div className="dept-page-desc">{dept.description}</div>
                </div>
                <ChevronRight size={20} className={`dept-chevron ${isOpen ? 'open' : ''}`} />
              </div>

              {/* Stats Row */}
              <div className="dept-page-stats">
                <span className="dept-stat" style={{ color: '#F59E0B' }}>⏳ {pending} pending</span>
                <span className="dept-stat" style={{ color: '#3B82F6' }}>🔧 {active} active</span>
                <span className="dept-stat" style={{ color: '#10B981' }}>✅ {resolved} resolved</span>
                {escalated > 0 && <span className="dept-stat" style={{ color: '#EF4444' }}>🚨 {escalated} escalated</span>}
                <span className="dept-stat" style={{ color: 'var(--text-tertiary)' }}>Total: {total}</span>
              </div>

              {/* Expanded Section */}
              {isOpen && (
                <div className="dept-page-expanded">
                  {/* HOD Info */}
                  <div className="dept-hod-section">
                    <div className="dept-hod-header">
                      <h4>👤 Head of Department</h4>
                      {isSupervisor && !isEditing && (
                        <button className="btn-icon" onClick={() => startEdit(dept)} title="Edit HOD">
                          <Edit2 size={14} />
                        </button>
                      )}
                    </div>

                    {isEditing ? (
                      <div className="dept-hod-edit">
                        <input className="form-input form-input-sm" placeholder="Name" value={hodEdit.hodName} onChange={e => setHodEdit({ ...hodEdit, hodName: e.target.value })} />
                        <input className="form-input form-input-sm" placeholder="Title" value={hodEdit.hodTitle} onChange={e => setHodEdit({ ...hodEdit, hodTitle: e.target.value })} />
                        <input className="form-input form-input-sm" placeholder="Email" value={hodEdit.hodEmail} onChange={e => setHodEdit({ ...hodEdit, hodEmail: e.target.value })} />
                        <input className="form-input form-input-sm" placeholder="Phone" value={hodEdit.hodPhone} onChange={e => setHodEdit({ ...hodEdit, hodPhone: e.target.value })} />
                        <div style={{ display: 'flex', gap: 8 }}>
                          <button className="btn btn-primary btn-sm" onClick={() => handleSaveHod(dept.id)}>
                            <Save size={14} /> Save
                          </button>
                          <button className="btn btn-ghost btn-sm" onClick={() => setEditingId(null)}>Cancel</button>
                        </div>
                      </div>
                    ) : (
                      <div className="dept-hod-info">
                        <div className="dept-hod-row">
                          <User size={14} />
                          <span className="dept-hod-name">{dept.hodName || 'Not assigned'}</span>
                          {dept.hodTitle && <span className="dept-hod-title">• {dept.hodTitle}</span>}
                        </div>
                        {dept.hodPhone && (
                          <div className="dept-hod-row">
                            <Phone size={14} />
                            <a href={`tel:${dept.hodPhone}`} className="dept-hod-link">{dept.hodPhone}</a>
                          </div>
                        )}
                        {dept.hodEmail && (
                          <div className="dept-hod-row">
                            <Mail size={14} />
                            <a href={`mailto:${dept.hodEmail}`} className="dept-hod-link">{dept.hodEmail}</a>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Issue Breakdown Bars */}
                  <div className="dept-breakdown">
                    <h4>📊 Issue Breakdown</h4>
                    <div className="dept-bar-container">
                      {[
                        { label: 'Pending', count: pending, color: '#F59E0B' },
                        { label: 'In Progress', count: active, color: '#3B82F6' },
                        { label: 'Resolved', count: resolved, color: '#10B981' },
                        { label: 'Escalated', count: escalated, color: '#EF4444' },
                      ].map(bar => (
                        <div key={bar.label} className="dept-bar-row">
                          <span className="dept-bar-label">{bar.label}</span>
                          <div className="dept-bar-track">
                            <div className="dept-bar-fill" style={{ width: `${total > 0 ? (bar.count / total) * 100 : 0}%`, background: bar.color }} />
                          </div>
                          <span className="dept-bar-count" style={{ color: bar.color }}>{bar.count}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </>
  );
}
