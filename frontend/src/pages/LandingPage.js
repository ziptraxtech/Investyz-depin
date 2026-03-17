import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { useAuth } from '../context/AuthContext';
import { getFrontendApiUrl } from '../lib/apiConfig';
import { FALLBACK_SEGMENTS } from '../data/segmentFallbacks';
import {
  ArrowRight,
  Wallet,
  PiggyBank,
  TrendingUp,
  Shield,
  Leaf,
  Zap,
  Server,
  Battery,
  Sun,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Brain,
  Cpu,
  Car,
  Plane,
  PlugZap,
  Activity,
  Timer,
  Target,
  Gauge,
  Route,
} from 'lucide-react';

const API_URL = getFrontendApiUrl();
const LANDING_SEGMENT_PRIORITY = {
  'battery-storage': 1,
  'ev-charging': 2,
  'data-centers': 3,
  'renewable-energy': 4,
  'green-credits': 5,
};

const LandingPage = () => {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const [segments, setSegments] = useState([]);
  const [featureIndex, setFeatureIndex] = useState(0);
  const [isFeatureSliderPaused, setIsFeatureSliderPaused] = useState(false);

  useEffect(() => {
    const fetchSegments = async () => {
      // If no backend, use mock data
      if (!API_URL || API_URL === '') {
        setSegments(FALLBACK_SEGMENTS);
        return;
      }
      
      try {
        const response = await fetch(`${API_URL}/api/segments`);
        if (response.ok) {
          const result = await response.json();
          // Handle both formats: direct array or {success, data} wrapper
          const data = result.data || result;
          setSegments(Array.isArray(data) ? data : FALLBACK_SEGMENTS);
        }
      } catch (error) {
        console.error('Failed to fetch segments:', error);
        // Fallback to mock data on error
        setSegments(FALLBACK_SEGMENTS);
      }
    };
    fetchSegments();
  }, []);

  const getIcon = (iconName) => {
    const icons = {
      Server: Server,
      Battery: Battery,
      Zap: Zap,
      Sun: Sun,
      Leaf: Leaf,
    };
    const Icon = icons[iconName] || Leaf;
    return <Icon className="h-6 w-6" />;
  };

  const sortedSegments = [...segments].sort((a, b) => {
    const aPriority = LANDING_SEGMENT_PRIORITY[a.segment_id] ?? Number.MAX_SAFE_INTEGER;
    const bPriority = LANDING_SEGMENT_PRIORITY[b.segment_id] ?? Number.MAX_SAFE_INTEGER;
    if (aPriority !== bPriority) return aPriority - bPriority;
    return String(a.name || '').localeCompare(String(b.name || ''));
  });

  const features = [
    {
      icon: TrendingUp,
      title: 'High Yield Returns',
      description: 'Earn up to 18% APY on your investments backed by real-world infrastructure assets.',
      stat: '18%',
      statLabel: 'Max APY',
    },
    {
      icon: Shield,
      title: 'Real Asset Backing',
      description: 'Every token is backed by physical infrastructure generating real revenue.',
      stat: '$190M+',
      statLabel: 'Total TVL',
    },
    {
      icon: Leaf,
      title: 'Carbon Negative',
      description: 'Your investments actively reduce carbon emissions and support sustainable growth.',
      stat: '50K+',
      statLabel: 'Tons COâ‚‚ Offset',
    },
    {
      icon: PiggyBank,
      title: 'Daily Payouts',
      description: 'Receive your rewards daily, directly to your connected Polygon wallet.',
      stat: '13K+',
      statLabel: 'Active Investors',
    },
  ];

  const howItWorks = [
    {
      step: '01',
      title: 'Connect Your Wallet',
      description: 'Link your MetaMask or Trust Wallet to access the platform on Polygon network.',
    },
    {
      step: '02',
      title: 'Choose Your Segment',
      description: 'Select from data centers, batteries, EV charging, renewable energy, or green credits.',
    },
    {
      step: '03',
      title: 'Invest & Earn',
      description: 'Pick a plan that fits your goals and start earning daily rewards immediately.',
    },
  ];

  useEffect(() => {
    if (isFeatureSliderPaused || features.length <= 1) return undefined;

    const timer = setInterval(() => {
      setFeatureIndex((prev) => (prev + 1) % features.length);
    }, 2000);

    return () => clearInterval(timer);
  }, [isFeatureSliderPaused, features.length]);

  useEffect(() => {
    const handleFeatureArrowKeys = (event) => {
      const tag = event.target?.tagName?.toLowerCase?.() || '';
      const isTypingContext =
        tag === 'input' ||
        tag === 'textarea' ||
        tag === 'select' ||
        event.target?.isContentEditable;

      if (isTypingContext) return;

      if (event.key === 'ArrowRight') {
        event.preventDefault();
        setFeatureIndex((prev) => (prev + 1) % features.length);
      } else if (event.key === 'ArrowLeft') {
        event.preventDefault();
        setFeatureIndex((prev) => (prev - 1 + features.length) % features.length);
      }
    };

    window.addEventListener('keydown', handleFeatureArrowKeys);
    return () => window.removeEventListener('keydown', handleFeatureArrowKeys);
  }, [features.length]);

  const goToNextFeature = () => {
    setFeatureIndex((prev) => (prev + 1) % features.length);
  };

  const goToPreviousFeature = () => {
    setFeatureIndex((prev) => (prev - 1 + features.length) % features.length);
  };

  const trustCertifications = [
    {
      id: 'startup-india',
      title: 'Startup India Certified',
      logo: '/certifications/startup-india.png',
      logoAlt: 'Startup India logo',
      glow: 'from-cyan-500/20 to-transparent',
      border: 'border-cyan-400/40',
      checkColor: 'text-cyan-300',
    },
    {
      id: 'msme',
      title: 'MSME Registered',
      logo: '/certifications/msme.png',
      logoAlt: 'MSME logo',
      glow: 'from-teal-500/20 to-transparent',
      border: 'border-teal-400/40',
      checkColor: 'text-teal-300',
    },
    {
      id: 'iso-9001',
      title: 'ISO 9001 Certified',
      logo: '/certifications/iso-9001.svg?v=2',
      logoAlt: 'ISO 9001 logo',
      glow: 'from-sky-500/20 to-transparent',
      border: 'border-sky-400/40',
      checkColor: 'text-sky-300',
    },
    {
      id: 'iso-14001',
      title: 'ISO 14001 Certified',
      logo: '/certifications/iso-14001.svg?v=2',
      logoAlt: 'ISO 14001 logo',
      glow: 'from-emerald-500/20 to-transparent',
      border: 'border-emerald-400/40',
      checkColor: 'text-emerald-300',
    },
  ];

  // Agentic AI Use Cases
  const agenticAIUseCases = [
    {
      icon: PlugZap,
      title: 'EV DC Fast Charging',
      subtitle: 'Autonomous Maintenance Engines',
      description: 'If a charger fails a handshake with a vehicle, the agent initiates a remote self-reboot, updates its status on ZeFlash.App to "Maintenance," and reroutes incoming drivers to the nearest functional stall.',
      result: '99% uptime for CPOs',
      resultDetail: 'by resolving common software glitches before a driver even arrives',
      gradient: 'from-yellow-500 to-orange-500',
    },
    {
      icon: Server,
      title: 'Data Centers',
      subtitle: 'Zero-Downtime Power Orchestration',
      description: 'The AI agents act as "Virtual Facility Managers." They monitor electricity pricing and grid load to decideâ€”without human inputâ€”when to switch the data center from grid power to BESS, ensuring the lowest carbon footprint and cost.',
      result: '30% reduction in energy costs',
      resultDetail: 'through autonomous demand-response participation',
      gradient: 'from-blue-500 to-cyan-500',
    },
    {
      icon: Battery,
      title: 'Energy Storage Systems (BESS)',
      subtitle: 'The Self-Balancing Grid',
      description: 'When a thermal anomaly is detected, the agent doesn\'t just alert a technician. It autonomously throttles the specific cell\'s load, redirects energy flow to healthier modules, and orders a replacement part via the supply chain.',
      result: '40% increase in component life',
      resultDetail: 'by eliminating human latency in critical safety decisions',
      gradient: 'from-emerald-500 to-teal-500',
    },
    {
      icon: Car,
      title: 'EV Fleets',
      subtitle: 'Dynamic Mission Planning',
      description: 'Agents analyze real-time factors like weather, terrain, and individual driver behavior to dynamically adjust a vehicle\'s route. If a battery\'s health drops mid-route, the agent automatically books a "flash-charge" slot at an upcoming station.',
      result: '60% reduction in roadside breakdowns',
      resultDetail: 'and optimized delivery windows',
      gradient: 'from-cyan-500 to-teal-500',
    },
    {
      icon: Plane,
      title: 'eVTOL & Drones',
      subtitle: 'Mission-Critical Flight Agency',
      description: 'During flight, the agent constantly runs "Safety-to-Fly" simulations. If it detects a voltage sag that compromises landing safety, it takes over power-splitting between battery sources and autonomously designates an emergency landing pad.',
      result: 'Unparalleled safety benchmarks',
      resultDetail: 'for Urban Air Mobility (UAM)',
      gradient: 'from-sky-500 to-cyan-500',
    },
  ];

  const formatTVL = (value) => {
    if (value >= 1000000) {
      return `$${(value / 1000000).toFixed(1)}M`;
    }
    return `$${(value / 1000).toFixed(0)}K`;
  };

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center bg-[#04161b] grain overflow-hidden">
        {/* Background Image */}
        <div
          className="absolute inset-0 opacity-45 dark:opacity-50"
          style={{
            backgroundImage: 'url(https://images.unsplash.com/photo-1654419189892-d8814766c4fd?crop=entropy&cs=srgb&fm=jpg&q=85)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        />
        <div className="absolute inset-0 bg-[#031317]/55" />
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-32 md:py-40">
          <div className="max-w-3xl">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-teal-500/10 border border-teal-400/30 mb-8">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-teal-400"></span>
              </span>
              <span className="text-sm font-medium text-teal-100">Live on Polygon Network</span>
            </div>

            {/* Headline */}
            <h1 className="text-5xl md:text-7xl font-bold tracking-tight leading-[1.1] mb-6 font-['Outfit'] text-white">
              Invest in the{' '}
              <span className="text-gradient">Infrastructure</span>{' '}
              of Tomorrow
            </h1>

            {/* Subheadline */}
            <p className="text-lg md:text-xl leading-relaxed text-teal-50/90 mb-10 max-w-2xl">
              Earn sustainable yields by investing in real-world assets like data centers, 
              battery storage, EV charging, and renewable energy through decentralized 
              physical infrastructure on Polygon.
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-4">
              <Button
                size="lg"
                className="rounded-full px-8 py-6 text-lg font-medium shadow-lg hover:shadow-xl transition-all hover:-translate-y-1"
                onClick={() => user ? navigate('/dashboard') : login()}
                data-testid="hero-cta-primary"
              >
                Start Investing
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button
                variant="default"
                size="lg"
                className="rounded-full px-8 py-6 text-lg font-medium !bg-cyan-500 !text-slate-950 hover:!bg-cyan-400 shadow-md hover:shadow-lg"
                onClick={() => navigate('/segments')}
                data-testid="hero-cta-secondary"
              >
                View Segments
              </Button>
            </div>

            {/* Trust Badges */}
            <div className="mt-12 flex flex-wrap items-center gap-8">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-primary" />
                <span className="text-sm text-teal-50/85">Audited Smart Contracts</span>
              </div>
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                <span className="text-sm text-teal-50/85">Non-Custodial</span>
              </div>
              <div className="flex items-center gap-2">
                <Wallet className="h-5 w-5 text-primary" />
                <span className="text-sm text-teal-50/85">Multi-Wallet Support</span>
              </div>
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
          <div className="w-6 h-10 rounded-full border-2 border-muted-foreground/30 flex items-start justify-center p-2">
            <div className="w-1 h-2 rounded-full bg-muted-foreground/50" />
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 md:py-32 bg-background" id="features">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-semibold tracking-tight mb-4 font-['Outfit'] text-white">
              Why Choose <span className="text-gradient">Investyz</span>?
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Combining the power of DeFi with real-world sustainable infrastructure
            </p>
          </div>

          <div
            className="max-w-5xl mx-auto"
            onMouseEnter={() => setIsFeatureSliderPaused(true)}
            onMouseLeave={() => setIsFeatureSliderPaused(false)}
          >
            <div
              className="overflow-hidden rounded-2xl cursor-pointer"
              onClick={goToNextFeature}
              title="Click to view next card"
            >
              <div
                className="flex transition-transform duration-700 ease-out"
                style={{ transform: `translateX(-${featureIndex * 100}%)` }}
              >
                {features.map((feature, index) => (
                  <div key={index} className="w-full shrink-0">
                    <Card
                      className="p-10 md:p-14 rounded-2xl bg-card border border-border/50 hover:border-primary/30 transition-all group min-h-[360px] md:min-h-[420px]"
                      data-testid={`feature-card-${index}`}
                    >
                      <CardContent className="p-0 h-full flex flex-col">
                        <div className="p-4 rounded-xl bg-primary/10 w-fit mb-7 group-hover:bg-primary/20 transition-colors">
                          <feature.icon className="h-9 w-9 text-primary" />
                        </div>
                        <h3 className="text-3xl md:text-4xl font-semibold mb-4 font-['Outfit']">{feature.title}</h3>
                        <p className="text-muted-foreground mb-10 flex-grow text-lg md:text-xl leading-relaxed">{feature.description}</p>
                        <div className="mt-auto">
                          <span className="text-5xl md:text-6xl font-bold text-gradient">{feature.stat}</span>
                          <p className="text-base text-muted-foreground mt-1">{feature.statLabel}</p>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-center gap-3 mt-7">
              <button
                type="button"
                onClick={goToPreviousFeature}
                className="h-9 w-9 rounded-full border border-primary/40 bg-primary/10 hover:bg-primary/20 flex items-center justify-center text-primary transition-colors"
                aria-label="Previous feature slide"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              {features.map((_, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => setFeatureIndex(index)}
                  className={`h-3 rounded-full transition-all ${
                    featureIndex === index ? 'w-10 bg-primary' : 'w-3 bg-primary/35 hover:bg-primary/60'
                  }`}
                  aria-label={`Go to feature slide ${index + 1}`}
                />
              ))}
              <button
                type="button"
                onClick={goToNextFeature}
                className="h-9 w-9 rounded-full border border-primary/40 bg-primary/10 hover:bg-primary/20 flex items-center justify-center text-primary transition-colors"
                aria-label="Next feature slide"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Trust & Certifications */}
      <section className="py-20 md:py-28 bg-gradient-to-b from-[#031722] via-[#072033] to-[#06243a]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="text-3xl md:text-5xl font-semibold tracking-tight font-['Outfit'] text-white">
              Trusted & Certified Platform
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            {trustCertifications.map((cert) => (
                <Card
                  key={cert.id}
                  className={`relative overflow-hidden rounded-2xl bg-[#102f4e]/90 ${cert.border} hover:border-primary/80 transition-all duration-300 hover:-translate-y-2 hover:scale-[1.03] hover:shadow-[0_18px_40px_rgba(34,211,238,0.25)] group`}
                  data-testid={`trust-cert-${cert.id}`}
                >
                  <div className={`absolute inset-0 bg-gradient-to-br ${cert.glow} opacity-70 group-hover:opacity-100 transition-opacity duration-300`} />
                  <CardContent className="relative p-4 md:p-5">
                    <div className={`absolute right-3 top-3 ${cert.checkColor} group-hover:scale-110 transition-transform duration-300`}>
                      <CheckCircle2 className="h-5 w-5 drop-shadow-[0_0_10px_rgba(45,212,191,0.6)]" />
                    </div>

                    <div className="w-full bg-white rounded-2xl p-3 mb-4 shadow-lg group-hover:shadow-[0_12px_30px_rgba(255,255,255,0.35)] transition-shadow duration-300">
                      <img
                        src={cert.logo}
                        alt={cert.logoAlt}
                        className="w-full h-14 md:h-16 object-contain group-hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                        onLoad={(e) => {
                          e.currentTarget.style.display = 'block';
                          const fallback = e.currentTarget.nextElementSibling;
                          if (fallback) fallback.style.display = 'none';
                        }}
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                          const fallback = e.currentTarget.nextElementSibling;
                          if (fallback) fallback.style.display = 'block';
                        }}
                      />
                      <div style={{ display: 'none' }} className="text-slate-900 text-center font-semibold text-xs md:text-sm">
                        {cert.logoAlt}
                      </div>
                    </div>

                    <h3 className="text-lg md:text-xl font-semibold text-white text-center font-['Outfit'] leading-snug group-hover:text-cyan-100 transition-colors duration-300">
                      {cert.title}
                    </h3>
                  </CardContent>
                </Card>
              ))}
          </div>
        </div>
      </section>

            {/* AI-Powered Segments Section */}
      <section className="py-20 md:py-32 bg-gradient-to-b from-[#03141a] to-[#08252b] text-white relative overflow-hidden" id="segments">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, rgba(255,255,255,0.15) 1px, transparent 0)`,
            backgroundSize: '40px 40px',
          }} />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-12">
            <div>
              <Badge className="mb-4 bg-teal-500/20 text-teal-100 border-teal-400/40 px-4 py-1">
                <Brain className="h-4 w-4 mr-2" />
                Powered by Agentic AI
              </Badge>
              <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-4 font-['Outfit']">
                AI-Powered <span className="bg-gradient-to-r from-teal-300 to-cyan-300 bg-clip-text text-transparent">Investment Segments</span>
              </h2>
              <p className="text-lg md:text-xl text-slate-200 max-w-4xl leading-relaxed">
                By integrating Agentic AI—autonomous systems that can reason, plan, and act independently—we move beyond diagnostics into self-diagnosing infrastructure while you diversify across sustainable categories.
              </p>
            </div>
            <Button
              variant="outline"
              className="rounded-full gap-2 border-slate-600 hover:border-slate-400"
              onClick={() => navigate('/segments')}
              data-testid="view-all-segments-btn"
            >
              View All Segments
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            {sortedSegments.slice(0, 6).map((segment, index) => {
              const useCase = agenticAIUseCases[index % agenticAIUseCases.length];
              return (
                <Link
                  key={segment.segment_id}
                  to={`/segments/${segment.segment_id}`}
                  className="group"
                  data-testid={`segment-card-${segment.segment_id}`}
                >
                  <Card className="overflow-hidden h-full bg-slate-800/50 border-slate-700/50 hover:border-slate-500 transition-all hover:-translate-y-1 backdrop-blur-sm">
                    <div className="aspect-video relative overflow-hidden">
                      <img
                        src={segment.image_url}
                        alt={segment.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
                      <div className="absolute top-4 left-4">
                        <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium bg-cyan-500/20 border border-cyan-300/40 text-cyan-100">
                          <Cpu className="h-3.5 w-3.5" />
                          {useCase.subtitle}
                        </span>
                      </div>
                      <div className="absolute bottom-4 left-4 right-4">
                        <div className="flex items-center gap-2 text-white">
                          <div className="p-2 rounded-lg bg-white/20 backdrop-blur-sm">
                            {getIcon(segment.icon)}
                          </div>
                          <h3 className="text-lg font-semibold">{segment.name}</h3>
                        </div>
                      </div>
                    </div>
                    <CardContent className="p-5">
                      <p className="text-sm font-medium text-cyan-300 mb-2 flex items-center gap-2">
                        <Target className="h-4 w-4" />
                        {useCase.result}
                      </p>
                      <p className="text-slate-200 text-sm leading-relaxed mb-4 line-clamp-3">
                        {useCase.description}
                      </p>
                      <div className="flex justify-between items-center pt-4 border-t border-slate-700/50">
                        <div>
                          <p className="text-xs text-slate-300">Total TVL</p>
                          <p className="text-lg font-bold text-primary">{formatTVL(segment.total_tvl)}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-slate-300">Investors</p>
                          <p className="text-lg font-semibold text-white">{segment.investors_count.toLocaleString()}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pt-8 border-t border-slate-700/50">
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Activity className="h-5 w-5 text-cyan-300" />
                <span className="text-3xl font-bold text-white">24/7</span>
              </div>
              <p className="text-sm text-slate-300">Autonomous Monitoring</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Timer className="h-5 w-5 text-emerald-400" />
                <span className="text-3xl font-bold text-white">&lt;1s</span>
              </div>
              <p className="text-sm text-slate-300">Response Time</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Gauge className="h-5 w-5 text-cyan-300" />
                <span className="text-3xl font-bold text-white">99.9%</span>
              </div>
              <p className="text-sm text-slate-300">System Uptime</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Route className="h-5 w-5 text-teal-300" />
                <span className="text-3xl font-bold text-white">Zero</span>
              </div>
              <p className="text-sm text-slate-300">Human Latency</p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 md:py-32 bg-background" id="how-it-works">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-semibold tracking-tight mb-4 font-['Outfit'] text-white">
              How It <span className="text-gradient">Works</span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Get started in three simple steps
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {howItWorks.map((item, index) => (
              <div
                key={index}
                className="relative"
                data-testid={`how-it-works-${index}`}
              >
                {index < howItWorks.length - 1 && (
                  <div className="hidden md:block absolute top-12 left-full w-full h-0.5 bg-gradient-to-r from-primary/50 to-transparent -translate-x-8" />
                )}
                <Card className="p-8 rounded-2xl bg-card/50 border border-border/50 hover:border-primary/30 transition-colors h-full">
                  <span className="text-6xl font-bold text-primary/20 font-['Outfit']">{item.step}</span>
                  <h3 className="text-xl font-semibold mt-4 mb-3 font-['Outfit']">{item.title}</h3>
                  <p className="text-muted-foreground">{item.description}</p>
                </Card>
              </div>
            ))}
          </div>

          <div className="text-center mt-12">
            <Button
              size="lg"
              className="rounded-full px-8 py-6 text-lg font-medium shadow-lg hover:shadow-xl transition-all hover:-translate-y-1"
              onClick={() => user ? navigate('/dashboard') : login()}
              data-testid="how-it-works-cta"
            >
              Get Started Now
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 md:py-32 bg-gradient-to-br from-primary/10 via-background to-accent/10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl md:text-5xl font-semibold tracking-tight mb-6 font-['Outfit']">
            <span className="text-teal-100">Ready to Invest in a</span>{' '}
            <span className="text-gradient">Sustainable Future</span>?
          </h2>
          <p className="text-lg text-muted-foreground mb-10 max-w-2xl mx-auto">
            Join thousands of investors earning yields while powering the green economy.
            Start with as little as $100.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Button
              size="lg"
              className="rounded-full px-8 py-6 text-lg font-medium shadow-lg hover:shadow-xl transition-all hover:-translate-y-1"
              onClick={() => user ? navigate('/dashboard') : login()}
              data-testid="cta-primary"
            >
              Start Investing
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="rounded-full px-8 py-6 text-lg font-medium border-2 border-cyan-400/60 bg-cyan-500 text-slate-950 hover:bg-cyan-400 hover:border-cyan-300"
              onClick={() => window.open('https://polygon.technology', '_blank')}
              data-testid="cta-learn-more"
            >
              Learn About Polygon
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default LandingPage;





