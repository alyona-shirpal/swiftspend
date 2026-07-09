import React, { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { AuthForm } from '../../components/auth/AuthForm.tsx';
import { OAuthButtons } from '../../components/auth/OAuthButtons.tsx';
import { useAuth } from '../../hooks/useAuth';

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const { session, isLoading } = useAuth();

  // Already logged in — redirect to dashboard
  // (don't redirect while still loading, wait for auth to settle)
  if (!isLoading && session) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="bg-surface text-on-surface h-dvh min-h-[620px] sm:min-h-screen flex flex-col relative overflow-hidden">
      {/* Top Navigation Anchor */}
      <header className="flex justify-between items-center w-full px-5 py-4 sm:px-8 sm:py-10 relative z-10 shrink-0">
        <div className="font-headline font-black text-3xl tracking-tighter text-primary">
          Spend
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-5 pb-4 sm:px-6 sm:pb-20 relative z-10 min-h-0">
        <div className="w-full max-w-md">
          {/* Hero Typography */}
          <div className="mb-6 sm:mb-12">
            <h1 className="text-primary text-4xl sm:text-5xl font-extrabold tracking-tight mb-1 sm:mb-2 leading-none">
              Welcome <br/>Back.
            </h1>
            <p className="text-secondary font-body text-xs sm:text-sm max-w-[240px] leading-relaxed opacity-70">
              Access your digital ledger and track your financial evolution.
            </p>
          </div>

          <div className="space-y-5 sm:space-y-10">
            {error && (
              <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg">
                {error}
              </div>
            )}

            <AuthForm 
              type="login" 
              onSuccess={() => navigate('/', { replace: true })} 
            />

            <div className="mt-6 space-y-4 sm:mt-16 sm:space-y-8">
              <div className="flex items-center gap-4">
                <div className="h-[1px] flex-grow bg-surface-container-highest"></div>
                <span className="text-on-surface-variant font-label text-[10px] tracking-widest uppercase whitespace-nowrap">Or continue with</span>
                <div className="h-[1px] flex-grow bg-surface-container-highest"></div>
              </div>

              <OAuthButtons 
                onError={setError} 
                onSuccess={() => navigate('/', { replace: true })}
              />

              <div className="text-center pt-2 sm:pt-8">
                <p className="text-on-surface-variant font-body text-sm">
                  Don't have an account? 
                  <Link to="/signup" className="text-primary font-bold ml-1 hover:underline underline-offset-4">Sign Up</Link>
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Visual Ledger Accent */}
      <div className="fixed bottom-0 left-0 w-full overflow-hidden pointer-events-none opacity-10 sm:opacity-20 select-none z-0">
        <div className="flex justify-between items-baseline px-8 py-2">
          <span className="font-headline font-black text-[72px] sm:text-[120px] leading-none text-surface-container-highest tracking-tighter">€</span>
          <span className="font-headline font-black text-[48px] sm:text-[80px] leading-none text-surface-container-highest tracking-tighter">LEK</span>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
