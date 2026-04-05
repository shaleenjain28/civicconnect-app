import React, { useState } from 'react';

const OfficialDraftModal = ({ content, onClose }) => {
    const [copyText, setCopyText] = useState('Copy Text');
    const handleCopy = () => {
        navigator.clipboard.writeText(content);
        setCopyText('Copied!');
        setTimeout(() => setCopyText('Copy Text'), 2000);
    };
    return (
        <div className="modalBackdrop" onClick={onClose}>
            <div className="modalView" onClick={(e) => e.stopPropagation()}>
                <h2 className="modalTitle">AI-Generated Complaint</h2>
                <textarea className="draftModalText" value={content} readOnly />
                <button type="button" className="modalButton" onClick={handleCopy}>
                    <span className="modalButtonText">{copyText}</span>
                </button>
                <button type="button" className="modalCloseButton" onClick={onClose}>
                    <span className="modalCloseButtonText">Close</span>
                </button>
            </div>
        </div>
    );
};

export default OfficialDraftModal;
