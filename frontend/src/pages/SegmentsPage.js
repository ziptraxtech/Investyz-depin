import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Server, Battery, Zap, Sun, Leaf, Search, TrendingUp, Users, ArrowRight } from 'lucide-react';
import { getFrontendApiUrl } from '../lib/apiConfig';
import { filterLiveSegments, filterVisibleSegments, isSegmentFuture } from '../lib/segmentVisibility';
import { FALLBACK_SEGMENTS } from '../data/segmentFallbacks';

const API_URL = getFrontendApiUrl();
const SEGMENTS_CACHE_KEY = 'segments_cache_v2';

const normalizeSegmentsPayload = (result) => {
  const data = result?.data || result;
  if (!Array.isArray(data)) return [];
  return filterVisibleSegments(
    data.filter((segment) =>
      segment &&
      typeof segment.name === 'string' &&
      typeof segment.short_description === 'string' &&
      Array.isArray(segment.features)
    )
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

const SegmentsPage = () => {
  const [segments, setSegments] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState('');

  useEffect(() => {
    const fetchSegments = async () => {
      setLoading(true);
      setFetchError('');
      localStorage.removeItem('segments_cache_v1');

      if (!API_URL) {
        setSegments(sortSegmentsForDisplay(filterVisibleSegments(FALLBACK_SEGMENTS)));
        setLoading(false);
        return;
      }

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
          localStorage.setItem(SEGMENTS_CACHE_KEY, JSON.stringify(sortedSegments));
        } else {
          throw new Error('Empty segments response');
        }
      } catch (error) {
        console.error('Failed to fetch segments:', error);
        const cachedSegments = localStorage.getItem(SEGMENTS_CACHE_KEY);
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

        setSegments(sortSegmentsForDisplay(filterVisibleSegments(FALLBACK_SEGMENTS)));
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

  const liveSegments = filterLiveSegments(segments);
  const totalTVL = liveSegments.reduce((sum, seg) => sum + seg.total_tvl, 0);
  const totalInvestors = liveSegments.reduce((sum, seg) => sum + seg.investors_count, 0);

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
              <span className="text-foreground">Investment</span>{' '}<span className="text-gradient">Segments</span>
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
            {filteredSegments.map((segment) => {
              const isFutureSegment = isSegmentFuture(segment.segment_id);
              const cardContent = (
                <Card className={`overflow-hidden h-full duration-300 ${isFutureSegment ? 'border-amber-200/80 bg-card/95' : 'hover:border-primary/30 transition-all hover:-translate-y-2'}`}>
                  <div className="grid md:grid-cols-2">
                    {/* Image */}
                    <div className="aspect-square md:aspect-auto relative overflow-hidden">
                      <img
                        src={segment.image_url}
                        alt={segment.name}
                        className={`w-full h-full object-cover transition-transform duration-500 ${isFutureSegment ? 'scale-100 saturate-[0.8]' : 'group-hover:scale-110'}`}
                        loading="lazy"
                        decoding="async"
                      />
                      <div className="absolute inset-0 bg-gradient-to-r from-black/40 to-transparent md:bg-gradient-to-t" />
                      <div className="absolute top-4 left-4 flex flex-wrap gap-2">
                        <div className="p-3 rounded-xl bg-white/20 backdrop-blur-sm text-white">
                          {getIcon(segment.icon)}
                        </div>
                        {isFutureSegment && (
                          <span className="inline-flex items-center rounded-full border border-amber-200/70 bg-amber-100/95 px-3 py-1 text-xs font-semibold text-amber-950">
                            Launching Next
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Content */}
                    <CardContent className="p-6 flex flex-col">
                      <h2 className={`text-2xl font-bold mb-3 font-['Outfit'] transition-colors ${isFutureSegment ? 'text-foreground' : 'group-hover:text-primary'}`}>
                        {segment.name}
                      </h2>
                      <p className="text-muted-foreground mb-6 flex-grow">
                        {isFutureSegment
                          ? 'This segment is already designed inside the platform and is being held for a future expansion release.'
                          : segment.short_description}
                      </p>

                      {/* Features */}
                      <div className="flex flex-wrap gap-2 mb-6">
                        {segment.features.slice(0, 3).map((feature, idx) => (
                          <span
                            key={idx}
                            className={`px-3 py-1 rounded-full text-xs font-medium ${isFutureSegment ? 'bg-amber-500/10 text-amber-700 dark:text-amber-300' : 'bg-primary/10 text-primary'}`}
                          >
                            {feature}
                          </span>
                        ))}
                      </div>

                      {/* Stats */}
                      <div className="flex justify-between items-center pt-4 border-t border-border">
                        {isFutureSegment ? (
                          <>
                            <div>
                              <p className="text-xs text-muted-foreground">Availability</p>
                              <p className="text-xl font-bold text-foreground">Roadmap Release</p>
                            </div>
                            <div className="text-right">
                              <p className="text-xs text-muted-foreground">Status</p>
                              <p className="text-xl font-bold text-amber-700 dark:text-amber-300">Not Live Yet</p>
                            </div>
                            <div className="rounded-full border border-amber-300/60 bg-amber-500/10 px-4 py-2 text-sm font-medium text-amber-700 dark:text-amber-300">
                              Future Segment
                            </div>
                          </>
                        ) : (
                          <>
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
                          </>
                        )}
                      </div>
                    </CardContent>
                  </div>
                </Card>
              );

              return isFutureSegment ? (
                <div
                  key={segment.segment_id}
                  className="group"
                  data-testid={`segment-${segment.segment_id}`}
                >
                  {cardContent}
                </div>
              ) : (
                <Link
                  key={segment.segment_id}
                  to={`/segments/${segment.segment_id}`}
                  className="group"
                  data-testid={`segment-${segment.segment_id}`}
                >
                  {cardContent}
                </Link>
              );
            })}
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

