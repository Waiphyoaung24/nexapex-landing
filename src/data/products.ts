export interface Product {
  slug: string;
  title: string;
  category: string;
  tagline: string;
  desc: string;
  status: string;
  year: string;
  image: string;
  heroImage: string;
  gallery: string[];
  tech: string[];
  features: { title: string; desc: string }[];
  overview: string[];
}

export const products: Product[] = [
  {
    slug: 'ai-hotel-revenue-manager',
    title: 'AI Hotel Revenue Manager',
    category: 'Hospitality AI',
    tagline: 'Dynamic pricing intelligence for the Thai hospitality sector',
    desc: 'Real-time competitor price monitoring with dynamic profit-ratio adjustments for the Thai hospitality sector.',
    status: 'In Development',
    year: '2026',
    image: '/product-hotel.jpg',
    heroImage: '/product-hotel-hero.jpg',
    gallery: ['/product-hotel.jpg', '/product-hotel-hero.jpg', '/product-hotel.jpg', '/product-hotel-hero.jpg', '/product-hotel.jpg'],
    tech: ['Python', 'TensorFlow', 'FastAPI', 'PostgreSQL', 'Redis', 'React'],
    features: [
      { title: 'Competitor Intelligence', desc: 'Continuous monitoring of competitor pricing across OTAs, direct booking channels, and meta-search platforms with automated data collection and analysis.' },
      { title: 'Dynamic Profit Optimization', desc: 'AI-driven profit-ratio engine that adjusts room rates in real-time based on demand patterns, competitor moves, and occupancy forecasts.' },
      { title: 'Market Demand Forecasting', desc: 'Predictive models analyzing seasonal trends, local events, and macroeconomic signals to anticipate demand shifts before they happen.' },
      { title: 'Multi-Channel Distribution', desc: 'Unified rate management across Booking.com, Agoda, Expedia, and direct channels with automated parity control.' },
    ],
    overview: [
      'The Thai hospitality market operates in one of the <mark class="text-highlight">most competitive pricing environments</mark> in Southeast Asia. Hotels constantly adjust rates across dozens of channels, often <mark class="text-highlight">reacting too late</mark> to competitor moves or demand shifts.',
      'Our AI Revenue Manager replaces manual rate-setting with an <mark class="text-highlight">intelligent system that monitors, predicts, and acts autonomously</mark>. It ingests real-time data from competitor channels, analyzes demand patterns, and optimizes pricing to <mark class="text-highlight">maximize profit-per-room</mark> rather than just occupancy.',
      'Built for the <mark class="text-highlight">unique dynamics of the Thai market</mark> — from Songkran surges to monsoon dips — the system learns continuously and adapts its strategy as market conditions evolve.',
    ],
  },
  {
    slug: 'dairy-production-ai',
    title: 'Dairy Production AI',
    category: 'Industrial AI',
    tagline: 'Intelligence meets physical production',
    desc: 'AI-driven machinery and quality control systems for dairy manufacturing — bridging intelligence with physical production.',
    status: 'In Development',
    year: '2026',
    image: '/product-factory.jpg',
    heroImage: '/product-factory-hero.jpg',
    gallery: ['/product-factory.jpg', '/product-factory-hero.jpg', '/product-factory.jpg', '/product-factory-hero.jpg', '/product-factory.jpg'],
    tech: ['Python', 'PyTorch', 'PLC Integration', 'Computer Vision', 'MQTT', 'Edge Computing'],
    features: [
      { title: 'Predictive Maintenance', desc: 'Sensor-driven anomaly detection that predicts equipment failures before they cause costly production downtime.' },
      { title: 'Quality Control Vision', desc: 'Computer vision systems inspecting product quality at line speed — detecting defects invisible to human operators.' },
      { title: 'Production Optimization', desc: 'AI scheduling that balances production lines, minimizes waste, and adapts to supply chain variability in real-time.' },
      { title: 'Environmental Monitoring', desc: 'Continuous monitoring of temperature, humidity, and contamination risks across the production facility with automated alerts.' },
    ],
    overview: [
      'Dairy manufacturing demands <mark class="text-highlight">precision at every stage</mark> — from raw material intake to final packaging. Even small deviations in temperature, timing, or ingredient ratios can <mark class="text-highlight">compromise entire batches</mark>.',
      'Our system bridges the gap between factory-floor machinery and intelligent decision-making. By connecting directly to PLCs, sensors, and production equipment, we create a <mark class="text-highlight">digital nervous system</mark> that monitors, learns, and optimizes autonomously.',
      'The result is a production environment where AI doesn\'t replace human operators — <mark class="text-highlight">it amplifies them</mark>. Operators receive real-time guidance, maintenance teams get <mark class="text-highlight">predictive alerts</mark>, and management sees unified analytics across the entire operation.',
    ],
  },
  {
    slug: 'smart-pos-system',
    title: 'Smart POS System',
    category: 'Retail AI',
    tagline: 'RAG-powered retail intelligence for Southeast Asia',
    desc: 'RAG-powered retail management with high-fidelity analytics for cross-border enterprises in Southeast Asia.',
    status: 'In Development',
    year: '2026',
    image: '/product-pos.jpg',
    heroImage: '/product-pos-hero.jpg',
    gallery: ['/product-pos.jpg', '/product-pos-hero.jpg', '/product-pos.jpg', '/product-pos-hero.jpg', '/product-pos.jpg'],
    tech: ['TypeScript', 'RAG Pipeline', 'LLM Integration', 'Next.js', 'Supabase', 'Stripe'],
    features: [
      { title: 'Natural Language Queries', desc: 'Ask your POS anything in plain language — "What sold best last Tuesday?" or "Show me margin trends for Q1" — powered by RAG.' },
      { title: 'Cross-Border Analytics', desc: 'Unified reporting across multiple countries with automatic currency conversion, tax compliance, and regional performance breakdowns.' },
      { title: 'Inventory Intelligence', desc: 'Predictive restocking that learns from sales patterns, seasonal trends, and supplier lead times to prevent stockouts and overstock.' },
      { title: 'Multi-Language Support', desc: 'Full Thai, English, and Mandarin support across the interface, receipts, and AI assistant — built for Southeast Asian operations.' },
    ],
    overview: [
      'Traditional POS systems are <mark class="text-highlight">transactional black boxes</mark> — they record sales but offer little insight. For cross-border retail operations in Southeast Asia, the challenge multiplies: different currencies, tax regimes, languages, and consumer behaviors.',
      'Smart POS reimagines the point of sale as an <mark class="text-highlight">intelligence hub</mark>. Every transaction feeds into a RAG-powered analytics engine that operators can <mark class="text-highlight">query in natural language</mark>. No dashboards to learn, no reports to configure — just ask.',
      'Designed from the ground up for <mark class="text-highlight">multi-location, multi-country retail</mark> operations, the system handles the complexity of cross-border commerce while presenting a simple, unified view to operators and management.',
    ],
  },
];

export function getProductBySlug(slug: string): Product | undefined {
  return products.find((p) => p.slug === slug);
}
