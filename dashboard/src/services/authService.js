import { supabase, isSupabaseConfigured } from './supabaseClient';

const DEMO_MODE = !isSupabaseConfigured;

// Demo credentials when Supabase is not configured
const DEMO_USERS = {
  'municipal@civicconnect.com': { password: 'admin123', role: 'Municipal Staff', name: 'Shaleen Jain', department: 'Electricity' },
  'ngo@civicconnect.com':       { password: 'admin123', role: 'NGO',             name: 'NGO Admin',    department: 'Sanitation'   },
};

export const authService = {
  /**
   * Sign in — uses Supabase when configured, otherwise falls back to demo mode.
   */
  async signIn(email, password, role) {
    if (DEMO_MODE) {
      return authService._demoSignIn(email, password, role);
    }
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw new Error(error.message);
    const user = {
      id: data.user.id,
      email: data.user.email,
      name: data.user.user_metadata?.name || email.split('@')[0],
      role: data.user.user_metadata?.role || role,
      department: data.user.user_metadata?.department || 'General',
    };
    localStorage.setItem('dashboardUser', JSON.stringify(user));
    return user;
  },

  /**
   * Sign up (Supabase only)
   */
  async signUp(email, password, metadata) {
    if (DEMO_MODE) throw new Error('Sign-up is not available in demo mode');
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: metadata },
    });
    if (error) throw new Error(error.message);
    return data;
  },

  /**
   * Sign out
   */
  async signOut() {
    if (!DEMO_MODE) await supabase.auth.signOut();
    localStorage.removeItem('dashboardUser');
  },

  /**
   * Get the currently stored user
   */
  getUser() {
    try {
      return JSON.parse(localStorage.getItem('dashboardUser'));
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
   * Update user profile
   */
  updateProfile(updates) {
    const user = authService.getUser();
    if (!user) return null;
    const updated = { ...user, ...updates };
    localStorage.setItem('dashboardUser', JSON.stringify(updated));
    return updated;
  },

  /* ---- private demo helpers ---- */
  _demoSignIn(email, password, role) {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const demo = DEMO_USERS[email];
        if (!demo || demo.password !== password) {
          reject(new Error('Invalid email or password. Try municipal@civicconnect.com / admin123'));
          return;
        }
        const expectedRole = role === 'NGO' ? 'NGO' : 'Municipal Staff';
        if (demo.role !== expectedRole) {
          reject(new Error(`This account is registered as ${demo.role}`));
          return;
        }
        const user = { id: 'demo-' + Date.now(), email, name: demo.name, role: demo.role, department: demo.department, phone: '+91 98765 43210' };
        localStorage.setItem('dashboardUser', JSON.stringify(user));
        resolve(user);
      }, 800);
    });
  },
};
