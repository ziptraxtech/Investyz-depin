import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Clock,
  Loader2,
  RotateCcw,
  ShieldCheck,
} from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Progress } from '../components/ui/progress';
import { useAuth } from '../context/AuthContext';
import apiClient, { unwrap } from '../lib/apiClient';
import { clearInvestmentIntent, getInvestmentIntent } from '../lib/investmentIntent';

const statusTone = {
  NOT_STARTED: 'secondary',
  PENDING: 'outline',
  VERIFIED: 'default',
  REJECTED: 'destructive',
};

const KycVerificationPage = () => {
  const { user, loading: authLoading, checkAuth } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [kycData, setKycData] = useState(null);
  const [busy, setBusy] = useState('');

  const callbackReference = searchParams.get('reference_id');
  const callbackStatus = searchParams.get('status');
  const callbackCode = searchParams.get('code');
  const callbackState = searchParams.get('state');
  const callbackError = searchParams.get('error');
  const investmentIntent = getInvestmentIntent();
  const returnTo = searchParams.get('return_to') || investmentIntent?.returnTo || '/segments';
  const investmentFlowActive = searchParams.get('intent') === 'invest' || Boolean(investmentIntent?.planId);
  const investmentAmount = Number(investmentIntent?.amount || 0);
  const investmentPlanId = investmentIntent?.planId || null;
  const userId = user?.user_id;
  const profileUser = kycData?.user || user;
  const kycProfile = kycData?.kyc || null;
  const mockKycActive = Boolean(kycData?.mock_mode);
  const currentKycStatus = profileUser?.kycStatus || 'NOT_STARTED';
  const digilockerAlreadyVerified = Boolean(kycProfile?.digilocker_verified);
  const paymentReady = investmentFlowActive && currentKycStatus === 'VERIFIED';

  const refreshStatus = useCallback(async () => {
    const data = unwrap(await apiClient.get('/api/kyc/status'));
    setKycData(data);
    await checkAuth();
  }, [checkAuth]);

  const progress = useMemo(() => {
    if (currentKycStatus === 'VERIFIED') return 100;
    if (['PENDING', 'REJECTED'].includes(currentKycStatus)) return 60;
    return 15;
  }, [currentKycStatus]);

  useEffect(() => {
    if (!userId) return;
    refreshStatus().catch(() => {});
  }, [userId, refreshStatus]);

  useEffect(() => {
    if (!callbackReference && !callbackCode && !callbackError) return;

    const finalize = async () => {
      setBusy('digilocker');
      try {
        const data = unwrap(await apiClient.post('/api/kyc/digilocker/callback', {
          reference_id: callbackReference,
          status: callbackStatus,
          code: callbackCode,
          state: callbackState,
          error: callbackError,
          error_description: searchParams.get('error_description'),
        }));
        toast.success(data.status === 'VERIFIED' ? 'KYC Verified' : 'DigiLocker status updated');
        await refreshStatus();
        if (data.status === 'VERIFIED') {
          clearInvestmentIntent();
        }
        navigate(data.status === 'VERIFIED' ? returnTo : '/kyc/failed', { replace: true });
      } catch (error) {
        toast.error(error?.response?.data?.message || 'Unable to complete DigiLocker verification');
      } finally {
        setBusy('');
      }
    };

    if (userId) finalize();
  }, [callbackCode, callbackError, callbackReference, callbackState, callbackStatus, navigate, refreshStatus, returnTo, searchParams, userId]);

  const handleDigilocker = async () => {
    setBusy('digilocker');
    try {
      const data = unwrap(await apiClient.post('/api/kyc/digilocker/session', {
        origin_url: window.location.origin,
      }));
      window.location.assign(data.authorization_url);
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Unable to start DigiLocker');
      setBusy('');
    }
  };

  const handleResetMockKyc = async () => {
    setBusy('reset-mock');
    try {
      await apiClient.post('/api/kyc/reset-mock');
      await refreshStatus();
      toast.success('Mock KYC reset. You can run the flow again now.');
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Unable to reset mock KYC');
    } finally {
      setBusy('');
    }
  };

  const handleContinueToPayment = () => {
    navigate(returnTo);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) return <Navigate to="/login?redirect=/kyc" replace />;

  const status = currentKycStatus;
  const readyForDigilocker = !digilockerAlreadyVerified;

  return (
    <div className="min-h-screen pt-24 pb-14 px-4 bg-gradient-to-br from-[#e7f0f1] via-white to-[#dceeed] dark:from-[#031117] dark:via-[#061923] dark:to-[#04151b]">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between mb-8">
          <div>
            <div className="mb-4 flex flex-wrap items-center gap-2">
              <Badge variant={statusTone[status]}>{status.replace('_', ' ')}</Badge>
              {mockKycActive && (
                <Badge className="border-amber-400/40 bg-amber-500/10 text-amber-700 hover:bg-amber-500/10 dark:text-amber-200">
                  Mock KYC Mode
                </Badge>
              )}
              {mockKycActive && digilockerAlreadyVerified && (
                <Badge className="border-primary/30 bg-primary/10 text-primary hover:bg-primary/10">
                  Mock KYC Verified
                </Badge>
              )}
            </div>
            <h1 className="text-4xl md:text-5xl font-semibold font-['Outfit']">
              {investmentFlowActive ? 'Verify via DigiLocker' : 'Investor KYC'}
            </h1>
            <p className="mt-3 max-w-2xl text-muted-foreground">
              {investmentFlowActive
                ? 'Complete DigiLocker verification to unlock the payment step for this investment.'
                : mockKycActive
                  ? 'Mock DigiLocker is active for now. Complete the simulated KYC step below to preview the onboarding and investment journey.'
                  : 'Continue with DigiLocker to finish investor onboarding before payment access is enabled.'}
            </p>
          </div>
          <Button variant="outline" className="rounded-full" onClick={() => navigate('/dashboard')}>
            Investor Dashboard
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>

        {mockKycActive && (
          <div className="mb-6 flex items-start gap-3 rounded-2xl border border-amber-300/70 bg-amber-50 p-4 text-amber-950 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-100">
            <AlertTriangle className="mt-0.5 h-5 w-5" />
            <div className="flex-1">
              <p className="text-sm font-medium">Sandbox KYC is active</p>
              <p className="mt-1 text-sm">
                This account is using mock DigiLocker verification. You can preview the onboarding and investment gate without live Decentro credentials.
              </p>
            </div>
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-[0.9fr_1.4fr]">
          <section className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 font-['Outfit']">
                  <ShieldCheck className="h-5 w-5 text-primary" />
                  Verification progress
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                <Progress value={progress} className="h-3" />
                {[
                  ['DigiLocker verification', ['PENDING', 'VERIFIED', 'REJECTED'].includes(status)],
                  [investmentFlowActive ? 'Payment access' : 'Investment access', status === 'VERIFIED'],
                ].map(([label, done]) => (
                  <div key={label} className="flex items-center justify-between rounded-xl border border-border bg-muted/30 px-4 py-3">
                    <span className="text-sm font-medium">{label}</span>
                    {done ? <CheckCircle2 className="h-5 w-5 text-green-500" /> : <Clock className="h-5 w-5 text-muted-foreground" />}
                  </div>
                ))}
              </CardContent>
            </Card>

            {investmentFlowActive && (
              <Card>
                <CardHeader>
                  <CardTitle className="font-['Outfit']">Pending investment</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <div className="flex items-center justify-between rounded-xl border border-border px-4 py-3">
                    <span>Plan</span>
                    <span className="font-medium">{investmentPlanId || 'Selected plan'}</span>
                  </div>
                  <div className="flex items-center justify-between rounded-xl border border-border px-4 py-3">
                    <span>Amount</span>
                    <span className="font-medium">Rs {investmentAmount.toLocaleString() || '0'}</span>
                  </div>
                  <div className="rounded-xl border border-primary/20 bg-primary/5 px-4 py-3 text-muted-foreground">
                    You will return to your selected investment right after DigiLocker verification.
                  </div>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader>
                <CardTitle className="font-['Outfit']">Verification summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex items-center justify-between rounded-xl border border-border px-4 py-3">
                  <span>DigiLocker verification</span>
                  <Badge variant={digilockerAlreadyVerified ? 'default' : 'outline'}>
                    {digilockerAlreadyVerified ? 'Verified' : kycProfile?.digilocker_status || 'Pending'}
                  </Badge>
                </div>
                {profileUser?.kycVerifiedName && (
                  <div className="rounded-xl border border-border bg-muted/30 px-4 py-3 text-muted-foreground">
                    Verified name: <span className="font-medium text-foreground">{profileUser.kycVerifiedName}</span>
                  </div>
                )}
                {mockKycActive && status === 'VERIFIED' && (
                  <div className="rounded-xl border border-amber-300/50 bg-amber-500/10 px-4 py-3 text-amber-800 dark:text-amber-200">
                    This account is currently marked as verified through mock KYC mode.
                  </div>
                )}
              </CardContent>
            </Card>
          </section>

          <section className="space-y-6">
            {investmentFlowActive && (
              <Card className="border-primary/30 bg-primary/5">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 font-['Outfit']">
                    <ShieldCheck className="h-5 w-5 text-primary" />
                    Investment verification flow
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid gap-3 md:grid-cols-2">
                  <div className="rounded-2xl border border-border/70 bg-background/60 p-4">
                    <p className="text-xs uppercase tracking-[0.18em] text-primary">Step 1</p>
                    <p className="mt-2 font-medium">Complete DigiLocker KYC</p>
                  </div>
                  <div className="rounded-2xl border border-border/70 bg-background/60 p-4">
                    <p className="text-xs uppercase tracking-[0.18em] text-primary">Step 2</p>
                    <p className="mt-2 font-medium">Return and complete payment</p>
                  </div>
                </CardContent>
              </Card>
            )}

            {investmentFlowActive && (
              <div className="flex items-start gap-3 rounded-2xl border border-primary/30 bg-primary/5 p-4">
                <ShieldCheck className="mt-0.5 h-5 w-5 text-primary" />
                <div>
                  <p className="text-sm font-medium">Investment is waiting for verification</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Complete KYC and we will send you back to your selected plan so you can finish payment.
                  </p>
                </div>
              </div>
            )}

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 font-['Outfit']">
                  <ShieldCheck className="h-5 w-5 text-primary" />
                  DigiLocker verification
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                <p className="text-sm text-muted-foreground">
                  {mockKycActive
                    ? 'Mock DigiLocker is active until Decentro credentials are configured. Continue to simulate KYC now, and later we can switch this same flow to live Decentro credentials without changing the user journey.'
                    : investmentFlowActive
                      ? 'This investment flow uses DigiLocker as the mandatory KYC step before payment. After consent, we will bring the user back to the selected plan and continue to payment.'
                      : 'Continue with DigiLocker to complete investor onboarding. This is the same KYC path we will use before unlocking investment payments.'}
                </p>
                <Button
                  className="w-full rounded-full py-6"
                  onClick={handleDigilocker}
                  disabled={busy === 'digilocker' || digilockerAlreadyVerified || !readyForDigilocker}
                >
                  {busy === 'digilocker' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ShieldCheck className="mr-2 h-4 w-4" />}
                  {digilockerAlreadyVerified ? 'KYC Verified' : mockKycActive ? 'Complete Mock KYC and Continue' : 'Verify via DigiLocker and Continue'}
                </Button>
                {paymentReady && (
                  <Button
                    type="button"
                    className="w-full rounded-full"
                    onClick={handleContinueToPayment}
                  >
                    Continue to payment
                  </Button>
                )}
                {Array.isArray(kycProfile?.digilocker_documents) && kycProfile.digilocker_documents.length > 0 && (
                  <div className="rounded-xl border border-border bg-muted/20 px-4 py-3 text-sm text-muted-foreground">
                    Documents linked: {kycProfile.digilocker_documents.map((document) => document.description || document.doctype).join(', ')}
                  </div>
                )}
                {mockKycActive && (
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full rounded-full"
                    onClick={handleResetMockKyc}
                    disabled={busy === 'reset-mock'}
                  >
                    {busy === 'reset-mock' ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <RotateCcw className="mr-2 h-4 w-4" />
                    )}
                    Reset mock KYC for this account
                  </Button>
                )}
              </CardContent>
            </Card>

            {kycData?.logs?.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="font-['Outfit']">Recent activity</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {kycData.logs.slice(0, 4).map((log) => (
                    <div key={log.id || log.log_id} className="flex items-center justify-between rounded-xl border border-border px-4 py-3 text-sm">
                      <span>{log.metadata?.message || log.message || log.api_type || log.method}</span>
                      <Badge variant="outline">{log.response_status || log.status}</Badge>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </section>
        </div>
      </div>
    </div>
  );
};

export default KycVerificationPage;
