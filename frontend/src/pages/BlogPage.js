import React, { useEffect } from 'react';
import { Badge } from '../components/ui/badge';
import { Card, CardContent } from '../components/ui/card';
import { ArrowRight, Battery, Newspaper, PlugZap, TrendingUp } from 'lucide-react';

const featuredPosts = [
  {
    id: 'ev-infrastructure',
    icon: PlugZap,
    category: 'EV Infrastructure',
    title: 'Why EV DC Fast Charging Is Emerging As A Real-World Asset Class',
    summary:
      'EV charging is moving beyond hardware deployment into a measurable infrastructure business driven by usage, uptime, and long-term demand growth.',
    body: [
      'EV DC fast charging is becoming more important as electric mobility adoption grows and drivers expect faster, more reliable charging access.',
      'From an infrastructure point of view, charging assets are meaningful because they are tied to real-world usage, operating performance, and recurring demand rather than purely abstract financial themes.',
      'For platforms like INVESTYZ, that makes this segment easier to understand. Users can connect the investment idea to a physical asset class that serves a visible and expanding market.',
    ],
  },
  {
    id: 'rwa-investing',
    icon: TrendingUp,
    category: 'Investing Basics',
    title: 'How Real-World Asset Investing Can Feel More Tangible For Everyday Users',
    summary:
      'Unlike purely speculative products, infrastructure-backed opportunities are easier to understand because they are tied to real assets, real demand, and visible operations.',
    body: [
      'Many users are more comfortable with opportunities they can understand in practical terms. Real-world assets offer that advantage because the underlying activity is easier to visualize.',
      'Instead of trying to interpret purely abstract market narratives, users can evaluate sectors like infrastructure through simpler questions such as demand, utilization, maintenance, operating discipline, and long-term relevance.',
      'That clarity is one reason why INVESTYZ focuses on real-world asset participation as a more grounded way to explore infrastructure-led growth.',
    ],
  },
  {
    id: 'sustainable-infrastructure',
    icon: Battery,
    category: 'Energy Transition',
    title: 'What Makes Sustainable Infrastructure Attractive In The Years Ahead',
    summary:
      'Segments such as EV charging, storage, and related clean-energy systems may benefit from long-term adoption trends, policy support, and rising utility demand.',
    body: [
      'Sustainable infrastructure sits at the intersection of long-term demand, energy transition, and real operating need. That combination can make it more durable than short-lived market themes.',
      'Sectors like charging, storage, and related support systems may benefit from favorable policy direction, changing mobility patterns, and growing pressure on energy systems to become smarter and more flexible.',
      'INVESTYZ is built around the idea that users should be able to access these themes through a platform that keeps the focus on understandable asset categories and practical economics.',
    ],
  },
];

const quickReads = [
  {
    title: 'How INVESTYZ thinks about asset-backed participation',
    body:
      'At INVESTYZ, the goal is to make infrastructure-linked opportunities easier to understand by focusing on real assets, usage-driven economics, and clear platform access.',
  },
  {
    title: 'Why transparency matters in infrastructure investing',
    body:
      'Users want clarity around what they are participating in, how assets perform, and what factors may influence outcomes. That is especially important in real-world asset models.',
  },
  {
    title: 'From sustainability theme to operating asset',
    body:
      'The strongest sustainable opportunities are not only mission-aligned. They also need practical deployment, healthy utilization, and operational discipline.',
  },
];

const BlogPage = () => {
  useEffect(() => {
    const previousTitle = document.title;
    document.title = 'Blog - Investyz';

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
              'url(https://images.unsplash.com/photo-1516321497487-e288fb19713f?crop=entropy&cs=srgb&fm=jpg&q=85)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        />
        <div className="absolute inset-0 bg-background/75 dark:bg-[#031317]/70" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-28">
          <Badge className="mb-5 bg-primary/10 text-primary border-primary/20 px-4 py-1">
            INVESTYZ Blog
          </Badge>
          <div className="max-w-4xl">
            <h1 className="text-4xl md:text-6xl font-semibold tracking-tight font-['Outfit'] mb-6">
              Insights on real-world assets, infrastructure, and sustainable growth
            </h1>
            <div className="space-y-4 text-base md:text-lg text-muted-foreground leading-relaxed max-w-3xl">
              <p>
                The INVESTYZ blog shares simple, useful perspectives on infrastructure-led
                investing, starting with EV DC fast charging and the broader sustainable economy.
              </p>
              <p>
                It is designed to help users understand the thinking behind the platform, the
                sectors we track, and the practical factors that matter in real-world asset
                opportunities.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-18 md:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3 mb-8">
            <Newspaper className="h-5 w-5 text-primary" />
            <h2 className="text-3xl md:text-4xl font-semibold font-['Outfit']">Featured Reads</h2>
          </div>

          <div className="grid lg:grid-cols-3 gap-6">
            {featuredPosts.map((post) => (
              <Card key={post.title} className="border-border/60 bg-card/95 h-full">
                <CardContent className="p-7 h-full flex flex-col">
                  <div className="p-3 rounded-2xl bg-primary/10 w-fit mb-5">
                    <post.icon className="h-6 w-6 text-primary" />
                  </div>
                  <p className="text-sm uppercase tracking-[0.22em] text-primary/80 mb-3">
                    {post.category}
                  </p>
                  <h3 className="text-2xl font-semibold font-['Outfit'] mb-4">{post.title}</h3>
                  <p className="text-muted-foreground leading-relaxed flex-grow">{post.summary}</p>
                  <a
                    href={`#${post.id}`}
                    className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
                  >
                    Read overview
                    <ArrowRight className="h-4 w-4" />
                  </a>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="py-8 md:py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8 max-w-3xl">
            <p className="text-sm uppercase tracking-[0.24em] text-primary/80">Article Overviews</p>
            <h2 className="text-3xl md:text-5xl font-semibold font-['Outfit'] mt-2 mb-4">
              A clearer look at the ideas behind INVESTYZ
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              These short reads expand on the featured topics and explain why infrastructure-led
              opportunities matter in a practical, easy-to-follow way.
            </p>
          </div>

          <div className="space-y-6">
            {featuredPosts.map((post) => (
              <Card
                key={post.id}
                id={post.id}
                className="scroll-mt-28 border-border/60 bg-card/95"
              >
                <CardContent className="p-7 md:p-8">
                  <p className="text-sm uppercase tracking-[0.22em] text-primary/80 mb-3">
                    {post.category}
                  </p>
                  <h3 className="text-2xl md:text-3xl font-semibold font-['Outfit'] mb-4">
                    {post.title}
                  </h3>
                  <div className="space-y-3 text-muted-foreground leading-relaxed">
                    {post.body.map((paragraph) => (
                      <p key={paragraph}>{paragraph}</p>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="pb-20 md:pb-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8 max-w-3xl">
            <p className="text-sm uppercase tracking-[0.24em] text-primary/80">Quick Reads</p>
            <h2 className="text-3xl md:text-5xl font-semibold font-['Outfit'] mt-2 mb-4">
              Straightforward ideas, written for clarity
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              A cleaner look at the themes behind INVESTYZ, from platform philosophy to the
              operating realities of infrastructure-based opportunities.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-5">
            {quickReads.map((item) => (
              <Card key={item.title} className="border-border/60 bg-card/95 h-full">
                <CardContent className="p-6">
                  <h3 className="text-xl font-semibold font-['Outfit'] mb-3">{item.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{item.body}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default BlogPage;
