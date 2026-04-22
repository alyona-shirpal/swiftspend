import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { supabase } from '../../services/supabase';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';

const signupSchema = z.object({
  fullName: z.string().min(2, 'Full name is required'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type SignupFormValues = z.infer<typeof signupSchema>;

const SignUpPage: React.FC = () => {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
  });

  const onSubmit = async (data: SignupFormValues) => {
    setIsLoading(true);
    setError(null);
    try {
      const { error } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            full_name: data.fullName,
          },
        },
      });

      if (error) throw error;
      navigate('/');
    } catch (err: any) {
      setError(err.message);
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
    <div className="bg-surface text-on-surface min-h-screen flex flex-col">
      <header className="flex items-center justify-between px-6 py-8 w-full sticky top-0 z-50 bg-surface">
        <div className="font-headline font-black text-primary text-3xl tracking-tighter">Spend</div>
        <Link to="#" className="text-secondary font-label text-[10px] uppercase tracking-widest hover:text-primary transition-colors">
          Support
        </Link>
      </header>

      <main className="flex-grow flex flex-col items-center justify-center px-6 pb-20 max-w-2xl mx-auto w-full">
        <section className="w-full mb-12 text-left">
          <h1 className="font-display font-extrabold text-primary text-5xl md:text-6xl tracking-tight leading-none mb-4">
            Join the <br />Evolution.
          </h1>
          <p className="font-body text-on-surface-variant text-lg max-w-sm">
            Create your digital ledger and start tracking today.
          </p>
        </section>

        <form onSubmit={handleSubmit(onSubmit)} className="w-full space-y-10 mb-12">
          {error && (
            <div className="p-4 bg-error-container text-on-error-container rounded-lg text-xs font-bold uppercase tracking-wider">
              {error}
            </div>
          )}

          <div className="space-y-10">
            <Input
              label="Full Name"
              placeholder="Enter your name"
              {...register('fullName')}
              error={errors.fullName?.message}
            />

            <Input
              label="Email Address"
              placeholder="name@domain.com"
              type="email"
              {...register('email')}
              error={errors.email?.message}
            />

            <Input
              label="Create Password"
              placeholder="Min. 8 characters"
              type="password"
              {...register('password')}
              error={errors.password?.message}
            />

            <Input
              label="Confirm Password"
              placeholder="Min. 8 characters"
              type="password"
              {...register('confirmPassword')}
              error={errors.confirmPassword?.message}
            />
          </div>

          <Button
            type="submit"
            size="xl"
            className="w-full mt-6"
            isLoading={isLoading}
          >
            CREATE ACCOUNT
          </Button>
        </form>

        <div className="w-full flex items-center gap-4 mb-8">
          <div className="h-[1px] flex-grow bg-surface-container-high"></div>
          <span className="font-label text-[10px] uppercase tracking-widest text-on-surface-variant text-center px-2">Or continue with</span>
          <div className="h-[1px] flex-grow bg-surface-container-high"></div>
        </div>

        <div className="w-full grid grid-cols-2 gap-4 mb-16">
          <Button variant="surface" onClick={signInWithGoogle} className="h-14 gap-2">
            <svg height="18" viewBox="0 0 18 18" width="18">
              <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z" fill="#4285F4"></path>
              <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z" fill="#34A853"></path>
              <path d="M3.964 10.711c-.18-.54-.282-1.117-.282-1.711 0-.594.102-1.17.282-1.711V4.957H.957C.347 6.173 0 7.548 0 9s.347 2.827.957 4.043l3.007-2.332z" fill="#FBBC05"></path>
              <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.957l3.007 2.332c.708-2.127 2.692-3.71 5.036-3.71z" fill="#EA4335"></path>
            </svg>
            Google
          </Button>
          <Button variant="surface" className="h-14 gap-2">
            <svg className="text-primary" fill="currentColor" height="19" viewBox="0 0 16 19" width="16">
              <path d="M13.805 11.026c-.023-2.613 2.13-3.864 2.224-3.921-1.21-1.77-3.097-2.011-3.771-2.04-1.611-.164-3.144.95-3.96 0.95-.815 0-2.088-.931-3.426-.903-1.76.027-3.385 1.027-4.29 2.599-1.826 3.17-.468 7.857 1.31 10.428 0.869 1.256 1.899 2.664 3.256 2.614 1.306-.05 1.801-.84 3.379-.84 1.577 0 2.023.84 3.398.814 1.401-.025 2.298-1.275 3.161-2.531 0.996-1.455 1.407-2.863 1.429-2.936-.03-.013-2.753-1.054-2.78-4.234zM11.385 3.376c0.722-.875 1.209-2.091 1.076-3.306-1.044.043-2.308.697-3.057 1.571-.672.775-1.261 2.016-1.103 3.205 1.166.09 2.361-.595 3.084-1.47z"></path>
            </svg>
            Apple
          </Button>
        </div>

        <div className="w-full text-center">
          <p className="font-body text-sm text-on-surface-variant">
            Already have an account? 
            <Link to="/login" className="text-primary font-bold hover:underline underline-offset-4 decoration-tertiary">Sign In</Link>
          </p>
        </div>
      </main>

      <div className="fixed top-0 right-0 -z-10 w-1/3 h-full overflow-hidden opacity-10 pointer-events-none">
        <div className="absolute top-1/4 right-0 transform translate-x-1/2">
          <div className="w-[800px] h-[800px] rounded-full bg-gradient-to-br from-surface-container-highest to-surface"></div>
        </div>
      </div>
    </div>
  );
};

export default SignUpPage;
