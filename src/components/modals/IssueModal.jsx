import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import OfficialDraftModal from './OfficialDraftModal';

const IssueModal = ({ issue, onClose, onUpvote }) => {
  const [showDraftModal, setShowDraftModal] = useState(false);
  const [draftContent, setDraftContent] = useState('');
  const [isDrafting, setIsDrafting] = useState(false);
  const [hodInfo, setHodInfo] = useState(null);
  const [loadingHod, setLoadingHod] = useState(false);
  const [confirming, setConfirming] = useState(false);

  // Fetch HOD contact info for this issue's department
  useEffect(() => {
    const deptId = issue.departmentId || issue.department_id || issue.department?.id;
    if (deptId) {
      setLoadingHod(true);
      api.get(`/departments/${deptId}/hod`)
        .then(setHodInfo)
        .catch(() => setHodInfo(null))
        .finally(() => setLoadingHod(false));
    }
  }, [issue]);

  const handleDraftRequest = async () => {
    setIsDrafting(true);
    try {
      const result = await api.post('/ai/draft-complaint', {
        title: issue.title,
        description: issue.description,
        department: issue.department?.name || hodInfo?.department || 'Municipal Corporation',
        location: issue.locationText || issue.location_text || 'Not specified',
        upvotes: issue.upvoteCount || issue.upvote_count || 0,
      });
      setDraftContent(result.letter);
      setShowDraftModal(true);
    } catch (err) {
      alert('Draft generation failed: ' + err.message);
    } finally {
      setIsDrafting(false);
    }
  };

  const handleUpvote = () => {
    if (onUpvote) onUpvote(issue.id);
  };

  const deptName = issue.department?.name || issue.department_name || issue.category || 'General';
  const imgSrc = issue.image_url || issue.imageUrl || issue.image;

  // Calculate deadline countdown
  const deadline = issue.deadline ? new Date(issue.deadline) : null;
  const now = new Date();
  const deadlinePassed = deadline && deadline < now;
  const hoursLeft = deadline ? Math.max(0, Math.floor((deadline - now) / (60 * 60 * 1000))) : null;
  const daysLeft = hoursLeft !== null ? Math.floor(hoursLeft / 24) : null;

  return (
    <div className="modalBackdrop" onClick={onClose}>
      <div className="issueModal" onClick={(e) => e.stopPropagation()}>
        {/* Image */}
        {imgSrc && <img src={imgSrc} style={{ width: '100%', height: 180, objectFit: 'cover', borderRadius: 12, marginBottom: 12 }} alt={issue.title} />}

        {/* Title + Department */}
        <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 4 }}>{issue.title}</h2>
        <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 8 }}>{deptName}</p>

        {/* Badges Row */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 12, flexWrap: 'wrap', alignItems: 'center' }}>
          <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600, background: issue.status === 'resolved' ? '#10B981' : issue.status === 'pending_user_verification' ? '#0EA5E9' : issue.status === 'in_progress' ? '#3B82F6' : issue.status === 'pending_verification' ? '#8B5CF6' : '#F59E42', color: '#fff' }}>
            {issue.status === 'in_progress'
              ? 'In Progress'
              : issue.status === 'pending_verification'
                ? 'Supervisor Verification'
                : issue.status === 'pending_user_verification'
                  ? 'Needs Your Confirmation'
                  : issue.status || 'pending'}
          </span>
          {issue.criticality && (
            <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600, background: issue.criticality === 'critical' ? '#DC2626' : issue.criticality === 'high' ? '#EA580C' : issue.criticality === 'medium' ? '#CA8A04' : '#16A34A', color: '#fff', textTransform: 'capitalize' }}>
              {issue.criticality}
            </span>
          )}
          {issue.escalated && (
            <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600, background: '#DC2626', color: '#fff' }}>
              🚨 Escalated
            </span>
          )}
          <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>
            👍 {issue.upvoteCount || issue.upvote_count || 0}
          </span>
        </div>

        {/* Description */}
        <p style={{ fontSize: 13, color: 'var(--text-primary)', marginBottom: 12, lineHeight: 1.5 }}>{issue.description}</p>

        {/* Deadline Countdown */}
        {deadline && (
          <div style={{ padding: '8px 12px', borderRadius: 10, marginBottom: 12, background: deadlinePassed ? '#FEE2E2' : hoursLeft < 48 ? '#FEF3C7' : '#ECFDF5', border: `1px solid ${deadlinePassed ? '#FECACA' : hoursLeft < 48 ? '#FDE68A' : '#A7F3D0'}` }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: deadlinePassed ? '#DC2626' : hoursLeft < 48 ? '#92400E' : '#065F46' }}>
              {deadlinePassed ? '⚠️ Deadline passed!' : `⏰ ${daysLeft > 0 ? `${daysLeft}d ${hoursLeft % 24}h` : `${hoursLeft}h`} remaining`}
            </span>
          </div>
        )}

        {/* Location */}
        {(issue.locationText || issue.location_text) && (
          <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 12 }}>
            📍 {issue.locationText || issue.location_text}
          </p>
        )}

        {/* HOD Contact Info */}
        {hodInfo?.hod?.name && hodInfo.hod.name !== 'Not assigned' && (
          <div style={{ padding: '12px', borderRadius: 10, background: 'var(--bg-tertiary, #F0F4F0)', marginBottom: 12, border: '1px solid var(--border-color, #E2E8F0)' }}>
            <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 6 }}>
              📞 Department Contact (HOD)
            </p>
            <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 2 }}>
              {hodInfo.hod.name} {hodInfo.hod.title ? `• ${hodInfo.hod.title}` : ''}
            </p>
            {hodInfo.hod.phone && (
              <a href={`tel:${hodInfo.hod.phone}`} style={{ fontSize: 12, color: '#2563EB', display: 'block', marginBottom: 2 }}>
                📱 {hodInfo.hod.phone}
              </a>
            )}
            {hodInfo.hod.email && (
              <a href={`mailto:${hodInfo.hod.email}`} style={{ fontSize: 12, color: '#2563EB', display: 'block' }}>
                ✉️ {hodInfo.hod.email}
              </a>
            )}
          </div>
        )}
        {loadingHod && (
          <p style={{ fontSize: 12, color: 'var(--text-tertiary)', marginBottom: 12 }}>Loading contact info...</p>
        )}

        {/* Upvote Button */}
        <button type="button" className="modalButton addIssueSubmitButton" onClick={handleUpvote} style={{ marginBottom: 8 }}>
          <span className="modalButtonText">👍 Upvote Issue</span>
        </button>

        {/* Citizen confirmation (after supervisor verifies) */}
        {issue.status === 'pending_user_verification' && (
          <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
            <button
              type="button"
              className="modalButton"
              onClick={async () => {
                setConfirming(true);
                try {
                  await api.patch(`/issues/${issue.id}/confirm`, { approved: true });
                  alert('Thanks — confirmed as resolved.');
                  onClose();
                } catch (err) {
                  alert(err.message);
                } finally {
                  setConfirming(false);
                }
              }}
              disabled={confirming}
              style={{ background: '#10B981', color: '#fff' }}
            >
              <span className="modalButtonText">{confirming ? 'Confirming...' : '✅ Confirm Resolved'}</span>
            </button>
            <button
              type="button"
              className="modalButton"
              onClick={async () => {
                const note = prompt('Optional: why is it not resolved?') || '';
                setConfirming(true);
                try {
                  await api.patch(`/issues/${issue.id}/confirm`, { approved: false, note });
                  alert('Rejected — issue reopened.');
                  onClose();
                } catch (err) {
                  alert(err.message);
                } finally {
                  setConfirming(false);
                }
              }}
              disabled={confirming}
              style={{ background: '#EF4444', color: '#fff' }}
            >
              <span className="modalButtonText">❌ Not Resolved</span>
            </button>
          </div>
        )}

        {/* AI Draft Button */}
        <button type="button" className="modalButton geminiButton" onClick={handleDraftRequest} disabled={isDrafting} style={{ marginBottom: 8 }}>
          <span className="modalButtonText">{isDrafting ? '🔄 Drafting...' : '✨ Draft Official Complaint with AI'}</span>
        </button>

        {/* Close */}
        <button type="button" className="addIssueCloseButton" onClick={onClose}>
          <span>Close</span>
        </button>
      </div>
      {showDraftModal && <OfficialDraftModal content={draftContent} onClose={() => setShowDraftModal(false)} />}
    </div>
  );
};

export default IssueModal;
