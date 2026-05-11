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
  const userId = user?.user_id;

  const refreshStatus = useCallback(async () => {
    const data = unwrap(await apiClient.get('/api/kyc/status'));
    setKycData(data);
    await checkAuth();
  }, [checkAuth]);

  const progress = useMemo(() => {
    let value = 0;
    if (user?.email_verified) value += 25;
    if (user?.phone_verified) value += 25;
    if (user?.kycStatus === 'PENDING') value += 25;
    if (user?.kycStatus === 'VERIFIED') value = 100;
    return value;
  }, [user?.email_verified, user?.kycStatus, user?.phone_verified]);

  const canStartKyc = Boolean(user?.email_verified && user?.phone_verified);
  const panValid = PAN_REGEX.test(panNumber);

  useEffect(() => {
    setPhone(user?.phone || '');
  }, [user?.phone]);

  useEffect(() => {
    if (!userId) return;
    refreshStatus().catch(() => {});
  }, [userId, refreshStatus]);

  useEffect(() => {
    if (!callbackReference) return;

    const finalize = async () => {
      setBusy('digilocker');
      try {
        const data = unwrap(await apiClient.post('/api/kyc/digilocker/callback', {
          reference_id: callbackReference,
          status: callbackStatus === 'success' ? 'SUCCESS' : callbackStatus,
          aadhaar_masked: 'XXXX-XXXX-1234',
          name: user?.name,
        }));
        toast.success(data.status === 'VERIFIED' ? 'DigiLocker KYC verified' : 'DigiLocker status updated');
        await refreshStatus();
        navigate(data.status === 'VERIFIED' ? '/kyc/success' : '/kyc/failed', { replace: true });
      } catch (error) {
        toast.error(error?.response?.data?.message || 'Unable to complete DigiLocker verification');
      } finally {
        setBusy('');
      }
    };

    if (userId) finalize();
  }, [callbackReference, callbackStatus, navigate, refreshStatus, user?.name, userId]);

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
      navigate(data.status === 'VERIFIED' ? '/kyc/success' : '/kyc/failed');
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

  const status = user.kycStatus || 'NOT_STARTED';

  return (
    <div className="min-h-screen pt-24 pb-14 px-4 bg-gradient-to-br from-[#e7f0f1] via-white to-[#dceeed] dark:from-[#031117] dark:via-[#061923] dark:to-[#04151b]">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between mb-8">
          <div>
            <Badge variant={statusTone[status]} className="mb-4">{status.replace('_', ' ')}</Badge>
            <h1 className="text-4xl md:text-5xl font-semibold font-['Outfit']">KYC Onboarding</h1>
            <p className="mt-3 max-w-2xl text-muted-foreground">
              Complete contact verification, then choose PAN or DigiLocker identity verification before investing in EV charging assets.
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
                  ['Email verified', user.email_verified],
                  ['Phone verified', user.phone_verified],
                  ['Identity submitted', ['PENDING', 'VERIFIED', 'REJECTED'].includes(status)],
                  ['Investment access', status === 'VERIFIED'],
                ].map(([label, done]) => (
                  <div key={label} className="flex items-center justify-between rounded-xl border border-border bg-muted/30 px-4 py-3">
                    <span className="text-sm font-medium">{label}</span>
                    {done ? <CheckCircle2 className="h-5 w-5 text-green-500" /> : <Clock className="h-5 w-5 text-muted-foreground" />}
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex gap-3">
                  <LockKeyhole className="mt-1 h-5 w-5 text-primary" />
                  <div>
                    <h2 className="font-semibold">Secure data handling</h2>
                    <p className="mt-2 text-sm text-muted-foreground">
                      Decentro calls happen only on the backend. PAN and Aadhaar are masked in the UI and provider responses are logged without raw sensitive values.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>

          <section className="space-y-6">
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
                        {isPhone ? (user.phone ? `Current: ******${String(user.phone).slice(-4)}` : 'Add your mobile number') : user.email}
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

            {!canStartKyc && (
              <div className="flex items-start gap-3 rounded-2xl border border-amber-300/70 bg-amber-50 p-4 text-amber-950 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-100">
                <AlertTriangle className="mt-0.5 h-5 w-5" />
                <p className="text-sm">Verify both email and phone before starting PAN or DigiLocker KYC.</p>
              </div>
            )}

            <Tabs defaultValue="pan" className={!canStartKyc ? 'pointer-events-none opacity-50' : ''}>
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
                        />
                        <p className={panNumber && !panValid ? 'text-sm text-red-500' : 'text-sm text-muted-foreground'}>
                          Format: five letters, four digits, one letter.
                        </p>
                      </div>
                      <Button type="submit" className="w-full rounded-full py-6" disabled={!panValid || busy === 'pan'}>
                        {busy === 'pan' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileCheck2 className="mr-2 h-4 w-4" />}
                        Verify PAN
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
                      Start a Decentro DigiLocker session, grant consent, and return here automatically to complete Aadhaar-backed verification.
                    </p>
                    <Button className="w-full rounded-full py-6" onClick={handleDigilocker} disabled={busy === 'digilocker'}>
                      {busy === 'digilocker' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ShieldCheck className="mr-2 h-4 w-4" />}
                      Verify with DigiLocker
                    </Button>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>

            {kycData?.logs?.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="font-['Outfit']">Recent activity</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {kycData.logs.slice(0, 4).map((log) => (
                    <div key={log.log_id} className="flex items-center justify-between rounded-xl border border-border px-4 py-3 text-sm">
                      <span>{log.message || log.method}</span>
                      <Badge variant="outline">{log.status}</Badge>
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
