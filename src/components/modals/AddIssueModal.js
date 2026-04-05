import React, { useEffect, useRef, useState } from 'react';
import { mockApiService } from '../../services/mockApiService';

const AddIssueModal = ({ onClose, onAddIssue }) => {
    const [responseTime, setResponseTime] = useState(null);
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const fileInputRef = useRef(null);
    const [selectedImageDataUrl, setSelectedImageDataUrl] = useState(null);
    const [selectedFileName, setSelectedFileName] = useState(null);

    useEffect(() => {
        const getAvgTime = async () => {
            const time = await mockApiService.getAverageResponseTime('303007');
            setResponseTime(time.days);
        };
        getAvgTime();
    }, []);

    const handleFakeGenerate = () => {
        setTitle('Potholes');
        setDescription(
            'The road is riddled with numerous potholes across both lanes, causing vehicles to swerve and slowing traffic. Immediate repair is required to prevent accidents and further damage to vehicles.'
        );
    };

    const openFilePicker = () => {
        if (fileInputRef.current) fileInputRef.current.click();
    };

    const handleFileChange = (e) => {
        const file = e.target.files && e.target.files[0];
        if (!file) return;
        setSelectedFileName(file.name);
        const reader = new FileReader();
        reader.onload = (ev) => {
            setSelectedImageDataUrl(ev.target.result);
        };
        reader.readAsDataURL(file);
    };

    const handleSubmit = () => {
        const newIssue = {
            title,
            description,
            category: 'Uncategorized',
            scope: 'local',
            lat: 26.85 + (Math.random() - 0.5) * 0.1,
            lon: 75.8 + (Math.random() - 0.5) * 0.1,
            image:
                selectedImageDataUrl ||
                'https://images.pexels.com/photos/162553/office-work-business-creative-162553.jpeg?auto=compress&cs=tinysrgb&w=600',
        };
        onAddIssue(newIssue);
    };

    return (
        <div className="modalBackdrop" onClick={onClose}>
            <div className="addIssueModal" onClick={(e) => e.stopPropagation()}>
                <h2 className="addIssueTitle">Report a New Issue</h2>
                <label className="addIssueLabel" htmlFor="add-issue-file">
                    Upload Photo
                </label>
                <input
                    id="add-issue-file"
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    style={{ display: 'none' }}
                    onChange={handleFileChange}
                />
                <div
                    className="addIssueImagePicker"
                    onClick={openFilePicker}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') openFilePicker();
                    }}
                >
                    {selectedImageDataUrl ? (
                        <img
                            src={selectedImageDataUrl}
                            alt={selectedFileName || 'Selected'}
                            style={{ width: '100%', height: 180, objectFit: 'cover', borderRadius: 12 }}
                        />
                    ) : (
                        <span className="addIssueImagePickerText">Tap to select an image</span>
                    )}
                </div>
                <button
                    type="button"
                    className="modalButton geminiButton"
                    onClick={handleFakeGenerate}
                    title="Generate preset title and description"
                    style={{ cursor: 'pointer' }}
                >
                    <span className="modalButtonText geminiButtonText">✨ Generate with AI</span>
                </button>
                <label className="addIssueLabel">Location</label>
                <div className="addIssueLocation">
                    <span className="addIssueLocationText">Dahmi Kalan, Rajasthan</span>
                </div>
                {responseTime && (
                    <p className="responseTimeText">💡 Estimated response time in this area: ~{responseTime} days</p>
                )}
                <label className="addIssueLabel" htmlFor="add-issue-title">
                    Title
                </label>
                <input
                    id="add-issue-title"
                    className="addIssueInput"
                    placeholder="A clear title for the issue"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    maxLength={7 * 5}
                />
                <label className="addIssueLabel" htmlFor="add-issue-desc">
                    Description
                </label>
                <textarea
                    id="add-issue-desc"
                    className="addIssueInput"
                    style={{ height: 100 }}
                    placeholder="Describe the issue in detail..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                />
                <div style={{ flex: 1 }} />
                <button type="button" className="modalButton addIssueSubmitButton" onClick={handleSubmit} disabled={!title || !description}>
                    <span className="modalButtonText">Submit Issue</span>
                </button>
                <button type="button" className="addIssueCloseButton" onClick={onClose}>
                    <span className="addIssueCloseButtonText">Cancel</span>
                </button>
            </div>
        </div>
    );
};

export default AddIssueModal;
