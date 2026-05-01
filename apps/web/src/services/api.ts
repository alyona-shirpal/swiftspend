import axios from 'axios';
import { supabase } from './supabase.ts';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000',
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(async (config) => {
  // Development mode - skip auth if supabase is not available
  if (!supabase) {
    config.headers.Authorization = 'Bearer dev-token';
    return config;
  }
  
  const { data: { session } } = await supabase.auth.getSession();
  if (session?.access_token) {
    config.headers.Authorization = `Bearer ${session.access_token}`;
  } else if (config.headers.Authorization) {
    delete config.headers.Authorization;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    // Development mode - handle API errors gracefully
    if (!supabase) {
      console.warn('Development mode: API call failed - this is expected when backend is not running');
      return Promise.reject(error);
    }

    const status = error.response?.status;
    const code = error.response?.data?.code;

    if (status === 401 && code === 'INVALID_TOKEN') {
      const { data: { session } } = await supabase.auth.getSession();

      // Keep the user on the page if we still have a local session.
      // This avoids a redirect loop while we diagnose or recover API auth mismatches.
      if (!session) {
        await supabase.auth.signOut();

        if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
      }
    }

    return Promise.reject(error);
  }
);

export default api;
