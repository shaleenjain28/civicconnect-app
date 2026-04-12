// ─── Department Issues Screen ───
// Shows issues filtered by a specific department.
// Navigated to when user clicks a department card in Insights.

import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import IssueModal from '../modals/IssueModal';

const STATUS_COLORS = {
  pending: '#F59E42',
  in_progress: '#3B82F6',
  resolved: '#10B981',
};

const CRITICALITY_COLORS = {
  critical: '#DC2626',
  high: '#EA580C',
  medium: '#CA8A04',
  low: '#16A34A',
};

const DepartmentIssuesScreen = ({ department, onBack }) => {
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedIssue, setSelectedIssue] = useState(null);

  useEffect(() => {
    if (department?.id) {
      api.get('/issues', { department: department.id, limit: 50 })
        .then((data) => setIssues(data.data || []))
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [department]);

  return (
    <div className="container">
      <div className="header">
        <button className="back-btn" onClick={onBack}>← Back</button>
        <h1 className="headerTitle">
          {department?.icon} {department?.name}
        </h1>
      </div>

      <div className="dept-header-card" style={{ borderLeftColor: department?.color }}>
        <p className="dept-description">{department?.description}</p>
        <div className="dept-stats-mini">
          <span>{issues.length} issues</span>
          <span>{issues.filter((i) => i.status === 'resolved').length} resolved</span>
        </div>
      </div>

      <div className="listScrollView">
        {loading ? (
          <div className="skeleton-list">
            {[1, 2, 3].map((i) => (
              <div key={i} className="skeleton-card">
                <div className="skeleton skeleton-image" />
                <div className="skeleton-info">
                  <div className="skeleton skeleton-title" />
                  <div className="skeleton skeleton-text" />
                </div>
              </div>
            ))}
          </div>
        ) : issues.length > 0 ? (
          issues.map((item) => (
            <div key={item.id} className="issueListItemV2" onClick={() => setSelectedIssue(item)}>
              {item.imageUrl || item.image_url ? (
                <img src={item.imageUrl || item.image_url} className="issueListImageV2" alt={item.title} />
              ) : (
                <div className="issueListImageV2 no-image">📷</div>
              )}
              <div className="issueListInfoV2">
                <p className="issueListTitleV2">{item.title}</p>
                <div className="issueListFooterV2">
                  <span style={{ background: CRITICALITY_COLORS[item.criticality] || '#CA8A04' }}>
                    {item.criticality}
                  </span>
                  <span style={{ background: STATUS_COLORS[item.status] || '#A1A1AA' }}>
                    {item.status === 'in_progress' ? 'In Progress' : item.status}
                  </span>
                  <span className="upvote-count">👍 {item.upvoteCount || item.upvote_count || 0}</span>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="empty-state-app">
            <span className="empty-state-emoji">📭</span>
            <p>No issues in this department</p>
          </div>
        )}
      </div>

      {selectedIssue && (
        <IssueModal issue={selectedIssue} onClose={() => setSelectedIssue(null)} />
      )}
    </div>
  );
};

export default DepartmentIssuesScreen;
