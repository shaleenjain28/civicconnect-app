// ─── Add Issue Modal ───
// Report a new issue with image upload, AI analysis, GPS location, and department selection.

import React, { useEffect, useRef, useState } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { api } from '../../services/api';
import { locationService } from '../../services/locationService';

const DEPARTMENTS = [
  { name: 'Water Department', icon: '🚰' },
  { name: 'Roads & Infrastructure', icon: '🛣️' },
  { name: 'Electricity', icon: '⚡' },
  { name: 'Sanitation & Waste', icon: '🗑️' },
  { name: 'Traffic & Transport', icon: '🚦' },
  { name: 'Urban Development', icon: '🏗️' },
  { name: 'Parks & Environment', icon: '🌳' },
  { name: 'General Administration', icon: '📋' },
];

const AddIssueModal = ({ onClose, onAddIssue, userLocation }) => {
  const { t } = useLanguage();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedDept, setSelectedDept] = useState(null);
  const [criticality, setCriticality] = useState('medium');
  const [locationText, setLocationText] = useState('Getting location...');
  const [coords, setCoords] = useState(userLocation || { lat: 26.9124, lon: 75.7873 });
  const [selectedImage, setSelectedImage] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef(null);

  // Reverse geocode on mount
  useEffect(() => {
    const loc = userLocation || coords;
    locationService.reverseGeocode(loc.lat, loc.lon)
      .then(setLocationText)
      .catch(() => setLocationText(`${loc.lat.toFixed(4)}, ${loc.lon.toFixed(4)}`));
  }, [userLocation]);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setSelectedImage(ev.target.result);
    reader.readAsDataURL(file);
  };

  const handleAIAnalyze = async () => {
    if (!selectedFile) {
      alert('Please upload an image first');
      return;
    }

    setAiLoading(true);
    try {
      const result = await api.upload('/ai/analyze-image', selectedFile);
      setAiResult(result);
      setTitle(result.title || title);
      setDescription(result.description || description);
      setCriticality(result.criticality || 'medium');

      // Find matching department
      const matchedDept = DEPARTMENTS.find((d) => d.name === result.department);
      if (matchedDept) setSelectedDept(matchedDept);
    } catch (err) {
      alert('AI analysis failed: ' + err.message);
    } finally {
      setAiLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!title || !description) return;

    setSubmitting(true);
    try {
      // Find department ID (we'll need to look it up)
      const depts = await api.get('/departments');
      const dept = depts.find((d) => d.name === selectedDept?.name) || depts[7]; // fallback to General

      const issueData = {
        title,
        description,
        departmentId: dept.id,
        scope: 'local',
        criticality,
        latitude: coords.lat,
        longitude: coords.lon,
        locationText,
        imageUrl: selectedImage || undefined,
      };

      await onAddIssue(issueData);
    } catch (err) {
      alert('Failed to submit: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modalBackdrop" onClick={onClose}>
      <div className="addIssueModal" onClick={(e) => e.stopPropagation()}>
        <h2 className="addIssueTitle">{t('reportNewIssue')}</h2>

        {/* Image Upload */}
        <label className="addIssueLabel">{t('uploadPhoto')}</label>
        <input ref={fileInputRef} type="file" accept="image/*" capture="environment" style={{ display: 'none' }} onChange={handleFileChange} />
        <div className="addIssueImagePicker" onClick={() => fileInputRef.current?.click()} role="button" tabIndex={0}>
          {selectedImage ? (
            <img src={selectedImage} alt="Selected" style={{ width: '100%', height: 180, objectFit: 'cover', borderRadius: 12 }} />
          ) : (
            <span className="addIssueImagePickerText">{t('takePhoto')}</span>
          )}
        </div>

        {/* AI Analyze Button */}
        <button
          type="button"
          className="modalButton geminiButton"
          onClick={handleAIAnalyze}
          disabled={aiLoading || !selectedFile}
        >
          <span className="modalButtonText geminiButtonText">
            {aiLoading ? '🔄 Analyzing...' : t('generateAI')}
          </span>
        </button>

        {/* AI Result Badge */}
        {aiResult && (
          <div className="ai-result-badge">
            <span className="ai-badge-title">🤖 AI Suggestion</span>
            <div className="ai-badge-row">
              <span>📁 {aiResult.department}</span>
              <span className={`criticality-tag ${aiResult.criticality}`}>
                {aiResult.criticality}
              </span>
            </div>
          </div>
        )}

        {/* Location */}
        <label className="addIssueLabel">{t('location')}</label>
        <div className="addIssueLocation">
          <span className="addIssueLocationText">📍 {locationText}</span>
        </div>

        {/* Title */}
        <label className="addIssueLabel">{t('title')}</label>
        <input className="addIssueInput" placeholder="A clear title for the issue" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={100} />

        {/* Description */}
        <label className="addIssueLabel">{t('description')}</label>
        <textarea className="addIssueInput" style={{ height: 80 }} placeholder="Describe the issue in detail..." value={description} onChange={(e) => setDescription(e.target.value)} />

        {/* Department Selection */}
        <label className="addIssueLabel">{t('department')}</label>
        <div className="dept-select-grid">
          {DEPARTMENTS.map((dept) => (
            <button
              key={dept.name}
              className={`dept-select-btn ${selectedDept?.name === dept.name ? 'active' : ''}`}
              onClick={() => setSelectedDept(dept)}
              type="button"
            >
              <span>{dept.icon}</span>
              <span className="dept-select-name">{dept.name.split(' ')[0]}</span>
            </button>
          ))}
        </div>

        {/* Criticality */}
        <label className="addIssueLabel">{t('criticality')}</label>
        <div className="criticality-select">
          {['low', 'medium', 'high', 'critical'].map((c) => (
            <button
              key={c}
              className={`criticality-btn ${criticality === c ? 'active' : ''} criticality-${c}`}
              onClick={() => setCriticality(c)}
              type="button"
            >
              {c}
            </button>
          ))}
        </div>

        {/* Submit */}
        <button
          type="button"
          className="modalButton addIssueSubmitButton"
          onClick={handleSubmit}
          disabled={!title || !description || submitting}
        >
          <span className="modalButtonText">{submitting ? 'Submitting...' : t('submit')}</span>
        </button>

        <button type="button" className="addIssueCloseButton" onClick={onClose}>
          <span className="addIssueCloseButtonText">{t('cancel')}</span>
        </button>
      </div>
    </div>
  );
};

export default AddIssueModal;
