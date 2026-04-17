import React, { useMemo } from 'react';
import { Navigate } from 'react-router-dom';
import { SignIn, SignUp, SignedIn, SignedOut } from '@clerk/clerk-react';
import { Card, CardContent } from '../components/ui/card';

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
  const imageUrl = useMemo(() => (
    isSignup
      ? 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?crop=entropy&cs=srgb&fm=jpg&q=85'
      : 'https://images.unsplash.com/photo-1515879218367-8466d910aaa4?crop=entropy&cs=srgb&fm=jpg&q=85'
  ), [isSignup]);

  return (
    <>
      {!CLERK_ENABLED && (
        <div className="min-h-screen pt-24 pb-10 px-4 bg-gradient-to-br from-[#dceceb] via-[#ebf5f4] to-[#d8ebef] dark:from-[#031117] dark:via-[#04131b] dark:to-[#031117]">
          <div className="max-w-3xl mx-auto">
            <Card className="border-border/60 bg-card/95">
              <CardContent className="p-8 md:p-10">
                <h1 className="text-3xl md:text-4xl font-semibold font-['Outfit'] mb-4">
                  Sign in is temporarily unavailable
                </h1>
                <p className="text-muted-foreground leading-relaxed">
                  Authentication is not configured for this deployment yet. The rest of the site
                  remains available, and sign in will work once the Clerk environment variables are
                  added to the hosting project.
                </p>
              </CardContent>
            </Card>
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
                      signInUrl="/login"
                      forceRedirectUrl="/dashboard"
                      fallbackRedirectUrl="/dashboard"
                      appearance={clerkAppearance}
                    />
                  ) : (
                    <SignIn
                      routing="path"
                      path="/login"
                      signUpUrl="/signup"
                      forceRedirectUrl="/dashboard"
                      fallbackRedirectUrl="/dashboard"
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
