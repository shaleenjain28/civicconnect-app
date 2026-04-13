// ─── Dashboard Auth Service v3 ───
// Connects to our Express backend API for auth.
// Stores user + session in localStorage for persistence.

const API_BASE = '/api';

export const authService = {
  /**
   * Sign in via backend API
   */
  async signIn(email, password, role) {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || data.message || 'Login failed');

    // Store session and user
    const user = {
      id: data.user.id,
      email: data.user.email,
      name: data.user.name,
      role: data.user.role || role,
      department: data.user.departmentName || null,
      departmentId: data.user.departmentId || null,
    };

    localStorage.setItem('cc_user', JSON.stringify(user));
    localStorage.setItem('cc_session', JSON.stringify(data.session));

    return user;
  },

  /**
   * Sign out
   */
  async signOut() {
    try {
      const session = authService.getSession();
      if (session?.access_token) {
        await fetch(`${API_BASE}/auth/logout`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.access_token}`,
          },
        });
      }
    } catch {
      // Logout even if API fails
    }
    localStorage.removeItem('cc_user');
    localStorage.removeItem('cc_session');
    // Also clean old keys
    localStorage.removeItem('dashboardUser');
  },

  /**
   * Get the currently stored user
   */
  getUser() {
    try {
      return JSON.parse(localStorage.getItem('cc_user')) || JSON.parse(localStorage.getItem('dashboardUser'));
    } catch {
      return null;
    }
  },

  /**
   * Get stored session (for Authorization header)
   */
  getSession() {
    try {
      return JSON.parse(localStorage.getItem('cc_session'));
    } catch {
      return null;
    }
  },

  /**
   * Check if user is authenticated
   */
  isAuthenticated() {
    return !!authService.getUser();
  },

  /**
   * Update user profile locally
   */
  updateProfile(updates) {
    const user = authService.getUser();
    if (!user) return null;
    const updated = { ...user, ...updates };
    localStorage.setItem('cc_user', JSON.stringify(updated));
    return updated;
  },

  /**
   * Get auth header for API requests
   */
  getAuthHeader() {
    const session = authService.getSession();
    if (session?.access_token) {
      return { Authorization: `Bearer ${session.access_token}` };
    }
    return {};
  },
};
