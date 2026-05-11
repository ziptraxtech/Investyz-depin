import React, { useMemo, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { SignIn, SignUp, SignedIn, SignedOut } from '@clerk/clerk-react';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';

const getClerkPublishableKey = () => {
  const buildKey =
    process.env.REACT_APP_CLERK_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ||
    process.env.CLERK_PUBLISHABLE_KEY;

  if (buildKey) {
    return buildKey;
  }

  if (typeof window !== 'undefined') {
    return (
      window.REACT_APP_CLERK_PUBLISHABLE_KEY ||
      window.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ||
      window.CLERK_PUBLISHABLE_KEY ||
      ''
    );
  }

  return '';
};

const CLERK_PUBLISHABLE_KEY = getClerkPublishableKey();
const CLERK_ENABLED = Boolean(CLERK_PUBLISHABLE_KEY);

const clerkAppearance = {
  elements: {
    card: 'shadow-none bg-transparent border-0',
    rootBox: 'w-full',
    headerTitle: "font-['Outfit'] text-slate-950 dark:text-white",
    headerSubtitle: 'text-slate-600 dark:text-slate-300',
    socialButtonsBlockButton:
      'rounded-full border border-cyan-300/80 bg-white text-slate-900 hover:bg-cyan-50 dark:border-teal-800/70 dark:bg-[#04202a] dark:text-white dark:hover:bg-[#06303d]',
    formButtonPrimary:
      'rounded-full bg-primary text-primary-foreground hover:opacity-95 shadow-none',
    formFieldInput:
      'h-11 rounded-xl border-cyan-300/80 bg-white text-slate-900 dark:border-teal-900/70 dark:bg-[#04202a] dark:text-white',
    formFieldInputShowPasswordButton: 'text-slate-500 dark:text-slate-300',
    otpCodeFieldInput:
      'h-12 w-12 rounded-xl border border-cyan-300/80 bg-white text-slate-900 dark:border-teal-900/70 dark:bg-[#04202a] dark:text-white',
    footerActionLink: 'text-primary hover:text-primary/80',
    identityPreviewEditButton: 'text-primary hover:text-primary/80',
    formFieldLabel: 'text-teal-700 dark:text-teal-100',
    dividerLine: 'bg-cyan-200 dark:bg-teal-900/60',
    dividerText: 'text-teal-700 dark:text-teal-100/90',
  },
};

const AuthPage = ({ mode = 'login' }) => {
  const isSignup = mode === 'signup';
  const location = useLocation();
  const { isAuthenticated, signupWithEmail, loginWithEmail } = useAuth();
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '' });
  const [loading, setLoading] = useState(false);
  const searchParams = useMemo(() => new URLSearchParams(location.search), [location.search]);
  const redirectTo = searchParams.get('redirect') || '/dashboard';
  const imageUrl = useMemo(() => (
    isSignup
      ? 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?crop=entropy&cs=srgb&fm=jpg&q=85'
      : 'https://images.unsplash.com/photo-1515879218367-8466d910aaa4?crop=entropy&cs=srgb&fm=jpg&q=85'
  ), [isSignup]);

  const handleLocalAuth = async (event) => {
    event.preventDefault();
    setLoading(true);
    try {
      if (isSignup) {
        await signupWithEmail(form);
        toast.success('Account created. Verify email and phone to start KYC.');
      } else {
        await loginWithEmail(form);
        toast.success('Welcome back');
      }
      window.location.assign(redirectTo);
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {!CLERK_ENABLED && (
        <div className="min-h-screen pt-24 pb-10 px-4 bg-gradient-to-br from-[#dceceb] via-[#ebf5f4] to-[#d8ebef] dark:from-[#031117] dark:via-[#04131b] dark:to-[#031117]">
          {isAuthenticated && <Navigate to={redirectTo} replace />}
          <div className="max-w-5xl mx-auto rounded-3xl overflow-hidden border border-cyan-200/80 bg-[#f7fbfb]/97 shadow-2xl dark:border-teal-900/40 dark:bg-[#041922]">
            <div className="grid md:grid-cols-2 min-h-[640px]">
              <section className="p-8 md:p-12 flex items-center">
                <div className="w-full">
                  <div className="mb-8">
                    <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">
                      Investor Access
                    </p>
                    <h1 className="mt-3 text-3xl md:text-4xl font-semibold font-['Outfit']">
                      {isSignup ? 'Create your Investyz account' : 'Sign in to Investyz'}
                    </h1>
                    <p className="mt-3 text-muted-foreground">
                      KYC, wallet, and investment access stay protected behind your account.
                    </p>
                  </div>

                  <form onSubmit={handleLocalAuth} className="space-y-4">
                    {isSignup && (
                      <>
                        <div className="space-y-2">
                          <Label htmlFor="name">Full name</Label>
                          <Input id="name" autoComplete="name" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="phone">Phone</Label>
                          <Input
                            id="phone"
                            type="tel"
                            inputMode="numeric"
                            autoComplete="tel"
                            value={form.phone}
                            onChange={(event) => setForm({ ...form, phone: event.target.value.replace(/\D/g, '').slice(0, 10) })}
                            required
                          />
                        </div>
                      </>
                    )}
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input id="email" type="email" autoComplete="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="password">Password</Label>
                      <Input
                        id="password"
                        type="password"
                        minLength={8}
                        autoComplete={isSignup ? 'new-password' : 'current-password'}
                        value={form.password}
                        onChange={(event) => setForm({ ...form, password: event.target.value })}
                        required
                      />
                    </div>
                    <Button type="submit" className="w-full rounded-full py-6" disabled={loading}>
                      {loading ? 'Please wait...' : isSignup ? 'Create account' : 'Sign in'}
                    </Button>
                  </form>

                  <Button
                    variant="link"
                    className="mt-4 px-0"
                    onClick={() => window.location.assign(isSignup ? `/login?redirect=${encodeURIComponent(redirectTo)}` : `/signup?redirect=${encodeURIComponent(redirectTo)}`)}
                  >
                    {isSignup ? 'Already have an account? Sign in' : 'New here? Create an account'}
                  </Button>
                </div>
              </section>
              <aside className="hidden md:block relative">
                <div
                  className="absolute inset-0"
                  style={{
                    backgroundImage: `url(${imageUrl})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-br from-black/30 to-black/55" />
                <Card className="absolute bottom-8 left-8 right-8 border-white/20 bg-white/10 text-white backdrop-blur-xl">
                  <CardContent className="p-6">
                    <p className="text-lg font-semibold">KYC-first investing</p>
                    <p className="mt-2 text-sm text-white/80">
                      Verify email, phone, PAN, or DigiLocker before accessing EV charging infrastructure deals.
                    </p>
                  </CardContent>
                </Card>
              </aside>
            </div>
          </div>
        </div>
      )}
      {CLERK_ENABLED && (
        <>
      <SignedIn>
        <Navigate to="/dashboard" replace />
      </SignedIn>
      <SignedOut>
        <div className="min-h-screen pt-24 pb-10 px-4 bg-gradient-to-br from-[#dceceb] via-[#ebf5f4] to-[#d8ebef] dark:from-[#031117] dark:via-[#04131b] dark:to-[#031117]">
          <div className="max-w-6xl mx-auto rounded-3xl overflow-hidden border border-cyan-200/80 bg-[#f7fbfb]/97 shadow-2xl dark:border-teal-900/40 dark:bg-[#041922]">
            <div className="grid md:grid-cols-2 min-h-[680px]">
              <section className="p-8 md:p-12 flex items-center justify-center">
                <div className="w-full max-w-md">
                  {isSignup ? (
                    <SignUp
                      routing="path"
                      path="/signup"
                      signInUrl={`/login?redirect=${encodeURIComponent(redirectTo)}`}
                      forceRedirectUrl={redirectTo}
                      fallbackRedirectUrl={redirectTo}
                      appearance={clerkAppearance}
                    />
                  ) : (
                    <SignIn
                      routing="path"
                      path="/login"
                      signUpUrl={`/signup?redirect=${encodeURIComponent(redirectTo)}`}
                      forceRedirectUrl={redirectTo}
                      fallbackRedirectUrl={redirectTo}
                      appearance={clerkAppearance}
                    />
                  )}
                </div>
              </section>

              <aside className="hidden md:block relative">
                <div
                  className="absolute inset-0"
                  style={{
                    backgroundImage: `url(${imageUrl})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-br from-black/35 to-black/55" />
              </aside>
            </div>
          </div>
        </div>
      </SignedOut>
        </>
      )}
    </>
  );
};

export default AuthPage;
