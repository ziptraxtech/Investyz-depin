import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Clock,
  FileCheck2,
  IdCard,
  Loader2,
  LockKeyhole,
  ShieldCheck,
} from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Progress } from '../components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { useAuth } from '../context/AuthContext';
import apiClient, { unwrap } from '../lib/apiClient';
import { clearInvestmentIntent, getInvestmentIntent } from '../lib/investmentIntent';

const PAN_REGEX = /^[A-Z]{5}[0-9]{4}[A-Z]$/;

const statusTone = {
  NOT_STARTED: 'secondary',
  PENDING: 'outline',
  VERIFIED: 'default',
  REJECTED: 'destructive',
};

const KycVerificationPage = () => {
  const { user, loading: authLoading, requestOtp, verifyOtp, updateProfile, checkAuth } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [kycData, setKycData] = useState(null);
  const [panNumber, setPanNumber] = useState('');
  const [otp, setOtp] = useState({ email: '', phone: '' });
  const [phone, setPhone] = useState('');
  const [busy, setBusy] = useState('');

  const callbackReference = searchParams.get('reference_id');
  const callbackStatus = searchParams.get('status');
  const callbackCode = searchParams.get('code');
  const callbackState = searchParams.get('state');
  const callbackError = searchParams.get('error');
  const investmentIntent = getInvestmentIntent();
  const returnTo = searchParams.get('return_to') || investmentIntent?.returnTo || '/segments';
  const preferredKycTab = searchParams.get('preferred_kyc') || investmentIntent?.preferredKycMethod || 'pan';
  const investmentFlowActive = searchParams.get('intent') === 'invest' || Boolean(investmentIntent?.planId);
  const investmentAmount = Number(investmentIntent?.amount || 0);
  const investmentPlanId = investmentIntent?.planId || null;
  const userId = user?.user_id;
  const profileUser = kycData?.user || user;
  const kycProfile = kycData?.kyc || null;
  const currentKycStatus = profileUser?.kycStatus || 'NOT_STARTED';
  const panAlreadyVerified = Boolean(kycProfile?.pan_verified);
  const digilockerAlreadyVerified = Boolean(kycProfile?.digilocker_verified);

  const refreshStatus = useCallback(async () => {
    const data = unwrap(await apiClient.get('/api/kyc/status'));
    setKycData(data);
    await checkAuth();
  }, [checkAuth]);

  const progress = useMemo(() => {
    let value = 0;
    if (user?.email_verified) value += 25;
    if (user?.phone_verified) value += 25;
    if (['PENDING', 'REJECTED'].includes(currentKycStatus)) value += 25;
    if (currentKycStatus === 'VERIFIED') value = 100;
    return value;
  }, [currentKycStatus, user?.email_verified, user?.phone_verified]);

  const canStartKyc = investmentFlowActive ? true : Boolean(user?.email_verified && user?.phone_verified);
  const panValid = PAN_REGEX.test(panNumber);

  useEffect(() => {
    setPhone(profileUser?.phone || user?.phone || '');
  }, [profileUser?.phone, user?.phone]);

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
        toast.success(data.status === 'VERIFIED' ? 'DigiLocker KYC verified' : 'DigiLocker status updated');
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

  const handleRequestOtp = async (channel) => {
    setBusy(channel);
    try {
      const values = channel === 'phone' ? { phone } : {};
      const data = await requestOtp(channel, values);
      if (data?.mock_otp) {
        setOtp((current) => ({ ...current, [channel]: data.mock_otp }));
      }
      if (channel === 'phone') {
        await checkAuth();
      }
      toast.success(`${channel} OTP sent${data?.mock_otp ? `: ${data.mock_otp}` : ''}`);
    } catch (error) {
      toast.error(error?.response?.data?.message || `Unable to send ${channel} OTP`);
    } finally {
      setBusy('');
    }
  };

  const handleSavePhone = async () => {
    setBusy('phone-save');
    try {
      await updateProfile({ phone });
      toast.success('Phone number saved');
      await checkAuth();
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Unable to save phone number');
    } finally {
      setBusy('');
    }
  };

  const handleVerifyOtp = async (channel) => {
    setBusy(channel);
    try {
      await verifyOtp(channel, otp[channel]);
      toast.success(`${channel} verified`);
      await refreshStatus();
    } catch (error) {
      toast.error(error?.response?.data?.message || `Unable to verify ${channel}`);
    } finally {
      setBusy('');
    }
  };

  const handlePanVerification = async (event) => {
    event.preventDefault();
    if (!panValid) return;
    setBusy('pan');
    try {
      const data = unwrap(await apiClient.post('/api/kyc/pan/verify', { panNumber }));
      toast.success(data.status === 'VERIFIED' ? 'PAN verified successfully' : 'PAN verification was rejected');
      await refreshStatus();
      if (data.status === 'VERIFIED') {
        clearInvestmentIntent();
      }
      navigate(data.status === 'VERIFIED' ? returnTo : '/kyc/failed');
    } catch (error) {
      toast.error(error?.response?.data?.message || 'PAN verification failed');
    } finally {
      setBusy('');
    }
  };

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

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) return <Navigate to="/login?redirect=/kyc" replace />;

  const status = currentKycStatus;
  const showDigilockerOnly = investmentFlowActive;
  const readyForDigilocker = canStartKyc && !digilockerAlreadyVerified;

  return (
    <div className="min-h-screen pt-24 pb-14 px-4 bg-gradient-to-br from-[#e7f0f1] via-white to-[#dceeed] dark:from-[#031117] dark:via-[#061923] dark:to-[#04151b]">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between mb-8">
          <div>
            <Badge variant={statusTone[status]} className="mb-4">{status.replace('_', ' ')}</Badge>
            <h1 className="text-4xl md:text-5xl font-semibold font-['Outfit']">
              {investmentFlowActive ? 'Verify via DigiLocker' : 'KYC Onboarding'}
            </h1>
            <p className="mt-3 max-w-2xl text-muted-foreground">
              {investmentFlowActive
                ? 'Complete the checks below, then continue with DigiLocker to unlock the payment step for this investment.'
                : 'Complete contact verification, then choose PAN or DigiLocker identity verification before investing in EV charging assets.'}
            </p>
          </div>
          <Button variant="outline" className="rounded-full" onClick={() => navigate('/dashboard')}>
            Investor Dashboard
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>

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
                  ...(investmentFlowActive ? [] : [['Email verified', user.email_verified], ['Phone verified', user.phone_verified]]),
                  [investmentFlowActive ? 'DigiLocker verification' : 'Identity submitted', ['PENDING', 'VERIFIED', 'REJECTED'].includes(status)],
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
              <CardContent className="p-6">
                <div className="flex gap-3">
                  <LockKeyhole className="mt-1 h-5 w-5 text-primary" />
                  <div>
                    <h2 className="font-semibold">Secure data handling</h2>
                    <p className="mt-2 text-sm text-muted-foreground">
                      Decentro calls happen only on the backend. PAN and Aadhaar are masked in the UI, sensitive values are encrypted in PostgreSQL, and provider callbacks are verified before processing.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="font-['Outfit']">Verification summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex items-center justify-between rounded-xl border border-border px-4 py-3">
                  <span>PAN verification</span>
                  <Badge variant={panAlreadyVerified ? 'default' : 'outline'}>
                    {panAlreadyVerified ? `Verified${kycProfile?.pan_masked ? ` · ${kycProfile.pan_masked}` : ''}` : 'Pending'}
                  </Badge>
                </div>
                <div className="flex items-center justify-between rounded-xl border border-border px-4 py-3">
                  <span>DigiLocker verification</span>
                  <Badge variant={digilockerAlreadyVerified ? 'default' : 'outline'}>
                    {digilockerAlreadyVerified ? 'Verified' : kycProfile?.digilocker_status || 'Pending'}
                  </Badge>
                </div>
                {kycProfile?.pan_name && (
                  <div className="rounded-xl border border-border bg-muted/30 px-4 py-3 text-muted-foreground">
                    Verified name: <span className="font-medium text-foreground">{kycProfile.pan_name}</span>
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
                <CardContent className="grid gap-3 md:grid-cols-3">
                  <div className="rounded-2xl border border-border/70 bg-background/60 p-4">
                    <p className="text-xs uppercase tracking-[0.18em] text-primary">Step 1</p>
                    <p className="mt-2 font-medium">Verify email and phone</p>
                  </div>
                  <div className="rounded-2xl border border-border/70 bg-background/60 p-4">
                    <p className="text-xs uppercase tracking-[0.18em] text-primary">Step 2</p>
                    <p className="mt-2 font-medium">Continue with DigiLocker</p>
                  </div>
                  <div className="rounded-2xl border border-border/70 bg-background/60 p-4">
                    <p className="text-xs uppercase tracking-[0.18em] text-primary">Step 3</p>
                    <p className="mt-2 font-medium">Return and complete payment</p>
                  </div>
                </CardContent>
              </Card>
            )}

            {!investmentFlowActive && (
              <Card>
                <CardHeader>
                  <CardTitle className="font-['Outfit']">Contact verification</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-4 md:grid-cols-2">
                  {['email', 'phone'].map((channel) => {
                    const verified = channel === 'email' ? user.email_verified : user.phone_verified;
                    const isPhone = channel === 'phone';
                    return (
                      <div key={channel} className="rounded-2xl border border-border p-4">
                        <div className="flex items-center justify-between">
                          <Label className="capitalize">{channel}</Label>
                          <Badge variant={verified ? 'default' : 'outline'}>{verified ? 'Verified' : 'Pending'}</Badge>
                        </div>
                        <p className="mt-2 text-xs text-muted-foreground">
                          {isPhone ? (profileUser?.phone ? `Current: ******${String(profileUser.phone).slice(-4)}` : 'Add your mobile number') : profileUser?.email}
                        </p>
                        {isPhone && !verified && (
                          <div className="mt-4 flex gap-2">
                            <Input
                              type="tel"
                              inputMode="numeric"
                              autoComplete="tel"
                              placeholder="9876543210"
                              value={phone}
                              onChange={(event) => setPhone(event.target.value.replace(/\D/g, '').slice(0, 10))}
                            />
                            <Button variant="outline" onClick={handleSavePhone} disabled={busy === 'phone-save' || phone.length !== 10}>
                              Save
                            </Button>
                          </div>
                        )}
                        <div className="mt-4 flex gap-2">
                          <Input
                            placeholder="123456"
                            inputMode="numeric"
                            autoComplete="one-time-code"
                            maxLength={6}
                            value={otp[channel]}
                            onChange={(event) => setOtp({ ...otp, [channel]: event.target.value.replace(/\D/g, '').slice(0, 6) })}
                            disabled={verified}
                          />
                          <Button
                            variant="outline"
                            onClick={() => handleRequestOtp(channel)}
                            disabled={verified || busy === channel || (isPhone && phone.length !== 10)}
                          >
                            Send
                          </Button>
                        </div>
                        <Button className="mt-3 w-full rounded-full" onClick={() => handleVerifyOtp(channel)} disabled={verified || busy === channel || otp[channel].length !== 6}>
                          {busy === channel ? 'Checking...' : 'Verify'}
                        </Button>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            )}

            {!investmentFlowActive && !canStartKyc && (
              <div className="flex items-start gap-3 rounded-2xl border border-amber-300/70 bg-amber-50 p-4 text-amber-950 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-100">
                <AlertTriangle className="mt-0.5 h-5 w-5" />
                <p className="text-sm">
                  {investmentFlowActive
                    ? 'Verify both email and phone first. Then use DigiLocker to continue this investment.'
                    : 'Verify both email and phone before starting PAN or DigiLocker KYC.'}
                </p>
              </div>
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

            {showDigilockerOnly ? (
              <Card className={!canStartKyc ? 'opacity-60' : ''}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 font-['Outfit']">
                    <ShieldCheck className="h-5 w-5 text-primary" />
                    DigiLocker verification
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-5">
                  <p className="text-sm text-muted-foreground">
                    This investment flow uses DigiLocker as the primary KYC step. After consent, we will bring the user back to the selected plan and continue to payment.
                  </p>
                  <Button
                    className="w-full rounded-full py-6"
                    onClick={handleDigilocker}
                    disabled={busy === 'digilocker' || digilockerAlreadyVerified || !readyForDigilocker}
                  >
                    {busy === 'digilocker' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ShieldCheck className="mr-2 h-4 w-4" />}
                    {digilockerAlreadyVerified ? 'DigiLocker Verified' : 'Verify via DigiLocker and Continue'}
                  </Button>
                  {!canStartKyc && (
                    <p className="text-sm text-muted-foreground">
                      Finish contact verification first to unlock DigiLocker.
                    </p>
                  )}
                  {Array.isArray(kycProfile?.digilocker_documents) && kycProfile.digilocker_documents.length > 0 && (
                    <div className="rounded-xl border border-border bg-muted/20 px-4 py-3 text-sm text-muted-foreground">
                      Documents linked: {kycProfile.digilocker_documents.map((document) => document.description || document.doctype).join(', ')}
                    </div>
                  )}
                </CardContent>
              </Card>
            ) : (
              <Tabs defaultValue={preferredKycTab} className={!canStartKyc ? 'pointer-events-none opacity-50' : ''}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="pan">PAN</TabsTrigger>
                  <TabsTrigger value="digilocker">DigiLocker</TabsTrigger>
                </TabsList>
                <TabsContent value="pan" className="mt-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 font-['Outfit']">
                        <IdCard className="h-5 w-5 text-primary" />
                        PAN verification
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <form onSubmit={handlePanVerification} className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="pan">PAN number</Label>
                          <Input
                            id="pan"
                            value={panNumber}
                            maxLength={10}
                            onChange={(event) => setPanNumber(event.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
                            placeholder="ABCDE1234F"
                            className={panNumber && !panValid ? 'border-red-400' : ''}
                            disabled={panAlreadyVerified}
                          />
                          <p className={panNumber && !panValid ? 'text-sm text-red-500' : 'text-sm text-muted-foreground'}>
                            Format: five letters, four digits, one letter.
                          </p>
                        </div>
                        <Button type="submit" className="w-full rounded-full py-6" disabled={!panValid || busy === 'pan' || panAlreadyVerified}>
                          {busy === 'pan' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileCheck2 className="mr-2 h-4 w-4" />}
                          {panAlreadyVerified ? 'PAN Verified' : 'Verify PAN'}
                        </Button>
                      </form>
                    </CardContent>
                  </Card>
                </TabsContent>
                <TabsContent value="digilocker" className="mt-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 font-['Outfit']">
                        <ShieldCheck className="h-5 w-5 text-primary" />
                        DigiLocker verification
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-5">
                      <p className="text-sm text-muted-foreground">
                        Start a Decentro DigiLocker session, grant consent, and return here automatically to complete investor verification with verified DigiLocker data.
                      </p>
                      <Button className="w-full rounded-full py-6" onClick={handleDigilocker} disabled={busy === 'digilocker' || digilockerAlreadyVerified}>
                        {busy === 'digilocker' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ShieldCheck className="mr-2 h-4 w-4" />}
                        {digilockerAlreadyVerified ? 'DigiLocker Verified' : 'Continue with DigiLocker'}
                      </Button>
                      {Array.isArray(kycProfile?.digilocker_documents) && kycProfile.digilocker_documents.length > 0 && (
                        <div className="rounded-xl border border-border bg-muted/20 px-4 py-3 text-sm text-muted-foreground">
                          Documents linked: {kycProfile.digilocker_documents.map((document) => document.description || document.doctype).join(', ')}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            )}

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
