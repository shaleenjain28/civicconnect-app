import React, { useEffect } from 'react';

const Toast = ({ message, onClose }) => {
    useEffect(() => {
        const timer = setTimeout(onClose, 3000);
        return () => clearTimeout(timer);
    }, [onClose]);
    return (
        <div className="toast" role="alert" aria-live="assertive">
            {message}
            <button
                type="button"
                onClick={onClose}
                style={{ marginLeft: 16, background: 'none', border: 'none', color: '#fff', fontWeight: 700, cursor: 'pointer', fontSize: 16 }}
            >
                ×
            </button>
        </div>
    );
};

export default Toast;
