import React, { useState } from 'react';
import { api } from '../../services/api';
import OfficialDraftModal from './OfficialDraftModal';

const IssueModal = ({ issue, onClose, onUpvote }) => {
  const [showDraftModal, setShowDraftModal] = useState(false);
  const [draftContent, setDraftContent] = useState('');
  const [isDrafting, setIsDrafting] = useState(false);

  const handleDraftRequest = async () => {
    setIsDrafting(true);
    try {
      const result = await api.post('/ai/draft-complaint', {
        title: issue.title,
        description: issue.description,
        department: issue.department?.name || issue.department_name || 'Municipal Corporation',
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

  const imgSrc = issue.image_url || issue.imageUrl || issue.image;
  const deptName = issue.department?.name || issue.department_name || issue.category || 'General';

  return (
    <div className="modalBackdrop" onClick={onClose}>
      <div className="issueModal" onClick={(e) => e.stopPropagation()}>
        {imgSrc && <img src={imgSrc} style={{ width: '100%', height: 200, objectFit: 'cover', borderRadius: 12, marginBottom: 16 }} alt={issue.title} />}
        <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>{issue.title}</h2>
        <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 8 }}>{deptName}</p>
        <p style={{ fontSize: 14, color: 'var(--text-primary)', marginBottom: 16, lineHeight: 1.5 }}>{issue.description}</p>

        <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
          <span style={{ padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600, background: issue.status === 'resolved' ? '#10B981' : issue.status === 'in_progress' ? '#3B82F6' : '#F59E42', color: '#fff' }}>
            {issue.status === 'in_progress' ? 'In Progress' : issue.status || 'pending'}
          </span>
          {issue.criticality && (
            <span style={{ padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600, background: issue.criticality === 'critical' ? '#DC2626' : issue.criticality === 'high' ? '#EA580C' : issue.criticality === 'medium' ? '#CA8A04' : '#16A34A', color: '#fff', textTransform: 'capitalize' }}>
              {issue.criticality}
            </span>
          )}
          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)' }}>
            👍 {issue.upvoteCount || issue.upvote_count || issue.upvotes || 0} Upvotes
          </span>
        </div>

        {issue.locationText || issue.location_text ? (
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 16 }}>📍 {issue.locationText || issue.location_text}</p>
        ) : null}

        <button type="button" className="modalButton addIssueSubmitButton" onClick={handleUpvote}>
          <span className="modalButtonText">👍 Upvote Issue</span>
        </button>
        <button type="button" className="modalButton geminiButton" onClick={handleDraftRequest} disabled={isDrafting}>
          <span className="modalButtonText">{isDrafting ? '🔄 Drafting...' : '✨ Draft Official Complaint with AI'}</span>
        </button>
        <button type="button" className="addIssueCloseButton" onClick={onClose}>
          <span>Close</span>
        </button>
      </div>
      {showDraftModal && <OfficialDraftModal content={draftContent} onClose={() => setShowDraftModal(false)} />}
    </div>
  );
};

export default IssueModal;
