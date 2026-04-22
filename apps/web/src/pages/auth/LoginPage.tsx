import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { supabase } from '../../services/supabase';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormValues) => {
    setIsLoading(true);
    setError(null);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });

      if (error) throw error;
      navigate('/');
    } catch (err: any) {
      setError(err.message || 'Invalid credentials');
    } finally {
      setIsLoading(false);
    }
  };

  const signInWithGoogle = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin,
      },
    });
  };

  return (
    <div className="bg-surface min-h-screen flex flex-col">
      <header className="flex justify-between items-center w-full px-8 py-10">
        <div className="font-headline font-black text-3xl tracking-tighter text-primary">
          Spend
        </div>
      </header>

      <main className="flex-grow flex items-center justify-center px-6 pb-20">
        <div className="w-full max-w-md">
          <div className="mb-12">
            <h1 className="text-primary text-5xl font-extrabold tracking-tight mb-2 leading-none">
              Welcome <br />Back.
            </h1>
            <p className="text-secondary font-body text-sm max-w-[240px] leading-relaxed opacity-70">
              Access your digital ledger and track your financial evolution.
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-10">
            {error && (
              <div className="p-4 bg-error-container text-on-error-container rounded-lg text-xs font-bold uppercase tracking-wider">
                {error}
              </div>
            )}

            <div className="space-y-8">
              <Input
                label="Email Address"
                placeholder="name@domain.com"
                type="email"
                {...register('email')}
                error={errors.email?.message}
              />

              <div className="space-y-2">
                <div className="flex justify-between items-end">
                  <label className="block text-on-surface-variant font-label text-[10px] font-bold tracking-[0.15em] uppercase">
                    Security Code
                  </label>
                  <Link to="#" className="text-secondary font-label text-[10px] font-bold tracking-tight hover:text-primary transition-colors">
                    Forgot Password?
                  </Link>
                </div>
                <Input
                  placeholder="••••••••"
                  type="password"
                  {...register('password')}
                  error={errors.password?.message}
                />
              </div>
            </div>

            <Button
              type="submit"
              size="xl"
              className="w-full"
              isLoading={isLoading}
            >
              Enter Vault
              {!isLoading && <span className="material-symbols-outlined text-sm ml-2">arrow_forward</span>}
            </Button>
          </form>

          <div className="mt-16 space-y-8">
            <div className="flex items-center gap-4">
              <div className="h-[1px] flex-grow bg-surface-container-highest"></div>
              <span className="text-on-surface-variant font-label text-[10px] tracking-widest uppercase text-center">Or continue with</span>
              <div className="h-[1px] flex-grow bg-surface-container-highest"></div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Button
                variant="outline"
                onClick={signInWithGoogle}
                className="gap-3 h-14"
              >
                <svg className="w-5 h-5 font-headline" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"></path>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"></path>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"></path>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 12-4.53z" fill="#EA4335"></path>
                </svg>
                Google
              </Button>
              <Button
                variant="outline"
                className="gap-3 h-14"
              >
                <svg className="w-5 h-5 fill-primary" viewBox="0 0 24 24">
                  <path d="M17.05 20.28c-.96.95-2.2 1.44-3.72 1.44-1.41 0-2.58-.45-3.52-1.35-.95-.91-1.42-1.98-1.42-3.21 0-1.28.51-2.4 1.54-3.34 1.03-.94 2.31-1.41 3.84-1.41 1.34 0 2.5.42 3.47 1.25V13.6h.05c-.06-1.12-.48-2.04-1.26-2.77-.78-.73-1.74-1.09-2.88-1.09-1.41 0-2.5.5-3.27 1.5l-1.35-.85c1.11-1.58 2.64-2.37 4.59-2.37 1.69 0 3.06.53 4.12 1.59 1.05 1.06 1.58 2.45 1.58 4.17V21h-1.63v-1.63h-.05c-.26.54-.66.99-1.19 1.34s-1.13.57-1.81.57zm-.05-4.47c-.67-.62-1.46-.93-2.37-.93-.97 0-1.79.31-2.45.94s-.99 1.42-.99 2.37c0 .91.31 1.67.92 2.27.61.6 1.36.91 2.24.91 1.03 0 1.88-.34 2.55-1.03.67-.69 1-1.5 1-2.42v-2.11zM14.65 0C16.89 0 18.72.63 20.14 1.9s2.13 3.01 2.13 5.23v13.87h-1.63V7.13c0-1.73-.65-3.15-1.94-4.26S15.93.98 14 1.25V0zm-5.32 0C7.09 0 5.26.63 3.84 1.9S1.71 4.91 1.71 7.13v13.87h1.63V7.13c0-1.73.65-3.15 1.94-4.26S8.06.98 9.99 1.25V0z"></path>
                </svg>
                Apple
              </Button>
            </div>

            <div className="text-center pt-8">
              <p className="text-on-surface-variant font-body text-sm">
                Don't have an account? 
                <Link to="/signup" className="text-primary font-bold ml-1 hover:underline underline-offset-4">Sign Up</Link>
              </p>
            </div>
          </div>
        </div>
      </main>

      <div className="fixed bottom-0 left-0 w-full overflow-hidden pointer-events-none opacity-20 select-none">
        <div className="flex justify-between items-baseline px-8 py-2">
          <span className="font-headline font-black text-[120px] leading-none text-surface-container-highest tracking-tighter">€</span>
          <span className="font-headline font-black text-[80px] leading-none text-surface-container-highest tracking-tighter">LEK</span>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
