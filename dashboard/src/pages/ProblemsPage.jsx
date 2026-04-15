import React, { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import {
  AlertTriangle, CheckCircle, Clock, Search, Filter,
  Camera, ShieldCheck, ShieldX, ArrowRight, MapPin, Phone, Mail, User,
  ChevronDown, X, Eye,
} from 'lucide-react';
import { dataService } from '../services/dataService';
import { authService } from '../services/authService';

export default function ProblemsPage() {
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedIssue, setSelectedIssue] = useState(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [critFilter, setCritFilter] = useState('');
  const location = useLocation();
  const escalatedOnly = location.pathname === '/escalated';
  const [showResolveModal, setShowResolveModal] = useState(null);
  const [showVerifyModal, setShowVerifyModal] = useState(null);
  const [resPhoto, setResPhoto] = useState({ dataUrl: '', fileName: '' });
  const [resNote, setResNote] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const user = authService.getUser();
  const role = String(user?.role || '').toLowerCase();
  const isSupervisor = role === 'supervisor';
  const isMunicipal = role === 'municipal';

  const loadIssues = useCallback(async () => {
    setLoading(true);
    try {
      const filters = {};
      if (statusFilter) filters.status = statusFilter;
      if (critFilter) filters.criticality = critFilter;
      filters.sort = 'urgency';
      if (escalatedOnly) filters.escalated = true;
      const data = await dataService.getProblems(filters);
      setIssues(data);
    } catch (err) {
      console.error('Failed to load issues:', err);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, critFilter, escalatedOnly]);

  useEffect(() => { loadIssues(); }, [loadIssues]);

  // Filter by search
  const filtered = issues.filter(i =>
    !search || i.title.toLowerCase().includes(search.toLowerCase()) ||
    i.locationText?.toLowerCase().includes(search.toLowerCase())
  );

  const handleStatusChange = async (issueId, status) => {
    try {
      await dataService.updateStatus(issueId, status);
      loadIssues();
      setSelectedIssue(null);
    } catch (err) {
      alert('Failed: ' + err.message);
    }
  };

  const handleResolve = async () => {
    if (!resPhoto.dataUrl) return alert('Please upload a resolution photo');
    setSubmitting(true);
    try {
      await dataService.resolveIssue(showResolveModal, resPhoto.dataUrl, resNote);
      setShowResolveModal(null);
      setResPhoto({ dataUrl: '', fileName: '' });
      setResNote('');
      loadIssues();
    } catch (err) {
      alert('Failed: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const readFileAsDataUrl = (file) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.onload = () => resolve(String(reader.result || ''));
      reader.readAsDataURL(file);
    });

  const handleResPhotoPick = async (file) => {
    if (!file) return;
    if (!file.type?.startsWith('image/')) return alert('Please select an image file');
    // Keep it reasonably small for 10MB JSON limit
    if (file.size > 6 * 1024 * 1024) return alert('Please choose an image under 6MB');
    const dataUrl = await readFileAsDataUrl(file);
    setResPhoto({ dataUrl, fileName: file.name || 'resolution.jpg' });
  };

  const handleVerify = async (approved) => {
    setSubmitting(true);
    try {
      await dataService.verifyIssue(showVerifyModal, approved, resNote);
      setShowVerifyModal(null);
      setResNote('');
      loadIssues();
    } catch (err) {
      alert('Failed: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const statusOptions = [
    { value: '', label: 'All Status' },
    { value: 'pending', label: 'Pending' },
    { value: 'in_progress', label: 'In Progress' },
    { value: 'pending_verification', label: 'Verification' },
    { value: 'pending_user_verification', label: 'User Confirmation' },
    { value: 'resolved', label: 'Resolved' },
  ];

  const critOptions = [
    { value: '', label: 'All Priority' },
    { value: 'critical', label: '🔴 Critical' },
    { value: 'high', label: '🟠 High' },
    { value: 'medium', label: '🟡 Medium' },
    { value: 'low', label: '🟢 Low' },
  ];

  return (
    <>
      {/* Filters Bar */}
      <div className="problems-filters">
        <div className="problems-search">
          <Search size={16} className="problems-search-icon" />
          <input
            type="text"
            className="form-input"
            placeholder="Search issues..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <select className="form-input form-select filter-select" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
          {statusOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <select className="form-input form-select filter-select" value={critFilter} onChange={e => setCritFilter(e.target.value)}>
          {critOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </div>

      {/* Results count */}
      <p style={{ fontSize: 13, color: 'var(--text-tertiary)', marginBottom: 16 }}>
        Showing {filtered.length} of {issues.length} issues
      </p>

      {loading ? (
        <div className="loading-center"><div className="spinner" /></div>
      ) : filtered.length === 0 ? (
        <div className="empty-state"><p className="empty-state-text">No issues found</p></div>
      ) : (
        <div className="data-table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Issue</th>
                <th>Department</th>
                <th>Priority</th>
                <th>Status</th>
                <th>Upvotes</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(issue => (
                <tr key={issue.id} onClick={() => setSelectedIssue(issue)}>
                  <td className="table-problem-cell">
                    <div className="table-problem-title">{issue.title}</div>
                    <div className="table-problem-desc">
                      <MapPin size={11} style={{ display: 'inline' }} /> {issue.locationText || 'Jaipur'}
                    </div>
                  </td>
                  <td>
                    <span style={{ fontSize: 16, marginRight: 4 }}>{issue.department?.icon || '📋'}</span>
                    {issue.department?.name?.split(' ')[0] || '—'}
                  </td>
                  <td>
                    <span className="badge" style={{ background: dataService.getCriticalityColor(issue.criticality), color: '#fff' }}>
                      {issue.criticality}
                    </span>
                  </td>
                  <td>
                    <span className="badge" style={{ background: dataService.getStatusColor(issue.status), color: '#fff' }}>
                      {dataService.getStatusLabel(issue.status)}
                    </span>
                    {issue.escalated && <span className="badge" style={{ background: '#EF4444', color: '#fff', marginLeft: 4 }}>🚨</span>}
                  </td>
                  <td style={{ fontWeight: 700 }}>👍 {issue.upvoteCount}</td>
                  <td onClick={e => e.stopPropagation()}>
                    <div style={{ display: 'flex', gap: 4 }}>
                      {/* Municipal can resolve pending/in_progress issues */}
                      {(isMunicipal || isSupervisor) && (issue.status === 'pending' || issue.status === 'in_progress') && (
                        <button className="btn btn-primary btn-sm" onClick={() => setShowResolveModal(issue.id)} title="Submit Resolution">
                          <Camera size={14} />
                        </button>
                      )}
                      {/* Supervisor can verify pending_verification issues */}
                      {isSupervisor && issue.status === 'pending_verification' && (
                        <button className="btn btn-primary btn-sm" onClick={() => setShowVerifyModal(issue.id)} title="Verify Resolution" style={{ background: '#8B5CF6' }}>
                          <ShieldCheck size={14} />
                        </button>
                      )}
                      {/* Anyone can view */}
                      <button className="btn-icon" onClick={() => setSelectedIssue(issue)} title="View Details">
                        <Eye size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Issue Detail Modal */}
      {selectedIssue && (
        <div className="modal-backdrop" onClick={() => setSelectedIssue(null)}>
          <div className="modal-card" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{selectedIssue.title}</h3>
              <button className="btn-icon" onClick={() => setSelectedIssue(null)}><X size={16} /></button>
            </div>
            <div className="modal-body">
              <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
                <span className="badge" style={{ background: dataService.getStatusColor(selectedIssue.status), color: '#fff' }}>
                  {dataService.getStatusLabel(selectedIssue.status)}
                </span>
                <span className="badge" style={{ background: dataService.getCriticalityColor(selectedIssue.criticality), color: '#fff' }}>
                  {selectedIssue.criticality}
                </span>
                {selectedIssue.escalated && <span className="badge" style={{ background: '#EF4444', color: '#fff' }}>🚨 Escalated</span>}
                <span className="badge" style={{ background: 'var(--gray-200)', color: 'var(--text-secondary)' }}>
                  👍 {selectedIssue.upvoteCount} upvotes
                </span>
              </div>

              <p style={{ fontSize: 14, color: 'var(--text-primary)', marginBottom: 16, lineHeight: 1.6 }}>
                {selectedIssue.description}
              </p>

              <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 8 }}>
                <MapPin size={13} style={{ display: 'inline', verticalAlign: 'middle' }} /> {selectedIssue.locationText || 'Jaipur'}
              </div>

              <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 8 }}>
                📁 {selectedIssue.department?.name || '—'}
              </div>

              {selectedIssue.deadline && (
                <div style={{ fontSize: 13, color: new Date(selectedIssue.deadline) < new Date() ? '#DC2626' : '#065F46', marginBottom: 12 }}>
                  ⏰ Deadline: {new Date(selectedIssue.deadline).toLocaleString()}
                  {new Date(selectedIssue.deadline) < new Date() && ' (OVERDUE)'}
                </div>
              )}

              {/* HOD Info */}
              {selectedIssue.department && (
                <div style={{ padding: 12, background: 'var(--bg-tertiary)', borderRadius: 10, marginBottom: 16 }}>
                  <p style={{ fontSize: 12, fontWeight: 700, marginBottom: 8 }}>📞 Department HOD Contact</p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, marginBottom: 4 }}>
                    <User size={13} />
                    <strong>{selectedIssue.department.hodName || 'Not assigned'}</strong>
                    {selectedIssue.department.hodTitle && <span style={{ color: 'var(--text-tertiary)' }}>• {selectedIssue.department.hodTitle}</span>}
                  </div>
                  {selectedIssue.department.hodPhone && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, marginBottom: 4 }}>
                      <Phone size={13} /> <a href={`tel:${selectedIssue.department.hodPhone}`} style={{ color: 'var(--primary-600)' }}>{selectedIssue.department.hodPhone}</a>
                    </div>
                  )}
                  {selectedIssue.department.hodEmail && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}>
                      <Mail size={13} /> <a href={`mailto:${selectedIssue.department.hodEmail}`} style={{ color: 'var(--primary-600)' }}>{selectedIssue.department.hodEmail}</a>
                    </div>
                  )}
                </div>
              )}

              {/* Resolution Photo */}
              {selectedIssue.resolutionPhoto && (
                <div style={{ marginBottom: 16 }}>
                  <p style={{ fontSize: 12, fontWeight: 700, marginBottom: 6 }}>📸 Resolution Photo</p>
                  <img src={selectedIssue.resolutionPhoto} alt="Resolution" style={{ width: '100%', maxHeight: 200, objectFit: 'cover', borderRadius: 8 }} />
                  {selectedIssue.resolutionNote && <p style={{ fontSize: 13, marginTop: 6, color: 'var(--text-secondary)' }}>{selectedIssue.resolutionNote}</p>}
                </div>
              )}

              {/* Action buttons */}
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 16 }}>
                {(isMunicipal || isSupervisor) && selectedIssue.status === 'pending' && (
                  <button className="btn btn-primary btn-sm" onClick={() => handleStatusChange(selectedIssue.id, 'in_progress')}>
                    Mark In Progress
                  </button>
                )}
                {(isMunicipal || isSupervisor) && (selectedIssue.status === 'pending' || selectedIssue.status === 'in_progress') && (
                  <button className="btn btn-primary btn-sm" style={{ background: '#10B981' }} onClick={() => { setShowResolveModal(selectedIssue.id); setSelectedIssue(null); }}>
                    <Camera size={14} /> Submit Resolution
                  </button>
                )}
                {isSupervisor && selectedIssue.status === 'pending_verification' && (
                  <button className="btn btn-primary btn-sm" style={{ background: '#8B5CF6' }} onClick={() => { setShowVerifyModal(selectedIssue.id); setSelectedIssue(null); }}>
                    <ShieldCheck size={14} /> Verify
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Resolve Modal */}
      {showResolveModal && (
        <div className="modal-backdrop" onClick={() => setShowResolveModal(null)}>
          <div className="modal-card" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>📸 Submit Resolution</h3>
              <button className="btn-icon" onClick={() => setShowResolveModal(null)}><X size={16} /></button>
            </div>
            <div className="modal-body">
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 16 }}>
                Upload a photo proving the issue has been resolved. A supervisor will verify before marking it complete.
              </p>
              <label className="form-label">Resolution Photo *</label>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <label className="btn btn-primary btn-sm" style={{ background: '#0EA5E9', cursor: 'pointer' }}>
                  Use Camera
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    style={{ display: 'none' }}
                    onChange={(e) => handleResPhotoPick(e.target.files?.[0])}
                  />
                </label>
                <label className="btn btn-primary btn-sm" style={{ background: '#334155', cursor: 'pointer' }}>
                  Upload from Gallery / Files
                  <input
                    type="file"
                    accept="image/*"
                    style={{ display: 'none' }}
                    onChange={(e) => handleResPhotoPick(e.target.files?.[0])}
                  />
                </label>
                {resPhoto.fileName && (
                  <span style={{ fontSize: 12, color: 'var(--text-secondary)', alignSelf: 'center' }}>
                    {resPhoto.fileName}
                  </span>
                )}
              </div>
              {resPhoto.dataUrl && (
                <img
                  src={resPhoto.dataUrl}
                  alt="Resolution preview"
                  style={{ width: '100%', maxHeight: 220, objectFit: 'cover', borderRadius: 10, marginTop: 10 }}
                />
              )}
              <label className="form-label" style={{ marginTop: 12 }}>Resolution Note</label>
              <textarea className="form-input" rows={3} placeholder="Describe what was done to resolve the issue..." value={resNote} onChange={e => setResNote(e.target.value)} />
              <button className="btn btn-primary btn-block" style={{ marginTop: 16, background: '#10B981' }} onClick={handleResolve} disabled={submitting}>
                {submitting ? 'Submitting...' : '✅ Submit for Verification'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Verify Modal */}
      {showVerifyModal && (
        <div className="modal-backdrop" onClick={() => setShowVerifyModal(null)}>
          <div className="modal-card" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>🔍 Verify Resolution</h3>
              <button className="btn-icon" onClick={() => setShowVerifyModal(null)}><X size={16} /></button>
            </div>
            <div className="modal-body">
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 16 }}>
                Review the resolution photo and approve or reject.
              </p>
              <label className="form-label">Verification Note</label>
              <textarea className="form-input" rows={2} placeholder="Optional note..." value={resNote} onChange={e => setResNote(e.target.value)} />
              <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
                <button className="btn btn-primary btn-block" style={{ background: '#10B981' }} onClick={() => handleVerify(true)} disabled={submitting}>
                  <ShieldCheck size={14} /> Approve ✅
                </button>
                <button className="btn btn-primary btn-block" style={{ background: '#EF4444' }} onClick={() => handleVerify(false)} disabled={submitting}>
                  <ShieldX size={14} /> Reject ❌
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
