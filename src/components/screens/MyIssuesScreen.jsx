// ─── My Issues Screen ───
// Shows issues reported by the current user, fetched from API.

import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { api } from '../../services/api';
import Toast from '../Toast';
import MyIssueDetailModal from '../modals/MyIssueDetailModal';

const STATUS_COLORS = {
  pending: '#F59E42',
  in_progress: '#3B82F6',
  resolved: '#10B981',
};

const MyIssuesScreen = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('All');
  const [search, setSearch] = useState('');
  const [selectedIssue, setSelectedIssue] = useState(null);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    loadMyIssues();
  }, []);

  const loadMyIssues = async () => {
    setLoading(true);
    try {
      const data = await api.get('/issues', { limit: 100, sort: 'newest' });
      // Filter to current user's issues
      const myIssues = (data.data || []).filter(
        (issue) => issue.userId === user?.id || issue.user_id === user?.id ||
                   issue.user?.id === user?.id
      );
      setIssues(myIssues);
    } catch (err) {
      console.error('Failed to load issues:', err);
    } finally {
      setLoading(false);
    }
  };

  const filters = ['All', 'pending', 'in_progress', 'resolved'];
  const filterLabels = { All: t('all'), pending: t('pending'), in_progress: t('inProgress'), resolved: t('resolved') };

  let filteredIssues = [...issues];
  if (filter !== 'All') filteredIssues = filteredIssues.filter((i) => i.status === filter);
  if (search) filteredIssues = filteredIssues.filter((i) => i.title.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="container">
      <div className="header">
        <h1 className="headerTitle">{t('myIssues')}</h1>
      </div>

      <div style={{ padding: '0 20px', marginBottom: 12 }}>
        <input
          className="addIssueInput"
          placeholder={`${t('search')}...`}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="filterContainer">
        {filters.map((f) => (
          <button
            key={f}
            type="button"
            className={`filterButton ${filter === f ? 'filterButtonActive' : ''}`}
            onClick={() => setFilter(f)}
          >
            <span className={`filterButtonText ${filter === f ? 'filterButtonTextActive' : ''}`}>
              {filterLabels[f] || f}
            </span>
          </button>
        ))}
      </div>

      <div className="listScrollView" role="list">
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
        ) : filteredIssues.length > 0 ? (
          filteredIssues.map((item) => (
            <div key={item.id} className="issueListItemV2" tabIndex={0} role="listitem" onClick={() => setSelectedIssue(item)}>
              {item.imageUrl || item.image_url || item.image ? (
                <img src={item.imageUrl || item.image_url || item.image} className="issueListImageV2" alt={item.title} />
              ) : (
                <div className="issueListImageV2 no-image">📷</div>
              )}
              <div className="issueListInfoV2">
                <p className="issueListTitleV2">{item.title}</p>
                <p className="issueListCategoryV2">
                  {item.department?.icon || ''} {item.department?.name || 'General'}
                </p>
                <div className="issueListFooterV2">
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
            <p>No issues found</p>
          </div>
        )}
      </div>

      {selectedIssue && (
        <MyIssueDetailModal
          issue={selectedIssue}
          onClose={() => setSelectedIssue(null)}
          showToast={setToast}
        />
      )}
      {toast && <Toast message={toast} onClose={() => setToast(null)} />}
    </div>
  );
};

export default MyIssuesScreen;
