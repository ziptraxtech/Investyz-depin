import React, { Suspense, lazy, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { ClerkProvider } from '@clerk/clerk-react';
import { Toaster } from './components/ui/sonner';
import { AuthProvider, useAuth } from './context/AuthContext';
import { WalletProvider } from './context/WalletContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import LandingPage from './pages/LandingPage';
import '@/App.css';

const AboutPage = lazy(() => import('./pages/AboutPage'));
const PrivacyPolicyPage = lazy(() => import('./pages/PrivacyPolicyPage'));
const TermsOfServicePage = lazy(() => import('./pages/TermsOfServicePage'));
const RiskDisclaimerPage = lazy(() => import('./pages/RiskDisclaimerPage'));
const BlogPage = lazy(() => import('./pages/BlogPage'));
const SegmentsPage = lazy(() => import('./pages/SegmentsPage'));
const SegmentDetailPage = lazy(() => import('./pages/SegmentDetailPage'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Profile = lazy(() => import('./pages/Profile'));
const AuthPage = lazy(() => import('./pages/AuthPage'));
const PaymentSuccess = lazy(() =>
  import('./pages/PaymentPages').then((module) => ({ default: module.PaymentSuccess }))
);
const PaymentCancel = lazy(() =>
  import('./pages/PaymentPages').then((module) => ({ default: module.PaymentCancel }))
);

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

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { user, loading, isAuthenticated } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center hero-gradient">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  // If user data passed from AuthCallback via location state, use it
  if (location.state?.user) {
    return children;
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/" replace />;
  }

  return children;
};

// App Router with Auth Detection
const AppRouter = () => {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center hero-gradient">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      }
    >
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/blog" element={<BlogPage />} />
        <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
        <Route path="/terms-of-service" element={<TermsOfServicePage />} />
        <Route path="/risk-disclaimer" element={<RiskDisclaimerPage />} />
        <Route path="/segments" element={<SegmentsPage />} />
        <Route path="/segments/:segmentId" element={<SegmentDetailPage />} />
        <Route path="/login/*" element={<AuthPage mode="login" />} />
        <Route path="/signup/*" element={<AuthPage mode="signup" />} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          }
        />
        <Route
          path="/payment/success"
          element={
            <ProtectedRoute>
              <PaymentSuccess />
            </ProtectedRoute>
          }
        />
        <Route
          path="/payment/cancel"
          element={
            <ProtectedRoute>
              <PaymentCancel />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
};

const ClerkRouterProvider = ({ children }) => {
  const navigate = useNavigate();

  const navigateWithClerk = (to, replace = false) => {
    if (!to) return;

    try {
      const resolvedUrl = new URL(to, window.location.origin);

      if (resolvedUrl.origin !== window.location.origin) {
        window.location.assign(resolvedUrl.toString());
        return;
      }

      navigate(`${resolvedUrl.pathname}${resolvedUrl.search}${resolvedUrl.hash}`, { replace });
    } catch (error) {
      navigate(to, { replace });
    }
  };

  if (!CLERK_ENABLED) {
    return children;
  }

  return (
    <ClerkProvider
      publishableKey={CLERK_PUBLISHABLE_KEY}
      routerPush={(to) => navigateWithClerk(to, false)}
      routerReplace={(to) => navigateWithClerk(to, true)}
      afterSignOutUrl="/"
    >
      {children}
    </ClerkProvider>
  );
};

const ScrollManager = () => {
  const location = useLocation();

  useEffect(() => {
    if (!location.hash) {
      window.scrollTo({ top: 0, behavior: 'auto' });
      return;
    }

    const targetId = location.hash.replace('#', '');
    const scrollToTarget = () => {
      const element = document.getElementById(targetId);
      if (!element) return;

      element.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    };

    const frame = window.requestAnimationFrame(scrollToTarget);
    return () => window.cancelAnimationFrame(frame);
  }, [location.pathname, location.hash]);

  return null;
};

// Layout Component
const Layout = ({ children }) => {
  const location = useLocation();
  const isAuthScreen = location.pathname.startsWith('/login') || location.pathname.startsWith('/signup');

  return (
    <div className="app-texture min-h-screen">
      <ScrollManager />
      {!isAuthScreen && <Navbar />}
      <main>{children}</main>
      {!isAuthScreen && <Footer />}
    </div>
  );
};

function App() {
  return (
    <BrowserRouter>
      <ClerkRouterProvider>
        <AuthProvider>
          <WalletProvider>
            <Layout>
              <AppRouter />
            </Layout>
            <Toaster position="top-right" richColors />
          </WalletProvider>
        </AuthProvider>
      </ClerkRouterProvider>
    </BrowserRouter>
  );
}

export default App;
