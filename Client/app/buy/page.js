// app/buy/page.jsx
// Data Hustle Guest Quick Buy Page - Optimized for SEO

import QuickBuyClient from './Quickbuyclient';

// Comprehensive SEO Metadata
export const metadata = {
  // Primary Meta Tags
  title: 'Buy Cheap Data Bundles Online | No Account Needed | Data Hustle Ghana',
  description: 'Buy MTN, Telecel & AirtelTigo data bundles instantly without creating an account. Pay with Mobile Money. Cheapest non-expiry data bundles in Ghana. Delivery in 10 mins - 24 hours. Trusted by 10,000+ customers.',
  
  // Comprehensive Keywords
  keywords: [
    // Primary keywords
    'buy data bundles Ghana',
    'cheap data Ghana',
    'MTN data bundles',
    'Telecel data bundles', 
    'AirtelTigo data bundles',
    'buy data online Ghana',
    
    // Long-tail keywords
    'buy data without account Ghana',
    'instant data purchase Ghana',
    'cheapest data bundles in Ghana',
    'non expiry data bundles Ghana',
    'buy MTN data with MoMo',
    'mobile money data purchase',
    
    // Action keywords
    'buy data now Ghana',
    'quick data purchase',
    'instant data delivery Ghana',
    'same day data delivery',
    
    // Location keywords
    'data bundles Accra',
    'data bundles Kumasi',
    'data bundles Takoradi',
    'Ghana internet data',
    
    // Price keywords
    'affordable data Ghana',
    'discount data bundles',
    'wholesale data prices',
    'budget data bundles Ghana',
    
    // Brand keywords
    'Data Hustle',
    'DataHustle Ghana',
    'datahustle.shop'
  ].join(', '),

  // Author and Publisher
  authors: [{ name: 'Data Hustle', url: 'https://datahustle.shop' }],
  creator: 'Data Hustle Ghana',
  publisher: 'Data Hustle',

  // Open Graph / Facebook
  openGraph: {
    type: 'website',
    locale: 'en_GH',
    url: 'https://datahustle.shop/buy',
    siteName: 'Data Hustle',
    title: 'Buy Cheap Data Bundles Online | No Account Needed | Data Hustle',
    description: 'Buy MTN, Telecel & AirtelTigo data instantly. No account needed. Pay with MoMo. Cheapest prices in Ghana. Delivery in 10 mins!',
    images: [
      {
        url: 'https://datahustle.shop/og-buy-data.jpg',
        width: 1200,
        height: 630,
        alt: 'Buy Cheap Data Bundles - Data Hustle Ghana',
        type: 'image/jpeg',
      },
      {
        url: 'https://datahustle.shop/og-image-square.jpg',
        width: 600,
        height: 600,
        alt: 'Data Hustle - Buy Data Online',
        type: 'image/jpeg',
      },
    ],
  },

  // Twitter Card
  twitter: {
    card: 'summary_large_image',
    site: '@datahustle_gh',
    creator: '@datahustle_gh',
    title: 'Buy Cheap Data Bundles | No Account Needed | Data Hustle Ghana',
    description: 'Buy MTN, Telecel & AirtelTigo data instantly. No signup required. Pay with Mobile Money. Cheapest prices!',
    images: ['https://datahustle.shop/twitter-buy-data.jpg'],
  },

  // Canonical & Alternates
  alternates: {
    canonical: 'https://datahustle.shop/buy',
    languages: {
      'en-GH': 'https://datahustle.shop/buy',
      'en': 'https://datahustle.shop/buy',
    },
  },

  // Robots
  robots: {
    index: true,
    follow: true,
    nocache: false,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },

  // App-specific
  applicationName: 'Data Hustle',
  appleWebApp: {
    capable: true,
    title: 'Buy Data - Data Hustle',
    statusBarStyle: 'black-translucent',
  },

  // Category
  category: 'E-commerce',

  // Additional meta
  other: {
    'mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-capable': 'yes',
    'format-detection': 'telephone=yes',
    'geo.region': 'GH',
    'geo.placename': 'Ghana',
    'rating': 'General',
    'revisit-after': '1 days',
    'language': 'English',
    'target': 'all',
    'audience': 'all',
    'coverage': 'Ghana',
    'distribution': 'Global',
  },
};

// Viewport configuration
export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#6366f1' },
    { media: '(prefers-color-scheme: dark)', color: '#111827' },
  ],
};

// Product Schema for Rich Snippets
const productSchema = {
  '@context': 'https://schema.org',
  '@type': 'Product',
  name: 'Data Bundles Ghana',
  description: 'Buy cheap MTN, Telecel & AirtelTigo data bundles online in Ghana. No account needed. Instant delivery.',
  brand: {
    '@type': 'Brand',
    name: 'Data Hustle',
  },
  offers: {
    '@type': 'AggregateOffer',
    priceCurrency: 'GHS',
    lowPrice: '4.20',
    highPrice: '250.00',
    offerCount: '50+',
    availability: 'https://schema.org/InStock',
    seller: {
      '@type': 'Organization',
      name: 'Data Hustle Ghana',
    },
  },
  aggregateRating: {
    '@type': 'AggregateRating',
    ratingValue: '4.8',
    reviewCount: '10000',
    bestRating: '5',
    worstRating: '1',
  },
};

// Service Schema
const serviceSchema = {
  '@context': 'https://schema.org',
  '@type': 'Service',
  name: 'Instant Data Bundle Purchase',
  description: 'Buy data bundles instantly without creating an account. Pay with Mobile Money and receive data in minutes.',
  provider: {
    '@type': 'Organization',
    name: 'Data Hustle Ghana',
    url: 'https://datahustle.shop',
  },
  areaServed: {
    '@type': 'Country',
    name: 'Ghana',
  },
  serviceType: 'Mobile Data Sales',
  termsOfService: 'https://datahustle.shop/terms',
  offers: [
    {
      '@type': 'Offer',
      name: 'MTN Non-Expiry Data',
      description: 'MTN data bundles that never expire',
      priceCurrency: 'GHS',
      price: '4.20',
      priceValidUntil: '2025-12-31',
      availability: 'https://schema.org/InStock',
    },
    {
      '@type': 'Offer',
      name: 'Telecel Data Bundles',
      description: 'Affordable Telecel data packages',
      priceCurrency: 'GHS',
      price: '5.00',
      availability: 'https://schema.org/InStock',
    },
    {
      '@type': 'Offer',
      name: 'AirtelTigo Data Bundles',
      description: 'AirtelTigo data at wholesale prices',
      priceCurrency: 'GHS',
      price: '5.00',
      availability: 'https://schema.org/InStock',
    },
  ],
};

// FAQ Schema for Rich Snippets
const faqSchema = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'How do I buy data without an account?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Simply select your network (MTN, Telecel, or AirtelTigo), choose your bundle size, enter your phone number, and pay with Mobile Money. No account or signup required!',
      },
    },
    {
      '@type': 'Question',
      name: 'How long does data delivery take?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Data delivery typically takes between 10 minutes to 24 hours. Most orders are delivered within 30 minutes during peak hours.',
      },
    },
    {
      '@type': 'Question',
      name: 'What payment methods are accepted?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'We accept Mobile Money payments including MTN MoMo, Telecel Cash, and AirtelTigo Money. All payments are secure and instant.',
      },
    },
    {
      '@type': 'Question',
      name: 'Do the data bundles expire?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Our MTN bundles are non-expiry data packages that never expire. Telecel and AirtelTigo bundles have standard validity periods as per network terms.',
      },
    },
    {
      '@type': 'Question',
      name: 'What is the cheapest data bundle available?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Our cheapest MTN non-expiry data bundle starts from just GH₵4.20 for 1GB. We offer the best wholesale prices in Ghana.',
      },
    },
    {
      '@type': 'Question',
      name: 'How can I track my order?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'You can track your order using your phone number or order reference on our Track Order feature at the top of the buy page.',
      },
    },
    {
      '@type': 'Question',
      name: 'Is Data Hustle safe and legitimate?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Yes! Data Hustle is a trusted platform serving over 10,000 customers in Ghana. We use secure payment processing through Paystack.',
      },
    },
  ],
};

// Breadcrumb Schema
const breadcrumbSchema = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    {
      '@type': 'ListItem',
      position: 1,
      name: 'Home',
      item: 'https://datahustle.shop',
    },
    {
      '@type': 'ListItem',
      position: 2,
      name: 'Buy Data',
      item: 'https://datahustle.shop/buy',
    },
  ],
};

// WebPage Schema
const webPageSchema = {
  '@context': 'https://schema.org',
  '@type': 'WebPage',
  '@id': 'https://datahustle.shop/buy#webpage',
  url: 'https://datahustle.shop/buy',
  name: 'Buy Cheap Data Bundles Online | Data Hustle Ghana',
  description: 'Buy MTN, Telecel & AirtelTigo data bundles instantly without creating an account.',
  isPartOf: {
    '@type': 'WebSite',
    '@id': 'https://datahustle.shop/#website',
    name: 'Data Hustle',
    url: 'https://datahustle.shop',
  },
  inLanguage: 'en-GH',
  datePublished: '2024-01-01',
  dateModified: '2025-01-05',
  breadcrumb: {
    '@id': 'https://datahustle.shop/buy#breadcrumb',
  },
  potentialAction: {
    '@type': 'BuyAction',
    target: 'https://datahustle.shop/buy',
    name: 'Buy Data Bundle',
  },
};

// Organization Schema
const organizationSchema = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  '@id': 'https://datahustle.shop/#organization',
  name: 'Data Hustle',
  url: 'https://datahustle.shop',
  logo: 'https://datahustle.shop/logo.png',
  description: "Ghana's cheapest data bundle platform",
  sameAs: [
    'https://twitter.com/datahustle_gh',
    'https://facebook.com/datahustlegh',
    'https://instagram.com/datahustle_gh',
  ],
  contactPoint: {
    '@type': 'ContactPoint',
    contactType: 'customer service',
    availableLanguage: ['English'],
    areaServed: 'GH',
  },
};

export default function QuickBuyPage() {
  return (
    <>
      {/* Structured Data for SEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(webPageSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
      />
      
      {/* Main Component */}
      <QuickBuyClient initialProducts={[]} />
    </>
  );
}