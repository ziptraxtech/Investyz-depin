import React, { useEffect } from 'react';
import { Badge } from '../components/ui/badge';
import { Card, CardContent } from '../components/ui/card';
import { Mail } from 'lucide-react';

const riskSections = [
  {
    title: '1. Regulatory Status',
    content: [
      'INVESTYZ does not represent that it is registered, licensed, or regulated by any financial regulatory authority in India, including but not limited to the Securities and Exchange Board of India (SEBI) or the Reserve Bank of India (RBI), unless expressly stated otherwise.',
      'Participation on the platform does not constitute an investment in regulated securities or financial products.',
    ],
  },
  {
    title: '2. No Offer or Solicitation',
    content: [
      'Nothing on this platform constitutes or should be construed as an offer to sell, a solicitation of an offer to buy, or a recommendation to invest in any securities, financial instruments, or investment products under applicable law.',
    ],
  },
  {
    title: '3. Nature of Participation',
    content: [
      'Participation through INVESTYZ does not create any ownership rights, equity interest, or legal title in any underlying asset unless explicitly stated in a separate legally binding agreement.',
      'Users may only receive contractual or economic exposure, subject to platform terms.',
    ],
  },
  {
    title: '4. Dispute Resolution',
    content: [
      'Amicable Resolution and Mediation: In the event of any dispute, controversy, or claim arising out of or in connection with the use of the platform, participation in any opportunity, or these terms ("Dispute"), the parties shall first attempt to resolve the Dispute amicably through mutual discussions. If the Dispute is not resolved within 15 (fifteen) days of such discussions, the parties shall refer the matter to mediation, to be conducted in accordance with mutually agreed mediation rules and procedures in India.',
      'Arbitration: In the event that the Dispute remains unresolved through mediation within 30 (thirty) days from the date of reference to mediation, the Dispute shall be finally resolved by arbitration in accordance with the provisions of the Arbitration and Conciliation Act, 1996. The arbitration shall be conducted by a sole arbitrator, who shall be appointed through an institutional arbitration mechanism in India. The seat and venue of arbitration shall be in India, and the proceedings shall be conducted in the English language. The arbitral award shall be final and binding on the parties.',
    ],
  },
  {
    title: '5. User Eligibility and Compliance',
    content: [
      'Users represent and warrant that they are legally competent to enter into binding agreements and are not prohibited under any applicable laws from participating.',
      'Users shall comply with all applicable laws, including but not limited to tax laws, foreign exchange regulations, and anti-money laundering requirements.',
    ],
  },
  {
    title: '6. No Fiduciary Relationship',
    content: [
      'Nothing on this platform shall be deemed to create any fiduciary, advisory, or client relationship between INVESTYZ and the user.',
    ],
  },
  {
    title: '7. Indemnification',
    content: [
      'Users agree to indemnify and hold harmless INVESTYZ and its affiliates from any claims, damages, liabilities, or expenses arising out of their use of the platform, violation of these terms, or breach of applicable laws.',
    ],
  },
  {
    title: '8. Platform Role',
    content: [
      'INVESTYZ operates as a technology platform facilitating access to opportunities and does not act as an issuer, broker, dealer, or financial intermediary unless expressly stated.',
    ],
  },
  {
    title: '9. Refund, Cancellation, and Replacement Policy',
    content: [
      'All transactions on INVESTYZ are final once completed. Users are responsible for verifying all details before confirming participation.',
      'Any refund, cancellation, or replacement requests must be submitted in accordance with the platform terms and applicable laws. Users should review these terms carefully before participating.',
    ],
  },
  {
    title: '10. Tax Disclaimer',
    content: [
      'Users are solely responsible for determining and complying with their tax obligations arising from participation on the platform.',
      'INVESTYZ does not provide tax advice and users should consult qualified tax professionals regarding their specific tax circumstances.',
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
                      Contact Us
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

export default RiskDisclaimerPage;
