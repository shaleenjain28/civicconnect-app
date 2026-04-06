import React, { useState, useMemo } from 'react';
import { Search, Filter, Eye, X, MapPin, Calendar, ThumbsUp, ChevronDown } from 'lucide-react';
import { dataService } from '../services/dataService';

export default function ProblemsPage() {
  const [problems, setProblems] = useState(() => dataService.getProblems());
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All Statuses');
  const [typeFilter, setTypeFilter] = useState('All Types');
  const [priorityFilter, setPriorityFilter] = useState('All Priorities');
  const [selectedProblem, setSelectedProblem] = useState(null);

  const filtered = useMemo(() => {
    let list = [...problems];
    if (search) list = list.filter(p => p.title.toLowerCase().includes(search.toLowerCase()) || p.description.toLowerCase().includes(search.toLowerCase()));
    if (statusFilter !== 'All Statuses') list = list.filter(p => p.status === statusFilter);
    if (typeFilter !== 'All Types') list = list.filter(p => p.type === typeFilter);
    if (priorityFilter !== 'All Priorities') list = list.filter(p => p.priority === priorityFilter);
    return list;
  }, [problems, search, statusFilter, typeFilter, priorityFilter]);

  const clearFilters = () => {
    setSearch(''); setStatusFilter('All Statuses');
    setTypeFilter('All Types'); setPriorityFilter('All Priorities');
  };

  const handleStatusChange = (problemId, newStatus) => {
    const updated = dataService.updateProblemStatus(problemId, newStatus);
    setProblems(updated);
    if (selectedProblem?.id === problemId) {
      setSelectedProblem({ ...selectedProblem, status: newStatus });
    }
  };

  const statusClass = (s) => {
    switch (s) {
      case 'Pending':     return 'badge badge-pending';
      case 'In Progress': return 'badge badge-inprogress';
      case 'Resolved':    return 'badge badge-resolved';
      default:            return 'badge';
    }
  };

  const priorityClass = (p) => {
    switch (p) {
      case 'High':   return 'priority-badge priority-high';
      case 'Medium': return 'priority-badge priority-medium';
      case 'Low':    return 'priority-badge priority-low';
      default:       return 'priority-badge';
    }
  };

  const typeClass = (t) => {
    switch (t) {
      case 'Pothole':     return 'type-badge type-pothole';
      case 'Water':       return 'type-badge type-water';
      case 'Streetlight': return 'type-badge type-streetlight';
      case 'Garbage':     return 'type-badge type-garbage';
      default:            return 'type-badge';
    }
  };

  return (
    <div className="fade-in">
      {/* Page Header */}
      <div className="page-header-gradient">
        <h2 className="page-header-title">Problem Management</h2>
        <p className="page-header-desc">View, filter, and manage all citizen-reported problems</p>
      </div>

      {/* Filters */}
      <div className="card" style={{ marginBottom: 24 }}>
        <div className="card-header" style={{ paddingBottom: 0 }}>
          <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Filter size={18} style={{ color: 'var(--primary-600)' }} />
            Filters & Search
          </h3>
        </div>
        <div className="filters-bar">
          <div className="filter-group" style={{ flex: 2 }}>
            <label className="filter-label">Search</label>
            <div style={{ position: 'relative' }}>
              <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }} />
              <input
                className="filter-input"
                style={{ paddingLeft: 36, width: '100%' }}
                placeholder="Search problems..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
          <div className="filter-group">
            <label className="filter-label">Status</label>
            <select className="filter-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option>All Statuses</option>
              <option>Pending</option>
              <option>In Progress</option>
              <option>Resolved</option>
            </select>
          </div>
          <div className="filter-group">
            <label className="filter-label">Type</label>
            <select className="filter-select" value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
              <option>All Types</option>
              <option>Pothole</option>
              <option>Water</option>
              <option>Streetlight</option>
              <option>Garbage</option>
            </select>
          </div>
          <div className="filter-group">
            <label className="filter-label">Priority</label>
            <select className="filter-select" value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value)}>
              <option>All Priorities</option>
              <option>High</option>
              <option>Medium</option>
              <option>Low</option>
            </select>
          </div>
          <button className="clear-filters-btn" onClick={clearFilters}>Clear Filters</button>
        </div>
      </div>

      {/* Table */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Problems ({filtered.length})</h3>
          <p className="card-subtitle">Click on any problem to view details and manage status</p>
        </div>
        <div className="card-body" style={{ padding: 0 }}>
          <div className="data-table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Problem</th>
                  <th>Location</th>
                  <th>Type</th>
                  <th>Status</th>
                  <th>Priority</th>
                  <th>Votes</th>
                  <th>Reported</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((p) => (
                  <tr key={p.id} onClick={() => setSelectedProblem(p)}>
                    <td className="table-problem-cell">
                      <div className="table-problem-title">{p.title}</div>
                      <div className="table-problem-desc">{p.description}</div>
                    </td>
                    <td>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 13 }}>
                        <MapPin size={14} style={{ color: 'var(--text-tertiary)', flexShrink: 0 }} />
                        {p.location}
                      </span>
                    </td>
                    <td><span className={typeClass(p.type)}>{p.type}</span></td>
                    <td><span className={statusClass(p.status)}>{p.status}</span></td>
                    <td><span className={priorityClass(p.priority)}>{p.priority}</span></td>
                    <td>
                      <span className="table-votes">
                        <ThumbsUp size={14} /> {p.votes}
                      </span>
                    </td>
                    <td>
                      <span className="table-date">
                        <Calendar size={12} style={{ marginRight: 4, verticalAlign: 'middle' }} />
                        {p.reportedDate}
                      </span>
                    </td>
                    <td>
                      <button
                        className="table-action-btn"
                        onClick={(e) => { e.stopPropagation(); setSelectedProblem(p); }}
                      >
                        <Eye size={14} /> View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filtered.length === 0 && (
            <div className="empty-state">
              <Search size={48} className="empty-state-icon" />
              <p className="empty-state-text">No problems match your filters</p>
            </div>
          )}
        </div>
      </div>

      {/* Detail Modal */}
      {selectedProblem && (
        <ProblemModal
          problem={selectedProblem}
          onClose={() => setSelectedProblem(null)}
          onStatusChange={handleStatusChange}
        />
      )}
    </div>
  );
}

function ProblemModal({ problem, onClose, onStatusChange }) {
  const p = problem;
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>{p.title}</h2>
            <p style={{ fontSize: 13, color: 'var(--text-tertiary)' }}>Problem #{p.id}</p>
          </div>
          <button className="modal-close-btn" onClick={onClose}><X size={18} /></button>
        </div>

        <div className="modal-body">
          {p.image && (
            <img
              src={p.image}
              alt={p.title}
              style={{ width: '100%', height: 200, objectFit: 'cover', borderRadius: 'var(--radius-md)', marginBottom: 20 }}
            />
          )}

          <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: 20 }}>{p.description}</p>

          <div className="modal-detail-row">
            <span className="modal-detail-label">Location</span>
            <span className="modal-detail-value" style={{ display: 'flex', alignItems: 'center', gap: 4 }}><MapPin size={14} /> {p.location}</span>
          </div>
          <div className="modal-detail-row">
            <span className="modal-detail-label">Type</span>
            <span className="modal-detail-value">{p.type}</span>
          </div>
          <div className="modal-detail-row">
            <span className="modal-detail-label">Priority</span>
            <span className="modal-detail-value">{p.priority}</span>
          </div>
          <div className="modal-detail-row">
            <span className="modal-detail-label">Votes</span>
            <span className="modal-detail-value" style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--accent-700)' }}><ThumbsUp size={14} /> {p.votes}</span>
          </div>
          <div className="modal-detail-row">
            <span className="modal-detail-label">Reported</span>
            <span className="modal-detail-value">{p.reportedDate}</span>
          </div>
          <div className="modal-detail-row" style={{ borderBottom: 'none' }}>
            <span className="modal-detail-label">Status</span>
            <span className="modal-detail-value">
              <select
                className="filter-select"
                value={p.status}
                onChange={(e) => onStatusChange(p.id, e.target.value)}
                style={{ padding: '6px 10px', fontSize: 13 }}
              >
                <option>Pending</option>
                <option>In Progress</option>
                <option>Resolved</option>
              </select>
            </span>
          </div>
        </div>

        <div className="modal-actions">
          <button className="btn btn-primary btn-sm" onClick={() => { onStatusChange(p.id, 'In Progress'); }}>
            Mark In Progress
          </button>
          <button className="btn btn-accent btn-sm" onClick={() => { onStatusChange(p.id, 'Resolved'); }}>
            Resolve
          </button>
          <button className="btn btn-secondary btn-sm" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}
