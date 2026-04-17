import React, { useEffect } from 'react';
import { Badge } from '../components/ui/badge';
import { Card, CardContent } from '../components/ui/card';
import { Mail } from 'lucide-react';

const termsSections = [
  {
    title: '1. Acceptance Of Terms',
    content: [
      'These Terms of Service apply to your use of the INVESTYZ website, platform, and related services.',
      'By using INVESTYZ, you agree to these terms. If you do not agree, you should not use the platform.',
    ],
  },
  {
    title: '2. About INVESTYZ',
    content: [
      'INVESTYZ is a digital platform focused on real-world asset opportunities, starting with EV DC fast charging infrastructure and other sustainable sectors.',
      'The platform may provide information, dashboards, account access, investment workflows, and related digital services.',
    ],
  },
  {
    title: '3. Eligibility',
    content: [
      'You must be legally able to enter into a binding agreement and comply with the laws of your jurisdiction to use INVESTYZ.',
      'INVESTYZ is not intended for individuals under 18 years of age.',
    ],
  },
  {
    title: '4. Account Registration And User Responsibilities',
    content: [
      'You may need to create an account, complete verification steps, and provide accurate information to access certain services.',
      'You are responsible for protecting your login details, wallet access, and account activity.',
      'All information you provide must be true, current, and not misleading.',
    ],
  },
  {
    title: '5. Platform Use',
    content: [
      'You may use INVESTYZ only for lawful purposes and in line with these terms.',
      'You must not misuse the platform, interfere with security, attempt unauthorized access, or engage in fraudulent or illegal activity.',
      'We may suspend or restrict access if misuse, legal risk, or security concerns arise.',
    ],
  },
  {
    title: '6. Investment-Related Information',
    content: [
      'Information on INVESTYZ is provided for general informational and platform purposes unless clearly stated otherwise.',
      'Nothing on the platform should be treated as personalized financial, legal, or tax advice, or as a guaranteed promise of returns.',
    ],
  },
  {
    title: '7. KYC, Compliance, And Verification',
    content: [
      'INVESTYZ may require KYC, identity checks, payment verification, or additional documents before enabling certain services or transactions.',
      'If required verification is not completed, access may be delayed, limited, or denied.',
    ],
  },
  {
    title: '8. Fees, Payments, And Transactions',
    content: [
      'Some platform activities may involve fees, processing charges, or third-party payment costs, which may be shown during the relevant flow.',
      'By initiating a transaction, you authorize INVESTYZ and its partners to process it according to your instructions.',
      'We are not responsible for delays caused by banks, payment gateways, networks, third-party outages, or regulatory holds outside our control.',
    ],
  },
  {
    title: '8.1 Refund, Cancellation, And Replacement Policy',
    content: [
      'All transactions on INVESTYZ are final once completed and confirmed on the platform.',
      'Users are responsible for verifying all transaction details, amounts, and investment parameters before confirming any participation.',
      'Refunds: Requests for refunds must be submitted within 48 hours of transaction completion and are subject to verification of grounds such as duplicate transactions or processing errors. Refunds will be processed back to the original payment method within 7-10 business days.',
      'Cancellations: Cancellations of ongoing or locked participation may not be permitted depending on the underlying asset lock-in period and applicable legal agreements. Cancellation requests must comply with the specific investment terms shown at the time of participation.',
      'Replacements: If a transaction fails due to platform or technical error, INVESTYZ will work to resolve or replace the transaction at no additional cost to the user.',
    ],
  },
  {
    title: '9. Intellectual Property',
    content: [
      'The INVESTYZ platform, branding, software, design, and content are owned by INVESTYZ or its licensors and protected by law.',
      'You may not copy, modify, distribute, or reverse engineer platform content without proper authorization.',
    ],
  },
  {
    title: '10. Third-Party Services',
    content: [
      'INVESTYZ may use or link to third-party services such as wallets, payment tools, analytics services, and external websites.',
      'We are not responsible for the content, availability, or policies of those third-party services.',
    ],
  },
  {
    title: '11. Suspension And Termination',
    content: [
      'We may suspend, restrict, or terminate access where necessary for security, maintenance, legal compliance, fraud prevention, or breach of these terms.',
      'Any rights or obligations that should continue after suspension or termination will remain in effect.',
    ],
  },
  {
    title: '12. Disclaimers',
    content: [
      'INVESTYZ is provided on an "as is" and "as available" basis to the extent permitted by law.',
      'We do not guarantee uninterrupted access, error-free performance, or freedom from technical disruptions.',
    ],
  },
  {
    title: '13. Limitation Of Liability',
    content: [
      'To the maximum extent permitted by law, INVESTYZ and related parties are not liable for indirect, incidental, or consequential losses arising from platform use.',
      'Any liability that cannot be excluded will be limited as permitted by applicable law.',
    ],
  },
  {
    title: '14. Changes To These Terms',
    content: [
      'We may update these Terms of Service from time to time, and changes will be posted on this page.',
      'Your continued use of INVESTYZ after updates may be treated as acceptance of the revised terms where allowed by law.',
    ],
  },
];

const TermsOfServicePage = () => {
  useEffect(() => {
    const previousTitle = document.title;
    document.title = 'Terms of Service - Investyz';

    return () => {
      document.title = previousTitle;
    };
  }, []);

  return (
    <div className="min-h-screen pt-20 bg-background">
      <section className="relative overflow-hidden hero-gradient">
        <div
          className="absolute inset-0 opacity-[0.28] dark:opacity-40"
          style={{
            backgroundImage:
              'url(https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?crop=entropy&cs=srgb&fm=jpg&q=85)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        />
        <div className="absolute inset-0 bg-background/75 dark:bg-[#031317]/70" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-28">
          <Badge className="mb-5 bg-primary/10 text-primary border-primary/20 px-4 py-1">
            Terms of Service
          </Badge>
          <div className="max-w-4xl">
            <h1 className="text-4xl md:text-6xl font-semibold tracking-tight font-['Outfit'] mb-6">
              Terms governing how INVESTYZ is accessed and used
            </h1>
            <div className="space-y-4 text-base md:text-lg text-muted-foreground leading-relaxed max-w-3xl">
              <p>
                These terms explain the main rules, responsibilities, and conditions for using
                the INVESTYZ platform.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="pb-20 pt-10 md:pb-24">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="space-y-6">
            {termsSections.map((section) => (
              <Card key={section.title} className="border-border/60 bg-card/95">
                <CardContent className="p-7 md:p-8">
                  <h2 className="text-2xl md:text-3xl font-semibold font-['Outfit'] mb-5">
                    {section.title}
                  </h2>
                  <div className="space-y-3 text-muted-foreground leading-relaxed">
                    {section.content.map((paragraph) => (
                      <p key={paragraph}>{paragraph}</p>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}

            <Card className="border-border/60 bg-gradient-to-br from-primary/10 via-card to-accent/10 overflow-hidden">
              <CardContent className="p-7 md:p-8">
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-2xl bg-primary/10">
                    <Mail className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm uppercase tracking-[0.24em] text-primary/80">
                      Contact Us
                    </p>
                    <h2 className="text-2xl md:text-3xl font-semibold font-['Outfit'] mt-2 mb-4">
                      Questions about these terms
                    </h2>
                    <div className="space-y-3 text-muted-foreground leading-relaxed">
                      <p>
                        For any questions regarding these Terms of Service, please contact the
                        INVESTYZ team through the official contact channels available on the
                        website.
                      </p>
                      <p className="text-foreground font-medium">
                        Email: investyzasset@gmail.com
                      </p>
                      <p className="text-foreground font-medium">Website: https://www.investyz.com/</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </div>
  );
};

export default TermsOfServicePage;
