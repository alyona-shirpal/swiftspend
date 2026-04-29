import React, { useState } from 'react';
import { supabase } from '../../services/supabase.ts';

interface AuthFormProps {
  type: 'login' | 'signup';
  onSuccess?: () => void;
}

export const AuthForm: React.FC<AuthFormProps> = ({ type }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      if (type === 'signup') {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName,
            },
          },
        });
        if (error) throw error;

        if (data.session) {
          const { data: sessionData } = await supabase.auth.getSession();
          if (!sessionData.session) {
            throw new Error('Account created but no active session was found.');
          }

          window.location.assign('/');
          return;
        } else {
          setSuccessMessage('Account created. Please check your email to confirm your account before signing in.');
        }
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;

        if (!data.session) {
          throw new Error('Sign-in completed but no active session was created.');
        }

        const { data: sessionData } = await supabase.auth.getSession();
        if (!sessionData.session) {
          throw new Error('Signed in but could not restore the active session.');
        }

        window.location.assign('/');
        return;
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError(String(err));
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full space-y-10">
      <div className="space-y-8">
        {type === 'signup' && (
          <div className="group">
            <label className="block font-label text-[10px] font-semibold uppercase tracking-widest text-on-surface-variant mb-2">
              Full Name
            </label>
            <div className="editorial-focus border-b-2 border-surface-container-highest transition-all duration-300">
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full py-3 bg-transparent border-none focus:ring-0 text-on-surface placeholder:text-surface-variant font-body text-base"
                placeholder="Enter your name"
                required
              />
            </div>
          </div>
        )}

        <div className="group">
          <label className="block font-label text-[10px] font-semibold uppercase tracking-widest text-on-surface-variant mb-2">
            Email Address
          </label>
          <div className="editorial-focus border-b-2 border-surface-container-highest transition-all duration-300">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full py-3 bg-transparent border-none focus:ring-0 text-on-surface placeholder:text-surface-variant font-body text-base"
              placeholder="name@domain.com"
              required
            />
          </div>
        </div>

        <div className="group">
          <div className="flex justify-between items-end mb-2">
            <label className="block font-label text-[10px] font-semibold uppercase tracking-widest text-on-surface-variant">
              {type === 'signup' ? 'Create Password' : 'Security Code'}
            </label>
            {type === 'login' && (
              <a href="#" className="text-secondary font-label text-[10px] font-bold tracking-tight hover:text-primary transition-colors">
                Forgot Password?
              </a>
            )}
          </div>
          <div className="editorial-focus border-b-2 border-surface-container-highest transition-all duration-300 relative flex items-center">
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full py-3 pr-10 bg-transparent border-none focus:ring-0 text-on-surface placeholder:text-surface-variant font-body text-base"
              placeholder={type === 'signup' ? 'Min. 8 characters' : 'Enter password'}
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 text-on-surface-variant hover:text-primary transition-colors focus:outline-none"
            >
              <span className="material-symbols-outlined text-xl">
                {showPassword ? 'visibility_off' : 'visibility'}
              </span>
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="text-sm text-error bg-error-container/20 p-3 rounded-lg border border-error-container">
          {error}
        </div>
      )}

      {successMessage && (
        <div className="text-sm text-green-700 bg-green-50 p-3 rounded-lg border border-green-200">
          {successMessage}
        </div>
      )}

      <div className="pt-4">
        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-5 bg-primary text-on-primary font-headline font-bold text-sm tracking-widest uppercase rounded-lg hover:opacity-90 active:scale-[0.98] transition-all flex items-center justify-center gap-3 disabled:opacity-50"
        >
          {isLoading ? 'Processing...' : type === 'signup' ? 'Create Account' : 'Sign In'}
          <span className="material-symbols-outlined text-sm">arrow_forward</span>
        </button>
      </div>
    </form>
  );
};
