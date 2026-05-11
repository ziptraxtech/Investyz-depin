import React from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, CheckCircle2, ShieldCheck } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';

const KycResultPage = ({ status = 'success' }) => {
  const navigate = useNavigate();
  const success = status === 'success';

  return (
    <div className="min-h-screen pt-24 pb-12 px-4 bg-gradient-to-br from-[#e7f0f1] via-white to-[#dceeed] dark:from-[#031117] dark:via-[#061923] dark:to-[#04151b]">
      <Card className="max-w-2xl mx-auto border-border/70 bg-card/95">
        <CardContent className="p-8 md:p-10 text-center">
          <div className={`mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full ${success ? 'bg-green-500/10 text-green-500' : 'bg-amber-500/10 text-amber-500'}`}>
            {success ? <CheckCircle2 className="h-9 w-9" /> : <AlertTriangle className="h-9 w-9" />}
          </div>
          <h1 className="text-3xl md:text-4xl font-semibold font-['Outfit']">
            {success ? 'KYC Verified' : 'Verification Needs Attention'}
          </h1>
          <p className="mt-4 text-muted-foreground">
            {success
              ? 'Your investor profile is verified. Investment features are now available.'
              : 'We could not complete verification. Review your details and retry KYC.'}
          </p>
          <div className="mt-8 flex flex-col sm:flex-row justify-center gap-3">
            <Button className="rounded-full px-7" onClick={() => navigate(success ? '/segments' : '/kyc')}>
              <ShieldCheck className="mr-2 h-4 w-4" />
              {success ? 'Start Investing' : 'Retry Verification'}
            </Button>
            <Button variant="outline" className="rounded-full px-7" onClick={() => navigate('/dashboard')}>
              Go to Dashboard
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default KycResultPage;
