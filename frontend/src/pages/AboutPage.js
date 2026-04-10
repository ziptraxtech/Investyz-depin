import React from 'react';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import {
  ArrowRight,
  BarChart3,
  Battery,
  CheckCircle2,
  Mail,
  Route,
  Target,
  Users,
  Zap,
} from 'lucide-react';

const teamMembers = [
  {
    name: 'Mr Rohan Singh',
    role: 'CEO & Founder',
    summary:
      'B.Tech BITS Pilani 2012, Executive Education-HBS, 12+ Years Exp, Ex-Dell, Ex-IESA, 1-Startup exit (acquired-2018).',
    imageSrc: '/team/rohan-singh.png',
    placeholder: 'Founder Image',
  },
  {
    name: 'Ms Sonia Singh',
    role: 'CBO & Co-Founder',
    summary:
      'B.Sc, & M.Sc Sociology, PGDM Marketing, 20+ years in CSR & ESG Projects, NITI AAYOG Committee – Battery Circular Economy.',
    imageSrc: '/team/sonia-singh.png',
    placeholder: 'Co-Founder Image',
  },
];

const advisors = [
  {
    name: 'CMDE Akash Kapur',
    role: 'Board Advisor',
    summary: 'B.Tech (Elec), M.Tech IIT Delhi, MBA Marketing, M.Phil DSS, 35+ years in Indian Navy.',
    imageSrc: '/advisors/akash-kapur.png',
  },
  {
    name: 'Mr Veeramuthu M',
    role: 'Technical Advisor',
    summary: 'Product leader, ex-CTO, data scientist, Gen AI specialist, University of Texas at Austin, 20+ years experience, startup advisor.',
    imageSrc: '/advisors/veeramuthu-m.png',
  },
  {
    name: 'Mr Ankit Ahuja',
    role: 'Overseas Advisor - SE Asia',
    summary: 'BITS Pilani, MIT Global SCM, Purdue University, INSEAD. Procurement excellence, digital solutions, and transformation.',
    imageSrc: '/advisors/ankit-ahuja.png',
  },
  {
    name: 'Mr Harinder Singh',
    role: 'Overseas Advisor - GCC',
    summary: 'Project management expert based in Abu Dhabi, UAE, with a strong background in managing energy projects.',
    imageSrc: '/advisors/harinder-singh.png',
  },
  {
    name: 'Mr Naveen Srivastava',
    role: 'Board Advisor',
    summary: 'Executive Director & CEO, Manikaran Group, with 26+ years of experience in lithium refinery project pre-development.',
    imageSrc: '/advisors/naveen-srivastava.png',
  },
];

const processSteps = [
  {
    step: '01',
    title: 'Asset Identification',
    description: 'We identify high-potential infrastructure opportunities, starting with EV DC fast chargers.',
  },
  {
    step: '02',
    title: 'Asset Deployment & Structuring',
    description: 'Assets are deployed or partnered with, and structured into investable opportunities.',
  },
  {
    step: '03',
    title: 'Fractional Investment',
    description: 'Investors can participate with smaller amounts through fractional ownership.',
  },
  {
    step: '04',
    title: 'Revenue Generation',
    description: 'Assets generate real-world income through usage, such as EV charging demand.',
  },
  {
    step: '05',
    title: 'Returns Distribution',
    description: 'Investors receive returns based on actual asset performance.',
  },
];

const AboutPage = () => {
  return (
    <div className="min-h-screen pt-20 bg-background">
      <section className="relative overflow-hidden hero-gradient">
        <div className="absolute inset-0 opacity-[0.32] dark:opacity-45" style={{ backgroundImage: 'url(https://images.unsplash.com/photo-1497436072909-60f360e1d4b1?crop=entropy&cs=srgb&fm=jpg&q=85)', backgroundSize: 'cover', backgroundPosition: 'center' }} />
        <div className="absolute inset-0 bg-background/65 dark:bg-[#031317]/55" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-28">
          <Badge className="mb-5 bg-primary/10 text-primary border-primary/20 px-4 py-1">
            About INVESTYZ
          </Badge>
          <div className="grid lg:grid-cols-[1.2fr_0.8fr] gap-10 items-end">
            <div>
              <h1 className="text-4xl md:text-6xl font-semibold tracking-tight font-['Outfit'] mb-6">
                We are building the future of real-world infrastructure investing
              </h1>
              <div className="space-y-4 text-base md:text-lg text-muted-foreground leading-relaxed max-w-3xl">
                <p>
                  At INVESTYZ, we are building a platform that transforms real-world infrastructure into accessible investment opportunities.
                </p>
                <p>
                  We enable individuals to invest in income-generating physical assets, starting with EV DC fast charging infrastructure, and earn returns driven by real usage.
                </p>
                <p>
                  Our vision is to bridge the gap between everyday investors and high-quality infrastructure assets, making investing more tangible, transparent, and future-focused.
                </p>
              </div>
            </div>
            <Card className="border-border/60 bg-card/90">
              <CardContent className="p-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="rounded-2xl bg-primary/10 p-4">
                    <Zap className="h-6 w-6 text-primary mb-3" />
                    <p className="font-semibold">EV DC Fast Charging</p>
                    <p className="text-sm text-muted-foreground mt-1">A core live focus area anchored in real-world charging infrastructure.</p>
                  </div>
                  <div className="rounded-2xl bg-primary/10 p-4">
                    <Battery className="h-6 w-6 text-primary mb-3" />
                    <p className="font-semibold">BESS</p>
                    <p className="text-sm text-muted-foreground mt-1">A strategic near-term asset class aligned with storage-led infrastructure growth.</p>
                  </div>
                  <div className="rounded-2xl bg-primary/10 p-4">
                    <BarChart3 className="h-6 w-6 text-primary mb-3" />
                    <p className="font-semibold">Usage-Driven Returns</p>
                    <p className="text-sm text-muted-foreground mt-1">Returns linked to actual infrastructure performance.</p>
                  </div>
                  <div className="rounded-2xl bg-primary/10 p-4">
                    <Users className="h-6 w-6 text-primary mb-3" />
                    <p className="font-semibold">Future Expansion</p>
                    <p className="text-sm text-muted-foreground mt-1">Data centers and renewable energy remain part of our planned expansion roadmap.</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <section className="py-18 md:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-6">
            <Card className="border-border/60 bg-card/95">
              <CardContent className="p-8">
                <div className="flex items-center gap-3 mb-5">
                  <div className="p-3 rounded-2xl bg-primary/10">
                    <Target className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm uppercase tracking-[0.24em] text-primary/80">Our Mission</p>
                    <h2 className="text-2xl font-semibold font-['Outfit'] mt-1">Democratize access</h2>
                  </div>
                </div>
                <p className="text-muted-foreground leading-relaxed">
                  To democratize access to real-world infrastructure investments by enabling individuals to participate in income-generating assets and build sustainable long-term wealth.
                </p>
              </CardContent>
            </Card>

            <Card className="border-border/60 bg-card/95">
              <CardContent className="p-8">
                <div className="flex items-center gap-3 mb-5">
                  <div className="p-3 rounded-2xl bg-primary/10">
                    <Route className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm uppercase tracking-[0.24em] text-primary/80">Our Vision</p>
                    <h2 className="text-2xl font-semibold font-['Outfit'] mt-1">Infrastructure powering the future</h2>
                  </div>
                </div>
                <p className="text-muted-foreground leading-relaxed">
                  To become a leading platform for investing in the infrastructure powering the future spanning energy, mobility, and digital ecosystems.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <section className="py-18 md:py-24 bg-gradient-to-b from-background to-muted/25">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-10">
            <p className="text-sm uppercase tracking-[0.24em] text-primary/80">Meet Our Team</p>
            <h2 className="text-3xl md:text-5xl font-semibold font-['Outfit'] mt-2">
              Founders & Core Team of INVESTYZ
            </h2>
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            {teamMembers.map((member) => (
              <Card key={member.name} className="overflow-hidden border-border/60 bg-card/95">
                <CardContent className="p-0">
                  <div className="grid md:grid-cols-[240px_1fr]">
                    <div className="min-h-[280px] border-b md:border-b-0 md:border-r border-border/60 bg-gradient-to-br from-primary/15 via-accent/10 to-transparent p-6 flex items-center justify-center">
                      <div className="w-full max-w-[220px] aspect-[4/5] overflow-hidden rounded-[28px] border border-border/60 bg-background/90 shadow-lg">
                        <img
                          src={member.imageSrc}
                          alt={member.name}
                          className="h-full w-full object-cover object-center"
                          loading="lazy"
                          decoding="async"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                            const fallback = e.currentTarget.nextElementSibling;
                            if (fallback) fallback.style.display = 'flex';
                          }}
                        />
                        <div
                          style={{ display: 'none' }}
                          className="h-full w-full items-center justify-center text-center px-4 text-xs uppercase tracking-[0.18em] text-primary/80 bg-background/85"
                        >
                          {member.placeholder}
                        </div>
                      </div>
                    </div>
                    <div className="p-8">
                      <p className="text-sm uppercase tracking-[0.24em] text-primary/80 mb-2">{member.role}</p>
                      <h3 className="text-2xl font-semibold font-['Outfit'] mb-4">{member.name}</h3>
                      <p className="text-muted-foreground leading-relaxed">{member.summary}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="py-18 md:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-10">
            <p className="text-sm uppercase tracking-[0.24em] text-primary/80">Board of Advisors</p>
            <h2 className="text-3xl md:text-5xl font-semibold font-['Outfit'] mt-2">
              Strategic guidance across technology, energy, and global markets
            </h2>
          </div>

          <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-5">
            {advisors.map((advisor) => (
              <Card key={advisor.name} className="border-border/60 bg-card/95 h-full">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="h-20 w-20 overflow-hidden rounded-2xl border border-border/60 bg-background/90 flex-shrink-0 shadow-sm">
                      <img
                        src={advisor.imageSrc}
                        alt={advisor.name}
                        className="h-full w-full object-cover object-center"
                        loading="lazy"
                        decoding="async"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                          const fallback = e.currentTarget.nextElementSibling;
                          if (fallback) fallback.style.display = 'flex';
                        }}
                      />
                      <div
                        style={{ display: 'none' }}
                        className="h-full w-full items-center justify-center text-[10px] uppercase tracking-[0.14em] text-primary/75 text-center px-1 bg-background/80"
                      >
                        Advisor
                      </div>
                    </div>
                    <div>
                      <p className="text-lg font-semibold font-['Outfit']">{advisor.name}</p>
                      <p className="text-sm text-primary mb-3">{advisor.role}</p>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed mt-4">{advisor.summary}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="py-18 md:py-24 bg-gradient-to-b from-muted/25 to-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-10 max-w-2xl">
            <p className="text-sm uppercase tracking-[0.24em] text-primary/80">Our Process</p>
            <h2 className="text-3xl md:text-5xl font-semibold font-['Outfit'] mt-2">
              We make infrastructure investing simple, structured, and transparent
            </h2>
          </div>

          <div className="grid md:grid-cols-2 xl:grid-cols-5 gap-4">
            {processSteps.map((item) => (
              <Card key={item.step} className="border-border/60 bg-card/95 h-full">
                <CardContent className="p-6">
                  <p className="text-4xl font-bold text-primary/20 font-['Outfit'] mb-4">{item.step}</p>
                  <h3 className="text-lg font-semibold font-['Outfit'] mb-3">{item.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{item.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="py-18 md:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Card className="border-border/60 bg-gradient-to-br from-primary/10 via-card to-accent/10 overflow-hidden">
            <CardContent className="p-8 md:p-10">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                <div className="max-w-2xl">
                  <p className="text-sm uppercase tracking-[0.24em] text-primary/80">Contact Us</p>
                  <h2 className="text-3xl md:text-4xl font-semibold font-['Outfit'] mt-2 mb-3">
                    Let&apos;s build the future of infrastructure investing together
                  </h2>
                  <p className="text-muted-foreground leading-relaxed">
                    Reach out to explore partnerships, platform opportunities, or to learn more about INVESTYZ.
                  </p>
                </div>
                <Button size="lg" className="rounded-full px-8 py-6 text-lg" asChild>
                  <a href="mailto:hello@investyz.io">
                    <Mail className="mr-2 h-5 w-5" />
                    Contact Us
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </a>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
};

export default AboutPage;

