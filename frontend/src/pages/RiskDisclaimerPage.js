import React, { useEffect } from 'react';
import { Badge } from '../components/ui/badge';
import { Card, CardContent } from '../components/ui/card';
import { Mail } from 'lucide-react';

const riskSections = [
  {
    title: '1. General Risk Notice',
    content: [
      'Participation in opportunities presented through INVESTYZ involves risk.',
      'Real-world assets, infrastructure-linked income, and digital platforms are not risk-free, so users should make decisions carefully and independently.',
    ],
  },
  {
    title: '2. No Guaranteed Returns',
    content: [
      'Any references to projected returns, payouts, growth, or yields are for informational purposes unless clearly stated otherwise.',
      'Returns are not guaranteed and may vary due to market conditions, asset performance, utilization, regulation, expenses, downtime, and other factors.',
    ],
  },
  {
    title: '3. Real-World Asset And Infrastructure Risks',
    content: [
      'INVESTYZ currently focuses on infrastructure opportunities such as EV DC fast charging, which may be affected by breakdowns, maintenance issues, lower usage, delays, or operational underperformance.',
      'These assets may also be affected by policy changes, power availability, site access, environmental conditions, or changes in technology adoption.',
    ],
  },
  {
    title: '4. Regulatory And Compliance Risks',
    content: [
      'Laws and regulations affecting digital platforms, asset-backed participation, payments, taxation, and KYC may change over time.',
      'Such changes may affect platform availability, user eligibility, transaction timing, or expected returns.',
    ],
  },
  {
    title: '5. Liquidity And Exit Risks',
    content: [
      'Some opportunities may have limited liquidity, restricted transferability, longer holding periods, or delayed exit options.',
      'You may not be able to exit at the time, price, or method you prefer.',
    ],
  },
  {
    title: '6. Technology And Platform Risks',
    content: [
      'Use of INVESTYZ may involve software issues, hosting outages, cybersecurity incidents, wallet problems, transaction failures, or internet disruptions.',
      'No digital platform can guarantee uninterrupted service or complete protection from technical incidents.',
    ],
  },
  {
    title: '7. Third-Party Dependency Risks',
    content: [
      'INVESTYZ may depend on payment processors, compliance vendors, cloud providers, partners, and asset operators.',
      'Issues affecting those third parties may impact platform services, payouts, asset performance, or user experience.',
    ],
  },
  {
    title: '8. Valuation And Information Risks',
    content: [
      'Information on INVESTYZ may rely on assumptions, third-party data, or forward-looking estimates that can change over time.',
      'Asset values and performance expectations may be revised and may not predict actual future results.',
    ],
  },
  {
    title: '9. No Personal Advice',
    content: [
      'Nothing on INVESTYZ should be treated as personalized investment, legal, tax, or accounting advice.',
      'Users should consult qualified advisors before making financial or legal decisions.',
    ],
  },
  {
    title: '10. User Responsibility',
    content: [
      'By using INVESTYZ, you accept responsibility for your own decisions, due diligence, and risk assessment.',
      'You should not participate using funds you cannot afford to lose or keep locked up for a period of time.',
    ],
  },
  {
    title: '11. Forward-Looking Statements',
    content: [
      'Some content on INVESTYZ may include forward-looking statements about growth, adoption, revenue, performance, or future product direction.',
      'These statements are uncertain and should not be treated as guarantees of future performance.',
    ],
  },
];

const RiskDisclaimerPage = () => {
  useEffect(() => {
    const previousTitle = document.title;
    document.title = 'Risk Disclaimer - Investyz';

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
              'url(https://images.unsplash.com/photo-1520607162513-77705c0f0d4a?crop=entropy&cs=srgb&fm=jpg&q=85)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        />
        <div className="absolute inset-0 bg-background/75 dark:bg-[#031317]/70" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-28">
          <Badge className="mb-5 bg-primary/10 text-primary border-primary/20 px-4 py-1">
            Risk Disclaimer
          </Badge>
          <div className="max-w-4xl">
            <h1 className="text-4xl md:text-6xl font-semibold tracking-tight font-['Outfit'] mb-6">
              Important risk information for users of INVESTYZ
            </h1>
            <div className="space-y-4 text-base md:text-lg text-muted-foreground leading-relaxed max-w-3xl">
              <p>
                INVESTYZ gives access to infrastructure-linked opportunities, and users should
                understand the commercial, technical, and regulatory risks involved.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="pb-20 pt-10 md:pb-24">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="space-y-6">
            {riskSections.map((section) => (
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
                      Contact Placeholder
                    </p>
                    <h2 className="text-2xl md:text-3xl font-semibold font-['Outfit'] mt-2 mb-4">
                      Questions about platform risks
                    </h2>
                    <div className="space-y-3 text-muted-foreground leading-relaxed">
                      <p>
                        For any questions regarding this Risk Disclaimer, please contact the
                        INVESTYZ team through the official contact channels available on the
                        website.
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

export default RiskDisclaimerPage;
