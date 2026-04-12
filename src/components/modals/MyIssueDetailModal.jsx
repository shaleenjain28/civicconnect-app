import React, { useEffect, useRef } from 'react';
import { CATEGORY_COLORS } from '../../constants/theme';

const MyIssueDetailModal = ({ issue, onClose, statusHistory, comments, authority, showToast }) => {
    const modalRef = useRef();
    useEffect(() => {
        if (modalRef.current) modalRef.current.focus();
    }, []);
    const handleCopyLink = () => {
        navigator.clipboard.writeText(`${window.location.href}#issue-${issue.id}`);
        showToast('Issue link copied!');
    };
    const handleDownload = () => {
        const text = `Issue: ${issue.title}\nStatus: ${issue.status}\n\nTimeline:\n${statusHistory.map((s) => `${s.status} - ${s.date}`).join('\n')}`;
        const blob = new Blob([text], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `issue-${issue.id}.txt`;
        a.click();
        URL.revokeObjectURL(url);
        showToast('Issue exported as text!');
    };
    return (
        <div className="modalBackdrop" onClick={onClose} aria-modal="true" role="dialog">
            <div
                className="modalView"
                ref={modalRef}
                onClick={(e) => e.stopPropagation()}
                style={{ maxWidth: 420, outline: 'none' }}
                tabIndex={-1}
            >
                <img src={issue.image} className="modalImage" alt={issue.title} />
                <h2 className="modalTitle">{issue.title}</h2>
                <span
                    style={{
                        background: CATEGORY_COLORS[issue.category] || CATEGORY_COLORS.default,
                        color: '#fff',
                        borderRadius: 8,
                        padding: '2px 10px',
                        fontSize: 12,
                        marginBottom: 8,
                        display: 'inline-block',
                    }}
                >
                    {issue.category}
                </span>
                <div style={{ margin: '12px 0 8px 0', fontSize: 14, color: '#6366F1', fontWeight: 500 }}>
                    Assigned to: <span style={{ color: '#4F46E5' }}>{authority.name}</span>
                </div>
                <div style={{ margin: '16px 0' }}>
                    <div style={{ fontWeight: 600, color: '#4F46E5', marginBottom: 4 }}>Status Timeline</div>
                    <ol style={{ paddingLeft: 18, margin: 0, color: '#334155', fontSize: 13 }}>
                        {statusHistory.map((s, idx) => (
                            <li key={s.status} style={{ marginBottom: 2, fontWeight: idx === statusHistory.length - 1 ? 700 : 400 }}>
                                {s.status} <span style={{ color: '#6B7280' }}>({s.date})</span>
                            </li>
                        ))}
                    </ol>
                </div>
                <div style={{ margin: '16px 0' }}>
                    <div style={{ fontWeight: 600, color: '#4F46E5', marginBottom: 4 }}>Comments & Updates</div>
                    <div style={{ maxHeight: 90, overflowY: 'auto', background: '#F3F4F6', borderRadius: 8, padding: 8, marginBottom: 6 }}>
                        {comments.map((c, i) => (
                            <div key={i} style={{ marginBottom: 4 }}>
                                <span style={{ fontWeight: 500, color: c.user === 'You' ? '#4F46E5' : '#334155' }}>{c.user}:</span> {c.text}
                            </div>
                        ))}
                    </div>
                </div>
                <div style={{ display: 'flex', gap: 8, margin: '12px 0' }}>
                    <button type="button" className="modalButton" style={{ background: '#4F46E5', color: '#fff' }} onClick={handleCopyLink}>
                        Copy Link
                    </button>
                    <button type="button" className="modalButton" style={{ background: '#10B981', color: '#fff' }} onClick={handleDownload}>
                        Export
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
