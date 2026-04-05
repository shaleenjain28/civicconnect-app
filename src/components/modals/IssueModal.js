import React, { useState } from 'react';
import { geminiApiService } from '../../services/geminiApi';
import OfficialDraftModal from './OfficialDraftModal';

const IssueModal = ({ issue, onClose, onUpvote }) => {
    const [showDraftModal, setShowDraftModal] = useState(false);
    const [draftContent, setDraftContent] = useState('');
    const [isDrafting, setIsDrafting] = useState(false);
    const handleDraftRequest = async () => {
        setIsDrafting(true);
        const draft = await geminiApiService.draftOfficialComplaint(issue);
        setDraftContent(draft);
        setIsDrafting(false);
        setShowDraftModal(true);
    };
    return (
        <div className="modalBackdrop" onClick={onClose}>
            <div className="modalView" onClick={(e) => e.stopPropagation()}>
                <img src={issue.image} className="modalImage" alt={issue.title} />
                <h2 className="modalTitle">{issue.title}</h2>
                <p className="modalCategory">{issue.category}</p>
                <div className="modalStatusContainer">
                    <span className={`modalStatus status${issue.status.replace(/\s+/g, '')}`}>{issue.status}</span>
                    <span className="modalUpvotes">{issue.upvotes} Upvotes</span>
                </div>
                <p className="modalInfo">This issue is in your area. Add your voice to get it resolved faster!</p>
                <button type="button" className="modalButton" onClick={() => onUpvote(issue.id)}>
                    <span className="modalButtonText">Upvote Issue</span>
                </button>
                <button type="button" className="modalButton geminiButton" onClick={handleDraftRequest} disabled={isDrafting}>
                    <span className="modalButtonText geminiButtonText">✨ Draft Official Complaint with AI</span>
                    {isDrafting && <div className="spinner geminiSpinner" />}
                </button>
                <button type="button" className="modalCloseButton" onClick={onClose}>
                    <span className="modalCloseButtonText">Close</span>
                </button>
            </div>
            {showDraftModal && <OfficialDraftModal content={draftContent} onClose={() => setShowDraftModal(false)} />}
        </div>
    );
};

export default IssueModal;
