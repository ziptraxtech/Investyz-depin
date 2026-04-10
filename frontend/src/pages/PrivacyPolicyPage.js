import React, { useEffect } from 'react';
import { Badge } from '../components/ui/badge';
import { Card, CardContent } from '../components/ui/card';
import { Mail } from 'lucide-react';

const policySections = [
  {
    title: '1. About INVESTYZ',
    content: [
      'INVESTYZ is a digital platform focused on real-world asset opportunities, starting with EV DC fast charging infrastructure and related sustainable sectors.',
      'This Privacy Policy explains what information we collect, how we use it, and how we protect it when you use our website, platform, or related services.',
    ],
  },
  {
    title: '2. Information We Collect',
    content: [
      'We may collect personal details such as your name, email, phone number, and address when you register or contact us.',
      'For compliance or payments, we may collect KYC and financial details such as PAN, Aadhaar, bank details, or related verification documents.',
      'We may also collect account activity, transaction history, investment preferences, technical usage data, cookies, analytics data, and communication records.',
    ],
  },
  {
    title: '3. How We Use Your Information',
    content: [
      'We use your information to create and manage your account, provide platform services, process transactions, and support your activity on INVESTYZ.',
      'We may also use it for KYC, fraud prevention, legal compliance, customer support, analytics, security, and service improvement.',
      'Where allowed, we may send updates, alerts, and marketing communications, and you can opt out where applicable.',
    ],
  },
  {
    title: '4. Legal Basis For Processing',
    content: [
      'We process personal data based on consent, contractual necessity, legal obligations, and legitimate business interests such as security, fraud prevention, and improving the platform.',
    ],
  },
  {
    title: '5. Sharing Of Information',
    content: [
      'We may share information with trusted partners such as payment providers, cloud vendors, KYC partners, analytics tools, and service providers that help us operate INVESTYZ.',
      'We may also share information with financial institutions, regulators, legal authorities, or transaction partners when required by law or platform operations.',
      'If INVESTYZ is involved in a merger, acquisition, or restructuring, your information may be transferred as part of that process.',
      'We do not sell your personal information for unrelated third-party commercial use.',
    ],
  },
  {
    title: '6. Data Security',
    content: [
      'We use reasonable security measures such as encrypted connections, access controls, and secure infrastructure practices to protect your information.',
      'No digital system is completely risk-free, so users should also protect their login credentials and account access.',
    ],
  },
  {
    title: '7. Data Retention',
    content: [
      'We keep your information only as long as needed for services, compliance, fraud prevention, dispute handling, and legal recordkeeping.',
      'When it is no longer needed, we delete, anonymize, or securely dispose of it.',
    ],
  },
  {
    title: '8. Your Rights',
    content: [
      'Depending on applicable law, you may request access to your data, correction of inaccurate information, deletion of data, withdrawal of consent, or opt-out from certain communications.',
      'To exercise these rights, you may use the placeholder contact details below until official support channels are finalized.',
    ],
  },
  {
    title: '9. Cookies And Tracking Technologies',
    content: [
      'We may use cookies, analytics tools, and similar technologies to improve user experience, understand usage, and support platform performance.',
      'You can manage cookies in your browser settings, though some features may not work properly if cookies are disabled.',
    ],
  },
  {
    title: '10. Third-Party Links',
    content: [
      'Our website or platform may include links to third-party sites or services. INVESTYZ is not responsible for the privacy practices, content, or security of those third-party services, and users should review their policies separately.',
    ],
  },
  {
    title: '11. Children\'s Privacy',
    content: [
      'INVESTYZ is not intended for individuals under 18. We do not knowingly collect personal data from minors and will remove such data if identified.',
    ],
  },
  {
    title: '12. Changes To This Policy',
    content: [
      'We may update this Privacy Policy from time to time. Changes will be posted on this page.',
      'Your continued use of INVESTYZ after updates may be treated as acceptance of the revised policy where permitted by law.',
    ],
  },
];

const PrivacyPolicyPage = () => {
  useEffect(() => {
    const previousTitle = document.title;
    document.title = 'Privacy Policy - Investyz';

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
              'url(https://images.unsplash.com/photo-1516321318423-f06f85e504b3?crop=entropy&cs=srgb&fm=jpg&q=85)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        />
        <div className="absolute inset-0 bg-background/75 dark:bg-[#031317]/70" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-28">
          <Badge className="mb-5 bg-primary/10 text-primary border-primary/20 px-4 py-1">
            Privacy Policy
          </Badge>
          <div className="max-w-4xl">
            <h1 className="text-4xl md:text-6xl font-semibold tracking-tight font-['Outfit'] mb-6">
              Privacy built for a platform handling real-world investments
            </h1>
            <div className="space-y-4 text-base md:text-lg text-muted-foreground leading-relaxed max-w-3xl">
              <p>
                At INVESTYZ, we are committed to protecting your personal information and using it
                responsibly.
              </p>
              <p>
                This page gives a simple overview of what we collect, why we collect it, and what
                choices you have.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="pb-20 md:pb-24">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="space-y-6">
            {policySections.map((section) => (
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
                      13. Contact Us
                    </p>
                    <h2 className="text-2xl md:text-3xl font-semibold font-['Outfit'] mt-2 mb-4">
                      Questions, concerns, or privacy requests
                    </h2>
                    <div className="space-y-3 text-muted-foreground leading-relaxed">
                      <p>
                        If you have any questions about this Privacy Policy, your data, or a
                        request related to your privacy rights, please contact the INVESTYZ team
                        through the official contact channels available on the website.
                      </p>
                      <p className="text-foreground font-medium">
                        Website: https://www.investyz.com/
                      </p>
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

export default PrivacyPolicyPage;
