import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Mail, Lock, User, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';

const GOOGLE_GSI_SRC = 'https://accounts.google.com/gsi/client';
const GOOGLE_CLIENT_ID = process.env.REACT_APP_GOOGLE_CLIENT_ID;

const AuthPage = ({ mode = 'login' }) => {
  const isSignup = mode === 'signup';
  const navigate = useNavigate();
  const { loginWithEmail, signupWithEmail, loginWithGoogle } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [googleReady, setGoogleReady] = useState(false);
  const googleButtonRef = useRef(null);

  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const imageUrl = useMemo(() => (
    isSignup
      ? 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?crop=entropy&cs=srgb&fm=jpg&q=85'
      : 'https://images.unsplash.com/photo-1515879218367-8466d910aaa4?crop=entropy&cs=srgb&fm=jpg&q=85'
  ), [isSignup]);

  const title = isSignup ? 'Welcome!' : 'Welcome Back';
  const subtitle = isSignup ? 'Create your account' : 'Login to your account';

  useEffect(() => {
    if (window.google?.accounts?.id) {
      setGoogleReady(true);
      return;
    }

    const script = document.createElement('script');
    script.src = GOOGLE_GSI_SRC;
    script.async = true;
    script.defer = true;
    script.onload = () => setGoogleReady(true);
    script.onerror = () => {
      toast.error('Failed to load Google Sign-In');
      setGoogleReady(false);
    };
    document.head.appendChild(script);
  }, []);

  useEffect(() => {
    if (!googleReady || !GOOGLE_CLIENT_ID || !googleButtonRef.current || !window.google?.accounts?.id) {
      return;
    }

    window.google.accounts.id.initialize({
      client_id: GOOGLE_CLIENT_ID,
      callback: async (response) => {
        if (!response?.credential) return;
        try {
          setSubmitting(true);
          await loginWithGoogle(response.credential);
          toast.success(isSignup ? 'Signup successful' : 'Login successful');
          navigate('/dashboard');
        } catch (error) {
          toast.error(error.message || 'Google authentication failed');
        } finally {
          setSubmitting(false);
        }
      },
    });

    googleButtonRef.current.innerHTML = '';
    window.google.accounts.id.renderButton(googleButtonRef.current, {
      theme: 'outline',
      size: 'large',
      shape: 'pill',
      text: isSignup ? 'signup_with' : 'continue_with',
      width: 360,
    });
  }, [googleReady, isSignup, loginWithGoogle, navigate]);

  const updateField = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const onSubmit = async (event) => {
    event.preventDefault();

    if (!form.email || !form.password) {
      toast.error('Email and password are required');
      return;
    }
    if (isSignup && !form.name.trim()) {
      toast.error('Name is required');
      return;
    }
    if (isSignup && form.password.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }
    if (isSignup && form.password !== form.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    try {
      setSubmitting(true);
      if (isSignup) {
        await signupWithEmail({
          name: form.name.trim(),
          email: form.email.trim(),
          password: form.password,
        });
      } else {
        await loginWithEmail({
          email: form.email.trim(),
          password: form.password,
        });
      }
      toast.success(isSignup ? 'Signup successful' : 'Login successful');
      navigate('/dashboard');
    } catch (error) {
      toast.error(error.message || 'Authentication failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogleUnavailable = () => {
    toast.error('Google Sign-In is not configured yet.');
  };

  return (
    <div className="min-h-screen pt-24 pb-10 px-4 bg-[#031117]">
      <div className="max-w-6xl mx-auto rounded-3xl overflow-hidden border border-teal-900/40 bg-[#041922] shadow-2xl">
        <div className="grid md:grid-cols-2 min-h-[680px]">
          <section className="p-8 md:p-12 text-slate-100">
            <h1 className="text-4xl font-bold font-['Outfit']">{title}</h1>
            <p className="text-2xl text-teal-100/90 mt-2">{subtitle}</p>

            <div className="mt-8 rounded-2xl border border-teal-900/50 bg-[#052430] p-6">
              <p className="text-center text-lg text-teal-100 mb-5">
                Continue with Google
              </p>
              {GOOGLE_CLIENT_ID ? (
                <>
                  <div className="flex justify-center" ref={googleButtonRef} />
                  {!googleReady && (
                    <Button
                      type="button"
                      variant="outline"
                      disabled
                      className="w-full h-11 rounded-full border-teal-800/70 bg-[#04202a] text-white mt-2"
                    >
                      Loading Google Sign-In...
                    </Button>
                  )}
                </>
              ) : (
                <div className="space-y-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full h-11 rounded-full border-teal-800/70 bg-[#04202a] text-white hover:bg-[#06303d]"
                    onClick={handleGoogleUnavailable}
                  >
                    Continue with Google
                  </Button>
                  <p className="text-center text-xs text-teal-100/70">
                    Google Sign-In is temporarily unavailable.
                  </p>
                </div>
              )}
            </div>

            <div className="mt-8 flex items-center gap-4">
              <div className="h-px bg-teal-900/60 flex-1" />
              <span className="text-xl text-teal-100/90">Or</span>
              <div className="h-px bg-teal-900/60 flex-1" />
            </div>

            <form className="mt-6 space-y-4" onSubmit={onSubmit}>
              {isSignup && (
                <div>
                  <Label className="text-teal-100 mb-2 block">Full Name</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-2.5 h-4 w-4 text-teal-300" />
                    <Input
                      value={form.name}
                      onChange={(e) => updateField('name', e.target.value)}
                      placeholder="Enter your full name"
                      className="pl-10 h-11 border-teal-900/70 bg-[#04202a] text-white"
                    />
                  </div>
                </div>
              )}

              <div>
                <Label className="text-teal-100 mb-2 block">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 h-4 w-4 text-teal-300" />
                  <Input
                    type="email"
                    value={form.email}
                    onChange={(e) => updateField('email', e.target.value)}
                    placeholder="you@example.com"
                    className="pl-10 h-11 border-teal-900/70 bg-[#04202a] text-white"
                  />
                </div>
              </div>

              <div>
                <Label className="text-teal-100 mb-2 block">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-2.5 h-4 w-4 text-teal-300" />
                  <Input
                    type="password"
                    value={form.password}
                    onChange={(e) => updateField('password', e.target.value)}
                    placeholder={isSignup ? 'At least 8 characters' : 'Enter your password'}
                    className="pl-10 h-11 border-teal-900/70 bg-[#04202a] text-white"
                  />
                </div>
              </div>

              {isSignup && (
                <div>
                  <Label className="text-teal-100 mb-2 block">Confirm Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-2.5 h-4 w-4 text-teal-300" />
                    <Input
                      type="password"
                      value={form.confirmPassword}
                      onChange={(e) => updateField('confirmPassword', e.target.value)}
                      placeholder="Re-enter your password"
                      className="pl-10 h-11 border-teal-900/70 bg-[#04202a] text-white"
                    />
                  </div>
                </div>
              )}

              <Button
                type="submit"
                disabled={submitting}
                className="w-full h-11 rounded-full text-base font-semibold mt-2"
              >
                {submitting ? 'Please wait...' : (isSignup ? 'Create Account' : 'Login')}
                {!submitting && <ArrowRight className="h-4 w-4 ml-2" />}
              </Button>
            </form>

            <p className="mt-6 text-center text-teal-100/90">
              {isSignup ? 'Already have an account?' : "Don't have an account?"}{' '}
              <Link to={isSignup ? '/login' : '/signup'} className="underline font-semibold text-white">
                {isSignup ? 'Login' : 'Signup'}
              </Link>
            </p>
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
  );
};

export default AuthPage;
