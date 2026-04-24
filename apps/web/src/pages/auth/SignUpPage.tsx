import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthForm } from '../../components/auth/AuthForm.tsx';
import { OAuthButtons } from '../../components/auth/OAuthButtons.tsx';

const SignUpPage: React.FC = () => {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="bg-surface text-on-surface font-body min-h-screen flex flex-col relative overflow-hidden">
      {/* TopAppBar */}
      <header className="flex items-center justify-between px-6 py-8 w-full sticky top-0 z-50 bg-surface">
        <div className="font-headline font-black text-primary text-3xl tracking-tighter">Spend</div>
      </header>

      <main className="flex-grow flex items-center justify-center px-6 pb-20 relative z-10">
        <div className="w-full max-w-md">
          {/* Hero Section */}
          <section className="mb-12">
            <h1 className="font-display font-extrabold text-primary text-5xl md:text-6xl tracking-tight leading-none mb-4">
              Join the <br/>Evolution.
            </h1>
            <p className="font-body text-on-surface-variant text-lg max-w-sm">
              Create your digital ledger and start tracking today.
            </p>
          </section>

          <div className="space-y-10">
            {error && (
              <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg">
                {error}
              </div>
            )}

            <AuthForm 
              type="signup" 
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
                <p className="font-body text-sm text-on-surface-variant">
                  Already have an account? 
                  <Link to="/login" className="text-primary font-bold ml-1 hover:underline underline-offset-4 decoration-tertiary">Sign In</Link>
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Content-Focused Backdrop Decoration */}
      <div className="fixed top-0 right-0 -z-10 w-1/3 h-full overflow-hidden opacity-10 pointer-events-none">
        <div className="absolute top-1/4 right-0 transform translate-x-1/2">
          <div className="w-[800px] h-[800px] rounded-full bg-gradient-to-br from-surface-container-highest to-surface"></div>
        </div>
      </div>
      
      {/* Responsive Decorative Element */}
      <div className="hidden lg:block fixed left-12 bottom-12">
        <div className="w-32 h-32 bg-surface-container-lowest p-6 rounded-lg shadow-sm flex flex-col justify-between">
          <span className="material-symbols-outlined text-on-tertiary-container text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>verified_user</span>
          <span className="font-label text-[8px] font-bold uppercase tracking-tighter text-on-surface-variant leading-tight">Encrypted Ledger Technology</span>
        </div>
      </div>
    </div>
  );
};

export default SignUpPage;
