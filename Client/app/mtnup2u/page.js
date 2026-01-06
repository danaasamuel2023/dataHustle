// MTN Data Bundles Page - Data Hustle Ghana
// SEO-optimized page for buying MTN non-expiry data bundles

import MTNBundlesClient from './MTNBundlesClient';

// SEO Metadata
export const metadata = {
  title: 'Buy Cheap MTN Data Bundles | Non-Expiry Data | Data Hustle Ghana',
  description: 'Buy cheapest MTN non-expiry data bundles in Ghana. 1GB from GH₵4.20, 5GB from GH₵22.30, 10GB from GH₵41. No expiry, instant delivery. Trusted by 10,000+ customers. Pay with MoMo.',

  keywords: [
    'MTN data bundles Ghana',
    'buy MTN data online',
    'cheap MTN data bundles',
    'MTN non-expiry data',
    'MTN data no expiry Ghana',
    'cheapest MTN data Ghana',
    'buy MTN GB Ghana',
    'MTN internet bundles',
    'MTN data reseller Ghana',
    'wholesale MTN data',
    'MTN 1GB price Ghana',
    'MTN 5GB price Ghana',
    'MTN 10GB price Ghana',
    'affordable MTN data',
    'Data Hustle MTN',
  ].join(', '),

  openGraph: {
    type: 'website',
    locale: 'en_GH',
    url: 'https://datahustle.shop/mtnup2u',
    siteName: 'Data Hustle',
    title: 'Buy Cheap MTN Data Bundles | Non-Expiry | Data Hustle Ghana',
    description: 'Cheapest MTN non-expiry data in Ghana. 1GB = GH₵4.20. No expiry ever. Pay with MoMo. Instant delivery.',
    images: [
      {
        url: 'https://datahustle.shop/og-mtn-data.jpg',
        width: 1200,
        height: 630,
        alt: 'Buy Cheap MTN Data Bundles - Data Hustle Ghana',
      },
    ],
  },

  twitter: {
    card: 'summary_large_image',
    title: 'Buy Cheap MTN Data | Non-Expiry | Data Hustle Ghana',
    description: 'MTN non-expiry data from GH₵4.20/GB. Cheapest in Ghana!',
    images: ['https://datahustle.shop/twitter-mtn-data.jpg'],
  },

  alternates: {
    canonical: 'https://datahustle.shop/mtnup2u',
  },

  robots: {
    index: true,
    follow: true,
  },
};

// Structured Data for Rich Snippets
const productSchema = {
  '@context': 'https://schema.org',
  '@type': 'Product',
  name: 'MTN Non-Expiry Data Bundles',
  description: 'Cheapest MTN data bundles in Ghana that never expire. Buy from 1GB to 50GB at wholesale prices.',
  brand: {
    '@type': 'Brand',
    name: 'MTN Ghana',
  },
  offers: {
    '@type': 'AggregateOffer',
    priceCurrency: 'GHS',
    lowPrice: '4.20',
    highPrice: '200.00',
    offerCount: '14',
    availability: 'https://schema.org/InStock',
    seller: {
      '@type': 'Organization',
      name: 'Data Hustle Ghana',
    },
  },
  aggregateRating: {
    '@type': 'AggregateRating',
    ratingValue: '4.9',
    reviewCount: '8500',
    bestRating: '5',
    worstRating: '1',
  },
};

const faqSchema = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'How much is 1GB MTN data at Data Hustle?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: '1GB MTN non-expiry data costs only GH₵4.20 at Data Hustle - the cheapest price in Ghana.',
      },
    },
    {
      '@type': 'Question',
      name: 'Does MTN non-expiry data really never expire?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Yes! MTN non-expiry data from Data Hustle never expires. Use it whenever you want.',
      },
    },
    {
      '@type': 'Question',
      name: 'How long does MTN data delivery take?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'MTN data delivery typically takes 10 minutes to 24 hours. Most orders are delivered within 30 minutes.',
      },
    },
    {
      '@type': 'Question',
      name: 'What is the cheapest MTN data bundle available?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'The cheapest MTN bundle is 1GB for GH₵4.20. We also have 2GB for GH₵8.80 and 5GB for GH₵22.30.',
      },
    },
  ],
};

const breadcrumbSchema = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://datahustle.shop' },
    { '@type': 'ListItem', position: 2, name: 'Buy Data', item: 'https://datahustle.shop/buy' },
    { '@type': 'ListItem', position: 3, name: 'MTN Data', item: 'https://datahustle.shop/mtnup2u' },
  ],
};

export default function MTNBundlesPage() {
  return (
    <>
      {/* Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />

      {/* Page Content */}
      <MTNBundlesClient />
    </>
  );
}
