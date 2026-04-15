// ─── My Issue Detail Modal ───
// Shows full details of a user's reported issue with status timeline,
// HOD contact, and citizen confirmation flow.

import React, { useEffect, useRef, useState } from 'react';
import { api } from '../../services/api';

const STATUS_COLORS = {
  pending: '#F59E42',
  in_progress: '#3B82F6',
  pending_verification: '#8B5CF6',
  pending_user_verification: '#0EA5E9',
  resolved: '#10B981',
};

const formatStatus = (status) => {
  const map = {
    pending: 'Pending',
    in_progress: 'In Progress',
    pending_verification: 'Supervisor Review',
    pending_user_verification: 'Needs Your Confirmation',
    resolved: 'Resolved ✅',
  };
  return map[status] || status;
};

const MyIssueDetailModal = ({ issue, onClose, showToast }) => {
  const modalRef = useRef();
  const [statusHistory, setStatusHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    if (modalRef.current) modalRef.current.focus();
    loadDetails();
  }, [issue.id]);

  const loadDetails = async () => {
    setLoading(true);
    try {
      const data = await api.get(`/issues/${issue.id}`);
      setStatusHistory(data.statusHistory || data.status_history || []);
    } catch (err) {
      console.error('Failed to load issue details:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async (approved) => {
    setConfirming(true);
    try {
      await api.patch(`/issues/${issue.id}/confirm`, {
        approved,
        note: approved ? 'Citizen confirmed resolution' : 'Citizen rejected — issue not resolved',
      });
      showToast(approved ? 'Issue confirmed as resolved!' : 'Resolution rejected — issue reopened');
      onClose();
    } catch (err) {
      showToast('Action failed: ' + err.message);
    } finally {
      setConfirming(false);
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(`${window.location.origin}#issue-${issue.id}`);
    showToast('Issue link copied!');
  };

  const dept = issue.department || {};
  const hod = dept.hodName || dept.hod_name;
  const hodPhone = dept.hodPhone || dept.hod_phone;
  const imgSrc = issue.imageUrl || issue.image_url || issue.image;
  const deadline = issue.deadline ? new Date(issue.deadline) : null;
  const isOverdue = deadline && deadline < new Date() && issue.status !== 'resolved';

  return (
    <div className="modalBackdrop" onClick={onClose} aria-modal="true" role="dialog">
      <div
        className="modalView"
        ref={modalRef}
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: 420, outline: 'none', maxHeight: '90vh', overflowY: 'auto' }}
        tabIndex={-1}
      >
        {/* Image */}
        {imgSrc ? (
          <img src={imgSrc} className="modalImage" alt={issue.title} />
        ) : (
          <div style={{ height: 120, background: '#F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 12, marginBottom: 12, fontSize: 40 }}>📷</div>
        )}

        {/* Title & Status */}
        <h2 className="modalTitle">{issue.title}</h2>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', marginBottom: 12 }}>
          <span style={{
            background: STATUS_COLORS[issue.status] || '#A1A1AA',
            color: '#fff', borderRadius: 8, padding: '3px 10px', fontSize: 12, fontWeight: 600,
          }}>
            {formatStatus(issue.status)}
          </span>
          {issue.escalated && (
            <span style={{ background: '#EF4444', color: '#fff', borderRadius: 8, padding: '3px 10px', fontSize: 12, fontWeight: 600 }}>
              🚨 Escalated
            </span>
          )}
          {isOverdue && (
            <span style={{ background: '#DC2626', color: '#fff', borderRadius: 8, padding: '3px 10px', fontSize: 12 }}>
              ⏰ Overdue
            </span>
          )}
        </div>

        {/* Description */}
        <p style={{ fontSize: 14, color: '#475569', lineHeight: 1.5, marginBottom: 16 }}>
          {issue.description}
        </p>

        {/* Department & HOD */}
        <div style={{ background: '#F0FDF4', borderRadius: 12, padding: 12, marginBottom: 16 }}>
          <div style={{ fontWeight: 600, color: '#166534', marginBottom: 6, fontSize: 14 }}>
            {dept.icon || '🏛️'} {dept.name || 'General Department'}
          </div>
          {hod && (
            <div style={{ fontSize: 13, color: '#15803D' }}>
              👤 HOD: <strong>{hod}</strong>
            </div>
          )}
          {hodPhone && (
            <div style={{ fontSize: 13, color: '#15803D', marginTop: 2 }}>
              📞 <a href={`tel:${hodPhone}`} style={{ color: '#166534', textDecoration: 'underline' }}>{hodPhone}</a>
            </div>
          )}
        </div>

        {/* Deadline */}
        {deadline && (
          <div style={{ fontSize: 13, color: isOverdue ? '#DC2626' : '#6B7280', marginBottom: 12 }}>
            📅 Deadline: {deadline.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
          </div>
        )}

        {/* Status Timeline */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontWeight: 600, color: '#4F46E5', marginBottom: 8, fontSize: 14 }}>Status Timeline</div>
          {loading ? (
            <div style={{ color: '#9CA3AF', fontSize: 13 }}>Loading timeline...</div>
          ) : statusHistory.length > 0 ? (
            <div style={{ borderLeft: '3px solid #E5E7EB', paddingLeft: 12 }}>
              {statusHistory.map((s, idx) => (
                <div key={idx} style={{ marginBottom: 8, fontSize: 13, position: 'relative' }}>
                  <div style={{
                    width: 10, height: 10, borderRadius: '50%',
                    background: idx === statusHistory.length - 1 ? '#4F46E5' : '#D1D5DB',
                    position: 'absolute', left: -18, top: 3,
                  }} />
                  <span style={{ fontWeight: idx === statusHistory.length - 1 ? 700 : 400, color: '#334155' }}>
                    {formatStatus(s.newStatus || s.new_status || s.status)}
                  </span>
                  <span style={{ color: '#9CA3AF', marginLeft: 6 }}>
                    {s.createdAt || s.created_at ? new Date(s.createdAt || s.created_at).toLocaleDateString('en-IN') : ''}
                  </span>
                  {s.note && <div style={{ fontSize: 12, color: '#6B7280', marginTop: 2 }}>{s.note}</div>}
                </div>
              ))}
            </div>
          ) : (
            <div style={{ color: '#9CA3AF', fontSize: 13 }}>No timeline entries yet</div>
          )}
        </div>

        {/* Resolution Photo */}
        {issue.resolutionPhoto && (
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontWeight: 600, color: '#10B981', marginBottom: 6, fontSize: 14 }}>Resolution Photo</div>
            <img src={issue.resolutionPhoto} alt="Resolution" style={{ width: '100%', borderRadius: 12, maxHeight: 200, objectFit: 'cover' }} />
            {issue.resolutionNote && <p style={{ fontSize: 13, color: '#6B7280', marginTop: 4 }}>{issue.resolutionNote}</p>}
          </div>
        )}

        {/* Citizen Confirmation Buttons (only if pending_user_verification) */}
        {issue.status === 'pending_user_verification' && (
          <div style={{ background: '#EFF6FF', borderRadius: 12, padding: 16, marginBottom: 16, textAlign: 'center' }}>
            <div style={{ fontWeight: 600, color: '#1E40AF', marginBottom: 8, fontSize: 14 }}>
              🔍 Supervisor verified this resolution. Is the issue actually fixed?
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                type="button"
                style={{ flex: 1, padding: '10px 0', borderRadius: 10, border: 'none', background: '#10B981', color: '#fff', fontWeight: 600, fontSize: 14, cursor: 'pointer' }}
                onClick={() => handleConfirm(true)}
                disabled={confirming}
              >
                ✅ Yes, Resolved
              </button>
              <button
                type="button"
                style={{ flex: 1, padding: '10px 0', borderRadius: 10, border: 'none', background: '#EF4444', color: '#fff', fontWeight: 600, fontSize: 14, cursor: 'pointer' }}
                onClick={() => handleConfirm(false)}
                disabled={confirming}
              >
                ❌ No, Reopen
              </button>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
          <button type="button" className="modalButton" style={{ background: '#4F46E5', color: '#fff', flex: 1 }} onClick={handleCopyLink}>
            🔗 Copy Link
          </button>
        </div>

        <button type="button" className="modalCloseButton" onClick={onClose}>
          Close
        </button>
      </div>
    </div>
  );
};

export default MyIssueDetailModal;
