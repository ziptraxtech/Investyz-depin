import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Server, Battery, Zap, Sun, Leaf, Search, TrendingUp, Users, ArrowRight } from 'lucide-react';

const API_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';

const FALLBACK_SEGMENTS = [
  {
    segment_id: 'battery-storage',
    name: 'Battery Energy Storage',
    description: 'Support grid-scale battery storage systems that store renewable energy and stabilize power grids.',
    short_description: 'Store energy, power futures',
    image_url: 'https://images.unsplash.com/photo-1715605569694-4cc47c9fb535?crop=entropy&cs=srgb&fm=jpg&q=85',
    icon: 'Battery',
    features: ['Grid Stabilization', 'Peak Shaving', 'Frequency Regulation'],
    total_tvl: 32000000,
    investors_count: 1923,
  },
  {
    segment_id: 'ev-charging',
    name: 'EV Fast Charging',
    description: 'Accelerate the electric vehicle revolution by investing in fast-charging infrastructure.',
    short_description: 'Charge the future',
    image_url: 'https://images.unsplash.com/photo-1765272088009-100c96a4cd4e?crop=entropy&cs=srgb&fm=jpg&q=85',
    icon: 'Zap',
    features: ['350kW Ultra-Fast', 'Strategic Locations', '24/7 Availability'],
    total_tvl: 28000000,
    investors_count: 3421,
  },
  {
    segment_id: 'data-centers',
    name: 'Data Centers',
    description: 'Invest in sustainable, energy-efficient data centers powering the digital economy.',
    short_description: 'Power the cloud sustainably',
    image_url: 'https://images.unsplash.com/photo-1733187633171-3b1c0c6ce708?crop=entropy&cs=srgb&fm=jpg&q=85',
    icon: 'Server',
    features: ['100% Renewable Energy', 'PUE < 1.2', 'Tier 4 Certified'],
    total_tvl: 45000000,
    investors_count: 2847,
  },
  {
    segment_id: 'renewable-energy',
    name: 'Renewable Energy Plants',
    description: 'Invest directly in solar farms, wind parks, and hydroelectric facilities.',
    short_description: "Harvest nature's power",
    image_url: 'https://images.unsplash.com/photo-1755585129999-7b29cf3baebe?crop=entropy&cs=srgb&fm=jpg&q=85',
    icon: 'Sun',
    features: ['20+ Year PPAs', 'Carbon Neutral', 'Diversified Portfolio'],
    total_tvl: 67000000,
    investors_count: 4156,
  },
  {
    segment_id: 'green-credits',
    name: 'Green Credit Projects',
    description: 'Participate in carbon credit and environmental offset projects.',
    short_description: 'Offset, earn, impact',
    image_url: 'https://images.unsplash.com/photo-1683444595829-e74e68fcce22?crop=entropy&cs=srgb&fm=jpg&q=85',
    icon: 'Leaf',
    features: ['Verified Credits', 'Biodiversity Projects', 'Transparent Tracking'],
    total_tvl: 18000000,
    investors_count: 1287,
  },
];

const normalizeSegmentsPayload = (result) => {
  const data = result?.data || result;
  if (!Array.isArray(data)) return [];
  return data.filter((segment) =>
    segment &&
    typeof segment.name === 'string' &&
    typeof segment.short_description === 'string' &&
    Array.isArray(segment.features)
  );
};

const SEGMENT_PRIORITY = {
  'battery-storage': 1,
  'ev-charging': 2,
  'data-centers': 3,
  'renewable-energy': 4,
  'green-credits': 5,
};

const sortSegmentsForDisplay = (list) =>
  [...list].sort((a, b) => {
    const aPriority = SEGMENT_PRIORITY[a.segment_id] ?? Number.MAX_SAFE_INTEGER;
    const bPriority = SEGMENT_PRIORITY[b.segment_id] ?? Number.MAX_SAFE_INTEGER;
    if (aPriority !== bPriority) return aPriority - bPriority;
    return String(a.name || '').localeCompare(String(b.name || ''));
  });

// Mock data for when backend is not available
const mockSegments = [
  {
    id: 'renewable-energy',
    name: 'Renewable Energy',
    slug: 'renewable-energy',
    description: 'Invest in solar and wind energy infrastructure projects',
    icon: 'Sun',
    total_tvl: 2500000,
    investors_count: 1250,
    apy_range: { min: 8, max: 15 },
    risk_level: 'Low',
    min_investment: 100
  },
  {
    id: 'data-centers',
    name: 'Data Centers',
    slug: 'data-centers',
    description: 'Green data center infrastructure investments',
    icon: 'Server',
    total_tvl: 3200000,
    investors_count: 890,
    apy_range: { min: 10, max: 18 },
    risk_level: 'Medium',
    min_investment: 500
  },
  {
    id: 'ev-charging',
    name: 'EV Charging',
    slug: 'ev-charging',
    description: 'Electric vehicle charging station networks',
    icon: 'Zap',
    total_tvl: 1800000,
    investors_count: 650,
    apy_range: { min: 12, max: 20 },
    risk_level: 'Medium',
    min_investment: 250
  }
];

const SegmentsPage = () => {
  const [segments, setSegments] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState('');

  useEffect(() => {
    const fetchSegments = async () => {
      setLoading(true);
      setFetchError('');

      try {
        const endpoint = `${API_URL}/api/segments`;
        let loadedSegments = [];

        for (let attempt = 0; attempt < 3; attempt += 1) {
          try {
            const response = await fetch(endpoint, { cache: 'no-store' });
            if (!response.ok) {
              throw new Error(`HTTP ${response.status}`);
            }
            const result = await response.json();
            loadedSegments = normalizeSegmentsPayload(result);
            if (loadedSegments.length > 0) break;
          } catch (attemptError) {
            if (attempt === 2) throw attemptError;
          }
        }

        if (loadedSegments.length > 0) {
          const sortedSegments = sortSegmentsForDisplay(loadedSegments);
          setSegments(sortedSegments);
          localStorage.setItem('segments_cache_v1', JSON.stringify(sortedSegments));
        } else {
          throw new Error('Empty segments response');
        }
      } catch (error) {
        console.error('Failed to fetch segments:', error);
        const cachedSegments = localStorage.getItem('segments_cache_v1');
        if (cachedSegments) {
          try {
            const parsed = JSON.parse(cachedSegments);
            const normalized = normalizeSegmentsPayload(parsed);
            if (normalized.length > 0) {
              setSegments(sortSegmentsForDisplay(normalized));
              setFetchError('Live data is temporarily unavailable. Showing cached segments.');
              return;
            }
          } catch (cacheError) {
            console.error('Failed to parse cached segments:', cacheError);
          }
        }

        setSegments(sortSegmentsForDisplay(FALLBACK_SEGMENTS));
        setFetchError('Live data is temporarily unavailable. Showing fallback segments.');
      } finally {
        setLoading(false);
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
    return <Icon className="h-8 w-8" />;
  };

  const formatTVL = (value) => {
    if (value >= 1000000) {
      return `$${(value / 1000000).toFixed(1)}M`;
    }
    return `$${(value / 1000).toFixed(0)}K`;
  };

  const filteredSegments = segments.filter((segment) => {
    const name = String(segment.name || '').toLowerCase();
    const description = String(segment.description || segment.short_description || '').toLowerCase();
    const search = searchTerm.toLowerCase();
    return name.includes(search) || description.includes(search);
  });

  const totalTVL = segments.reduce((sum, seg) => sum + seg.total_tvl, 0);
  const totalInvestors = segments.reduce((sum, seg) => sum + seg.investors_count, 0);

  if (loading) {
    return (
      <div className="min-h-screen pt-20 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-20 pb-16">
      {/* Hero */}
      <section className="hero-gradient grain py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight leading-[1.1] mb-6 font-['Outfit']">
              <span className="text-white">Investment</span>{' '}<span className="text-gradient">Segments</span>
            </h1>
            <p className="text-lg md:text-xl leading-relaxed text-muted-foreground mb-8">
              Explore our diverse portfolio of sustainable infrastructure assets. 
              Each segment offers unique opportunities to earn yields while supporting the green economy.
            </p>

            {/* Stats */}
            <div className="flex flex-wrap gap-8 mb-8">
              <div>
                <div className="flex items-center gap-2 text-primary mb-1">
                  <TrendingUp className="h-5 w-5" />
                  <span className="text-2xl font-bold">{formatTVL(totalTVL)}</span>
                </div>
                <p className="text-sm text-muted-foreground">Total Value Locked</p>
              </div>
              <div>
                <div className="flex items-center gap-2 text-primary mb-1">
                  <Users className="h-5 w-5" />
                  <span className="text-2xl font-bold">{totalInvestors.toLocaleString()}</span>
                </div>
                <p className="text-sm text-muted-foreground">Active Investors</p>
              </div>
            </div>

            {/* Search */}
            <div className="relative max-w-md">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search segments..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-12 h-12 rounded-full bg-background/80 backdrop-blur-sm"
                data-testid="segments-search"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Segments Grid */}
      <section className="py-12 md:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {fetchError && (
            <div className="mb-6 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
              {fetchError}
            </div>
          )}

          <div className="grid md:grid-cols-2 gap-8">
            {filteredSegments.map((segment) => (
              <Link
                key={segment.segment_id}
                to={`/segments/${segment.segment_id}`}
                className="group"
                data-testid={`segment-${segment.segment_id}`}
              >
                <Card className="overflow-hidden h-full hover:border-primary/30 transition-all hover:-translate-y-2 duration-300">
                  <div className="grid md:grid-cols-2">
                    {/* Image */}
                    <div className="aspect-square md:aspect-auto relative overflow-hidden">
                      <img
                        src={segment.image_url}
                        alt={segment.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-r from-black/40 to-transparent md:bg-gradient-to-t" />
                      <div className="absolute top-4 left-4 p-3 rounded-xl bg-white/20 backdrop-blur-sm text-white">
                        {getIcon(segment.icon)}
                      </div>
                    </div>

                    {/* Content */}
                    <CardContent className="p-6 flex flex-col">
                      <h2 className="text-2xl font-bold mb-3 font-['Outfit'] group-hover:text-primary transition-colors">
                        {segment.name}
                      </h2>
                      <p className="text-muted-foreground mb-6 flex-grow">
                        {segment.short_description}
                      </p>

                      {/* Features */}
                      <div className="flex flex-wrap gap-2 mb-6">
                        {segment.features.slice(0, 3).map((feature, idx) => (
                          <span
                            key={idx}
                            className="px-3 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary"
                          >
                            {feature}
                          </span>
                        ))}
                      </div>

                      {/* Stats */}
                      <div className="flex justify-between items-center pt-4 border-t border-border">
                        <div>
                          <p className="text-xs text-muted-foreground">TVL</p>
                          <p className="text-xl font-bold text-primary">{formatTVL(segment.total_tvl)}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-muted-foreground">Investors</p>
                          <p className="text-xl font-bold">{segment.investors_count.toLocaleString()}</p>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="rounded-full group-hover:bg-primary group-hover:text-primary-foreground transition-colors"
                        >
                          <ArrowRight className="h-5 w-5" />
                        </Button>
                      </div>
                    </CardContent>
                  </div>
                </Card>
              </Link>
            ))}
          </div>

          {filteredSegments.length === 0 && (
            <div className="text-center py-16">
              <p className="text-muted-foreground">
                {searchTerm ? 'No segments found matching your search.' : 'No segments available right now.'}
              </p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default SegmentsPage;

