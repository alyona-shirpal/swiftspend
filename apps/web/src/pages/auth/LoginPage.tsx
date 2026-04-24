import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthForm } from '../../components/auth/AuthForm.tsx';
import { OAuthButtons } from '../../components/auth/OAuthButtons.tsx';

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="bg-surface text-on-surface min-h-screen flex flex-col relative overflow-hidden">
      {/* Top Navigation Anchor */}
      <header className="flex justify-between items-center w-full px-8 py-10 relative z-10">
        <div className="font-headline font-black text-3xl tracking-tighter text-primary">
          Spend
        </div>
      </header>

      <main className="flex-grow flex items-center justify-center px-6 pb-20 relative z-10">
        <div className="w-full max-w-md">
          {/* Hero Typography */}
          <div className="mb-12">
            <h1 className="text-primary text-5xl font-extrabold tracking-tight mb-2 leading-none">
              Welcome <br/>Back.
            </h1>
            <p className="text-secondary font-body text-sm max-w-[240px] leading-relaxed opacity-70">
              Access your digital ledger and track your financial evolution.
            </p>
          </div>

          <div className="space-y-10">
            {error && (
              <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg">
                {error}
              </div>
            )}

            <AuthForm 
              type="login" 
              onSuccess={() => navigate('/')} 
            />

            <div className="mt-16 space-y-8">
              <div className="flex items-center gap-4">
                <div className="h-[1px] flex-grow bg-surface-container-highest"></div>
                <span className="text-on-surface-variant font-label text-[10px] tracking-widest uppercase whitespace-nowrap">Or continue with</span>
                <div className="h-[1px] flex-grow bg-surface-container-highest"></div>
              </div>

              <OAuthButtons 
                onError={setError} 
                onSuccess={() => navigate('/')}
              />

              <div className="text-center pt-8">
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
      <div className="fixed bottom-0 left-0 w-full overflow-hidden pointer-events-none opacity-20 select-none z-0">
        <div className="flex justify-between items-baseline px-8 py-2">
          <span className="font-headline font-black text-[120px] leading-none text-surface-container-highest tracking-tighter">€</span>
          <span className="font-headline font-black text-[80px] leading-none text-surface-container-highest tracking-tighter">LEK</span>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
