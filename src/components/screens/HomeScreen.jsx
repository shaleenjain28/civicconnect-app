// ─── Home Screen ───
// Shows nearby issues on map + list, filtered by scope tabs.

import React, { useState } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import MapComponent from '../MapComponent';
import IssueModal from '../modals/IssueModal';
import { ProfileIcon } from '../icons/Icons';

const CRITICALITY_COLORS = {
  critical: '#DC2626',
  high: '#EA580C',
  medium: '#CA8A04',
  low: '#16A34A',
};

const STATUS_COLORS = {
  pending: '#F59E42',
  in_progress: '#3B82F6',
  pending_verification: '#8B5CF6',
  pending_user_verification: '#0EA5E9',
  resolved: '#10B981',
};

const HomeScreen = ({ issues, handleUpvote, setActiveScreen, userLocation, isLoading, onRefresh }) => {
  const { t } = useLanguage();
  const [selectedIssue, setSelectedIssue] = useState(null);
  const [activeScope, setActiveScope] = useState('local');

  const scopes = [
    { key: 'local', label: t('local') },
    { key: 'city', label: t('city') },
    { key: 'state', label: t('state') },
    { key: 'country', label: t('country') },
  ];

  const filteredIssues = issues
    .filter((issue) => (issue.scope || 'local') === activeScope)
    .sort((a, b) => (b.upvote_count || b.upvoteCount || 0) - (a.upvote_count || a.upvoteCount || 0));

  const getStatusColor = (status) => STATUS_COLORS[status] || '#A1A1AA';
  const getCriticalityColor = (crit) => CRITICALITY_COLORS[crit] || '#CA8A04';

  return (
    <div className="container">
      <div className="appHeader">
        <div className="header-brand">
          <img src="/logo.png" alt="CivicConnect Logo" className="header-logo-image" style={{ width: '32px', height: '32px', objectFit: 'contain', borderRadius: '8px', marginRight: '8px' }} />
          <span className="header-brand-text">CivicConnect</span>
        </div>
        <div className="headerIcon" onClick={() => setActiveScreen('Profile')} role="presentation">
          <ProfileIcon active={false} />
        </div>
      </div>

      <MapComponent issues={filteredIssues} userLocation={userLocation} />

      <div className="issuesScopeContainer">
        <div className="scopeTabsContainer">
          {scopes.map((scope) => (
            <button
              key={scope.key}
              type="button"
              className={`scopeTab ${activeScope === scope.key ? 'scopeTabActive' : ''}`}
              onClick={() => setActiveScope(scope.key)}
            >
              {scope.label}
            </button>
          ))}
        </div>

        <div className="listScrollView noPadding">
          {isLoading ? (
            <div className="skeleton-list">
              {[1, 2, 3].map((i) => (
                <div key={i} className="skeleton-card">
                  <div className="skeleton skeleton-image" />
                  <div className="skeleton-info">
                    <div className="skeleton skeleton-title" />
                    <div className="skeleton skeleton-text" />
                    <div className="skeleton skeleton-badge" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredIssues.length > 0 ? (
            filteredIssues.map((item) => (
              <div key={item.id} className="issueListItemV2" tabIndex={0} onClick={() => setSelectedIssue(item)} role="presentation">
                {item.image_url || item.imageUrl || item.image ? (
                  <img src={item.image_url || item.imageUrl || item.image} className="issueListImageV2" alt={item.title} />
                ) : (
                  <div className="issueListImageV2 no-image">📷</div>
                )}
                <div className="issueListInfoV2">
                  <p className="issueListTitleV2">{item.title}</p>
                  <p className="issueListCategoryV2">
                    {item.department?.icon || item.department_icon || ''} {item.department?.name || item.department_name || 'General'}
                  </p>
                  <div className="issueListFooterV2">
                    <span
                      className="issue-criticality-badge"
                      style={{ background: getCriticalityColor(item.criticality) }}
                    >
                      {item.criticality || 'medium'}
                    </span>
                    <span style={{ background: getStatusColor(item.status) }}>
                      {item.status === 'in_progress' ? 'In Progress' : (item.status || 'pending')}
                    </span>
                    <span className="upvote-count">👍 {item.upvote_count || item.upvoteCount || 0}</span>
                  </div>
                  {item.distance_meters && (
                    <p className="issue-distance">📍 {(item.distance_meters / 1000).toFixed(1)} km away</p>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="empty-state-app">
              <span className="empty-state-emoji">🔍</span>
              <p>{t('noIssuesFound')}</p>
            </div>
          )}
        </div>
      </div>

      {selectedIssue && (
        <IssueModal issue={selectedIssue} onClose={() => setSelectedIssue(null)} onUpvote={handleUpvote} />
      )}
    </div>
  );
};

export default HomeScreen;
