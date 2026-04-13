// ─── API Client ───
// Central HTTP client for all backend API calls.
// Automatically injects JWT token from localStorage.

const API_BASE = '/api';

class ApiClient {
  async request(endpoint, options = {}) {
    const url = `${API_BASE}${endpoint}`;

    // Get stored session token
    const session = this.getSession();
    const headers = {
      ...(options.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
      ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
      ...options.headers,
    };

    const response = await fetch(url, {
      ...options,
      headers,
      body: options.body instanceof FormData ? options.body : (options.body ? JSON.stringify(options.body) : undefined),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Network error' }));
      throw new Error(error.error || `HTTP ${response.status}`);
    }

    return response.json();
  }

  get(endpoint, params = {}) {
    const query = new URLSearchParams(
      Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== '')
    ).toString();
    return this.request(`${endpoint}${query ? `?${query}` : ''}`);
  }

  post(endpoint, body) {
    return this.request(endpoint, { method: 'POST', body });
  }

  patch(endpoint, body) {
    return this.request(endpoint, { method: 'PATCH', body });
  }

  delete(endpoint) {
    return this.request(endpoint, { method: 'DELETE' });
  }

  upload(endpoint, file) {
    const formData = new FormData();
    formData.append('image', file);
    return this.request(endpoint, { method: 'POST', body: formData });
  }

  // Session management
  saveSession(session) {
    localStorage.setItem('cc_session', JSON.stringify(session));
  }

  getSession() {
    try {
      return JSON.parse(localStorage.getItem('cc_session'));
    } catch {
      return null;
    }
  }

  clearSession() {
    localStorage.removeItem('cc_session');
    localStorage.removeItem('cc_user');
  }

  saveUser(user) {
    localStorage.setItem('cc_user', JSON.stringify(user));
  }

  getUser() {
    try {
      return JSON.parse(localStorage.getItem('cc_user'));
    } catch {
      return null;
    }
  }
}

export const api = new ApiClient();
