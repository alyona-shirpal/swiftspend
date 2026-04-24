export const getAuthErrorMessage = (error: unknown): string => {
  if (!error || typeof error !== 'object') return 'An unknown error occurred';

  const err = error as { message?: string; code?: string };
  const message = err.message || '';
  const code = err.code || '';

  // Supabase specific error mappings
  if (message.includes('Invalid login credentials')) {
    return 'Invalid email or password. Please try again.';
  }
  
  if (message.includes('User already registered')) {
    return 'An account with this email already exists.';
  }

  if (message.includes('Password should be at least')) {
    return 'Password must be at least 6 characters long.';
  }

  if (message.includes('Email not confirmed')) {
    return 'Please confirm your email address before logging in.';
  }

  if (code === 'over_confirmation_rate_limit') {
    return 'Too many requests. Please try again later.';
  }

  return message || 'Authentication failed. Please try again.';
};
