/**
 * Data service v3 — Fetches real data from backend API
 * Replaces the old localStorage-based mock data
 */

import { authService } from './authService';

const API_BASE = '/api';

async function apiFetch(path, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...authService.getAuthHeader(),
    ...(options.headers || {}),
  };
  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || err.message || 'API error');
  }
  return res.json();
}

export const dataService = {
  // ── Issues ──
  async getProblems(filters = {}) {
    const params = new URLSearchParams();
    if (filters.department) params.set('department', filters.department);
    if (filters.status) params.set('status', filters.status);
    if (filters.criticality) params.set('criticality', filters.criticality);
    if (filters.sort) params.set('sort', filters.sort);
    if (filters.escalated) params.set('escalated', 'true');
    params.set('limit', filters.limit || '100');

    const data = await apiFetch(`/issues?${params.toString()}`);
    return data.data || [];
  },

  async getIssue(id) {
    return apiFetch(`/issues/${id}`);
  },

  async getEscalated() {
    const data = await apiFetch('/issues/escalated');
    return data.data || [];
  },

  async updateStatus(issueId, status, note = '') {
    return apiFetch(`/issues/${issueId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, note }),
    });
  },

  async resolveIssue(issueId, resolutionPhoto, resolutionNote = '') {
    return apiFetch(`/issues/${issueId}/resolve`, {
      method: 'PATCH',
      body: JSON.stringify({ resolutionPhoto, resolutionNote }),
    });
  },

  async verifyIssue(issueId, approved, note = '') {
    return apiFetch(`/issues/${issueId}/verify`, {
      method: 'PATCH',
      body: JSON.stringify({ approved, note }),
    });
  },

  async reassignIssue(issueId, departmentId, note = '') {
    return apiFetch(`/issues/${issueId}/reassign`, {
      method: 'PATCH',
      body: JSON.stringify({ departmentId, note }),
    });
  },

  // ── Departments ──
  async getDepartments() {
    return apiFetch('/departments');
  },

  async getDepartment(id) {
    return apiFetch(`/departments/${id}`);
  },

  async getHod(deptId) {
    return apiFetch(`/departments/${deptId}/hod`);
  },

  async updateHod(deptId, hodData) {
    return apiFetch(`/departments/${deptId}/hod`, {
      method: 'PATCH',
      body: JSON.stringify(hodData),
    });
  },

  // ── Stats (computed from API data) ──
  async getStats() {
    try {
      const [issues, departments] = await Promise.all([
        apiFetch('/issues?limit=1000'),
        apiFetch('/departments'),
      ]);

      const allIssues = issues.data || [];
      const total = issues.total || allIssues.length;
      const resolved = allIssues.filter(i => i.status === 'resolved').length;
      const pending = allIssues.filter(i => i.status === 'pending').length;
      const inProgress = allIssues.filter(i => i.status === 'in_progress').length;
      const pendingVerification = allIssues.filter(i => i.status === 'pending_verification').length;
      const escalated = allIssues.filter(i => i.escalated).length;
      const rate = total > 0 ? Math.round((resolved / total) * 100) : 0;

      return {
        total, resolved, pending, inProgress, pendingVerification, escalated,
        resolutionRate: rate,
        departments: departments.length,
      };
    } catch (err) {
      console.error('Failed to fetch stats:', err);
      return { total: 0, resolved: 0, pending: 0, inProgress: 0, pendingVerification: 0, escalated: 0, resolutionRate: 0, departments: 0 };
    }
  },

  // ── Chart Data ──
  async getTypeDistribution() {
    try {
      const departments = await apiFetch('/departments');
      return departments.map(d => ({
        name: d.name.split(' ')[0],  // Short name
        fullName: d.name,
        count: d.totalIssues || 0,
        color: d.color || '#4caf50',
        icon: d.icon,
      }));
    } catch {
      return [];
    }
  },

  async getStatusDistribution() {
    try {
      const { data } = await apiFetch('/issues?limit=1000');
      const all = data || [];
      return [
        { name: 'Pending', count: all.filter(i => i.status === 'pending').length, color: '#F59E0B' },
        { name: 'In Progress', count: all.filter(i => i.status === 'in_progress').length, color: '#3B82F6' },
        { name: 'Verification', count: all.filter(i => i.status === 'pending_verification').length, color: '#8B5CF6' },
        { name: 'Resolved', count: all.filter(i => i.status === 'resolved').length, color: '#10B981' },
      ];
    } catch {
      return [];
    }
  },

  // Map helpers
  getCriticalityColor(criticality) {
    const map = { critical: '#DC2626', high: '#EA580C', medium: '#F59E0B', low: '#10B981' };
    return map[criticality] || '#9CA3AF';
  },

  getStatusColor(status) {
    const map = { pending: '#F59E0B', in_progress: '#3B82F6', pending_verification: '#8B5CF6', resolved: '#10B981' };
    return map[status] || '#9CA3AF';
  },

  getStatusLabel(status) {
    const map = { pending: 'Pending', in_progress: 'In Progress', pending_verification: 'Verification', resolved: 'Resolved' };
    return map[status] || status;
  },
};
