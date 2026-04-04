import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "@/compoenent/nav";
import Footer from "@/compoenent/footer";
import AuthGuard from "@/component/AuthGuide";
import WhatsAppLink from "@/component/groupIcon";
import Script from "next/script";
import { ThemeProvider } from "@/app/context/ThemeProvider";
import StorePromoModal from "@/compoenent/StorePromoModal";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  // Primary Meta Tags
  title: {
    default: "Buy Cheap Data Bundles in Ghana | MTN, Telecel, AirtelTigo | Data Hustle",
    template: "%s | Data Hustle Ghana"
  },
  description: "Ghana's #1 cheapest data bundle platform. Buy MTN non-expiry data from GH₵4.20, Telecel from GH₵19.50, AirtelTigo from GH₵3.95. Wholesale prices, instant delivery, MoMo payment. No account needed. Trusted by 10,000+ resellers.",

  // Combined keywords from all top-ranking competitors
  keywords: [
    // High-volume primary (from iDATA, PulseData, DataHub, RemaData, DataPlug, FalaData)
    "cheap data bundles Ghana",
    "buy data bundles Ghana",
    "cheapest data bundles in Ghana",
    "buy cheap data bundle Ghana",
    "data bundles Ghana",
    "internet data bundles Ghana",
    "mobile data Ghana",
    "buy data online Ghana",

    // Network-specific (from all competitors)
    "MTN data bundles Ghana",
    "MTN data bundle",
    "MTN non-expiry data",
    "MTN non expiry data Ghana",
    "cheap MTN data bundles",
    "MTN data no expiry Ghana",
    "buy MTN data online",
    "MTN data cheap",
    "MTN 1GB price Ghana",
    "MTN 5GB price Ghana",
    "MTN 10GB price Ghana",
    "MTN Up2U data bundles",
    "Telecel data bundles",
    "Telecel data bundle Ghana",
    "buy Telecel data",
    "cheap Telecel data Ghana",
    "AirtelTigo data bundles",
    "AirtelTigo data bundle Ghana",
    "buy AirtelTigo data",
    "cheap AirtelTigo data Ghana",
    "AirtelTigo iShare",
    "AirtelTigo BigTime",
    "Vodafone data bundles Ghana",

    // Reseller/wholesale (from RemaData, DataPlug, Gentle Data Hub)
    "data reseller Ghana",
    "data reseller platform Ghana",
    "best data reseller platform Ghana",
    "wholesale data Ghana",
    "wholesale data prices",
    "data vendor Ghana",
    "bulk data purchase Ghana",
    "data reselling business Ghana",
    "sell data bundles Ghana",
    "resell data Ghana",
    "start data business Ghana",
    "become data reseller Ghana",
    "data selling website Ghana",
    "how to sell data bundle online",

    // Price/value (from PulseData, DataHub, FalaData)
    "affordable data bundles Ghana",
    "data bundle wholesale price",
    "cheapest internet Ghana",
    "cheap internet Ghana",
    "no expiry data bundles Ghana",
    "data bundle from GHS 1",

    // Action/intent keywords
    "buy MTN data cheap",
    "buy data with MoMo",
    "buy data with mobile money",
    "instant data delivery Ghana",
    "fast data delivery Ghana",

    // Location keywords
    "Ghana data marketplace",
    "Accra data bundles",
    "Kumasi data reseller",
    "Tamale data bundles",
    "Cape Coast data",
    "Ghana telecom data",

    // Brand keywords
    "Data Hustle",
    "DataHustle Ghana",
    "datahustle.shop",
    "Data Hustle reseller"
  ],
  
  // Author and Publisher
  authors: [{ name: "Data Hustle", url: "https://datahustle.shop" }],
  creator: "Data Hustle Ghana",
  publisher: "Data Hustle",
  
  // Verification
  verification: {
    google: "AC4HPEsUTAdyi8OFeqw8daV6HcTUma6gzMw1p0-yJOg",
    // Add if you have these
    // yandex: "your-yandex-verification",
    // bing: "your-bing-verification",
  },
  
  // Open Graph / Facebook
  openGraph: {
    type: "website",
    locale: "en_GH",
    url: "https://datahustle.shop",
    siteName: "Data Hustle",
    title: "Buy Cheap Data Bundles in Ghana | MTN, Telecel, AirtelTigo | Data Hustle",
    description: "Ghana's cheapest data bundles. MTN non-expiry 1GB from GH₵4.20, Telecel 5GB from GH₵19.50, AirtelTigo 1GB from GH₵3.95. Instant delivery, MoMo payment, no account needed. 10,000+ resellers trust us.",
    images: [
      {
        url: "https://datahustle.shop/og-image.svg",
        width: 1200,
        height: 630,
        alt: "Buy Cheap Data Bundles in Ghana - MTN from GH₵4.20, Telecel, AirtelTigo - Data Hustle",
        type: "image/svg+xml",
      },
      {
        url: "https://datahustle.shop/og-image-square.svg",
        width: 600,
        height: 600,
        alt: "Data Hustle - Ghana's Cheapest Data Bundle Platform",
        type: "image/svg+xml",
      },
    ],
  },
  
  // Twitter Card
  twitter: {
    card: "summary_large_image",
    site: "@datahustle_gh",
    creator: "@datahustle_gh",
    title: "Buy Cheap Data Bundles Ghana | MTN Non-Expiry from GH₵4.20 | Data Hustle",
    description: "Cheapest MTN, Telecel, AirtelTigo data in Ghana. No expiry. Instant delivery. Pay with MoMo. No account needed. 10,000+ resellers.",
    images: ["https://datahustle.shop/og-image.svg"],
  },
  
  // Canonical & Alternates
  alternates: {
    canonical: "https://datahustle.shop",
    languages: {
      "en-GH": "https://datahustle.shop",
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
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  
  // Icons
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/icon-32x32.png", sizes: "32x32", type: "image/png" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
    other: [
      { rel: "mask-icon", url: "/safari-pinned-tab.svg", color: "#6366f1" },
    ],
  },
  
  // Manifest
  manifest: "/site.webmanifest",
  
  // App-specific
  applicationName: "Data Hustle",
  appleWebApp: {
    capable: true,
    title: "Data Hustle",
    statusBarStyle: "black-translucent",
  },
  
  // Format Detection
  formatDetection: {
    telephone: true,
    email: true,
    address: true,
  },
  
  // Category
  category: "technology",
  
  // Base URL
  metadataBase: new URL("https://datahustle.shop"),
};

// Viewport configuration
export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#111827" },
  ],
};

// Organization Schema
const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "Data Hustle",
  alternateName: ["DataHustle", "Data Hustle Ghana", "DataHustle GH"],
  url: "https://datahustle.shop",
  logo: "https://datahustle.shop/logo.png",
  description: "Ghana's leading data bundle reseller platform offering MTN, Telecel, and AirtelTigo bundles at wholesale prices.",
  foundingDate: "2024",
  sameAs: [
    "https://twitter.com/datahustle_gh",
    "https://facebook.com/datahustlegh",
    "https://instagram.com/datahustle_gh",
    "https://wa.me/233XXXXXXXXX"
  ],
  contactPoint: [
    {
      "@type": "ContactPoint",
      telephone: "+233-XX-XXX-XXXX",
      contactType: "customer service",
      availableLanguage: ["English", "Twi"],
      areaServed: "GH"
    },
    {
      "@type": "ContactPoint",
      contactType: "sales",
      url: "https://wa.me/233XXXXXXXXX",
      availableLanguage: "English"
    }
  ],
  address: {
    "@type": "PostalAddress",
    addressCountry: "GH",
    addressRegion: "Greater Accra"
  }
};

// Website Schema
const websiteSchema = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "Data Hustle",
  alternateName: "DataHustle Ghana",
  url: "https://datahustle.shop",
  description: "Buy and resell cheap data bundles in Ghana",
  publisher: {
    "@type": "Organization",
    name: "Data Hustle"
  },
  potentialAction: {
    "@type": "SearchAction",
    target: {
      "@type": "EntryPoint",
      urlTemplate: "https://datahustle.shop/search?q={search_term_string}"
    },
    "query-input": "required name=search_term_string"
  }
};

// Local Business Schema (for Ghana market)
const localBusinessSchema = {
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  "@id": "https://datahustle.shop/#business",
  name: "Data Hustle Ghana",
  image: "https://datahustle.shop/logo.png",
  description: "Wholesale data bundle reseller platform in Ghana",
  url: "https://datahustle.shop",
  telephone: "+233XXXXXXXXX",
  priceRange: "₵₵",
  address: {
    "@type": "PostalAddress",
    addressCountry: "Ghana",
    addressRegion: "Greater Accra"
  },
  geo: {
    "@type": "GeoCoordinates",
    latitude: 5.6037,
    longitude: -0.1870
  },
  openingHoursSpecification: {
    "@type": "OpeningHoursSpecification",
    dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
    opens: "00:00",
    closes: "23:59"
  },
  areaServed: {
    "@type": "Country",
    name: "Ghana"
  },
  serviceType: ["Data Bundle Sales", "Mobile Data Reselling", "Telecom Services"],
  paymentAccepted: "Mobile Money, Credit Card, Debit Card, MTN MoMo, Telecel Cash, AirtelTigo Money",
  currenciesAccepted: "GHS",
  aggregateRating: {
    "@type": "AggregateRating",
    ratingValue: "4.8",
    reviewCount: "3200",
    bestRating: "5"
  },
  hasOfferCatalog: {
    "@type": "OfferCatalog",
    name: "Data Bundles",
    itemListElement: [
      { "@type": "Offer", itemOffered: { "@type": "Service", name: "MTN Non-Expiry Data Bundles", description: "1GB-50GB, never expires, from GH₵4.20" } },
      { "@type": "Offer", itemOffered: { "@type": "Service", name: "Telecel Data Bundles", description: "5GB-100GB at wholesale prices" } },
      { "@type": "Offer", itemOffered: { "@type": "Service", name: "AirtelTigo Data Bundles", description: "1GB-50GB iShare and BigTime bundles" } }
    ]
  }
};

// Product Schemas with actual prices (for rich snippets in search results)
const mtnProductSchema = {
  "@context": "https://schema.org",
  "@type": "Product",
  name: "MTN Non-Expiry Data Bundles Ghana",
  description: "Buy cheapest MTN non-expiry data bundles in Ghana. Never expires. From 1GB to 50GB at wholesale prices.",
  brand: { "@type": "Brand", name: "MTN Ghana" },
  offers: {
    "@type": "AggregateOffer",
    priceCurrency: "GHS",
    lowPrice: "4.20",
    highPrice: "200.00",
    offerCount: "14",
    availability: "https://schema.org/InStock",
    seller: { "@type": "Organization", name: "Data Hustle" }
  },
  aggregateRating: {
    "@type": "AggregateRating",
    ratingValue: "4.8",
    reviewCount: "3200",
    bestRating: "5"
  }
};

const telecelProductSchema = {
  "@context": "https://schema.org",
  "@type": "Product",
  name: "Telecel Data Bundles Ghana",
  description: "Buy cheap Telecel data bundles in Ghana at wholesale prices. Fast delivery via mobile money.",
  brand: { "@type": "Brand", name: "Telecel Ghana" },
  offers: {
    "@type": "AggregateOffer",
    priceCurrency: "GHS",
    lowPrice: "19.50",
    highPrice: "341.00",
    offerCount: "13",
    availability: "https://schema.org/InStock",
    seller: { "@type": "Organization", name: "Data Hustle" }
  },
  aggregateRating: {
    "@type": "AggregateRating",
    ratingValue: "4.7",
    reviewCount: "1800",
    bestRating: "5"
  }
};

const atProductSchema = {
  "@context": "https://schema.org",
  "@type": "Product",
  name: "AirtelTigo Data Bundles Ghana",
  description: "Buy cheap AirtelTigo data bundles in Ghana. iShare and BigTime bundles at wholesale prices with instant delivery.",
  brand: { "@type": "Brand", name: "AirtelTigo Ghana" },
  offers: {
    "@type": "AggregateOffer",
    priceCurrency: "GHS",
    lowPrice: "3.95",
    highPrice: "190.00",
    offerCount: "14",
    availability: "https://schema.org/InStock",
    seller: { "@type": "Organization", name: "Data Hustle" }
  },
  aggregateRating: {
    "@type": "AggregateRating",
    ratingValue: "4.7",
    reviewCount: "1500",
    bestRating: "5"
  }
};

// WebApplication Schema (like DataPlug — ranks for app-related searches)
const webAppSchema = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "Data Hustle",
  description: "Buy and resell cheap data bundles in Ghana. MTN, Telecel, AirtelTigo at wholesale prices.",
  url: "https://datahustle.shop",
  applicationCategory: "BusinessApplication",
  operatingSystem: "Web, Android, iOS",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "GHS"
  },
  aggregateRating: {
    "@type": "AggregateRating",
    ratingValue: "4.8",
    reviewCount: "3200",
    bestRating: "5"
  }
};

// HowTo Schema (like DataPlug — ranks for "how to" searches)
const howToSchema = {
  "@context": "https://schema.org",
  "@type": "HowTo",
  name: "How to Buy Cheap Data Bundles in Ghana",
  description: "Step-by-step guide to buying the cheapest MTN, Telecel, and AirtelTigo data bundles in Ghana using Data Hustle.",
  step: [
    { "@type": "HowToStep", name: "Choose a network", text: "Select MTN, Telecel, or AirtelTigo from the available networks." },
    { "@type": "HowToStep", name: "Select your bundle", text: "Pick your preferred data size. MTN 1GB starts from GH₵4.20." },
    { "@type": "HowToStep", name: "Enter phone number", text: "Type the 10-digit Ghana phone number that will receive the data." },
    { "@type": "HowToStep", name: "Pay and receive", text: "Pay with MoMo, card, or wallet. Data is delivered within 5 minutes." }
  ],
  totalTime: "PT2M"
};

// FAQ Schema — expanded with competitor-inspired questions for rich snippets
const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "How do I buy cheap data bundles in Ghana?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Visit datahustle.shop and click 'Buy Data Now'. Select your network (MTN, Telecel, or AirtelTigo), choose your bundle size, enter the recipient phone number, and pay with MoMo or card. No account needed for quick purchases. Data is delivered within 5 minutes."
      }
    },
    {
      "@type": "Question",
      name: "What is the cheapest MTN data bundle in Ghana?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Data Hustle offers the cheapest MTN non-expiry data bundles in Ghana. 1GB costs just GH₵4.20, 5GB is GH₵22.30, and 10GB is GH₵41.00. These bundles never expire — your data stays until you use it."
      }
    },
    {
      "@type": "Question",
      name: "Do MTN data bundles from Data Hustle expire?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "No! All MTN data bundles purchased from Data Hustle are non-expiry (Up2U bundles). Your data will never reset or expire. Telecel and AirtelTigo bundles follow standard network validity periods."
      }
    },
    {
      "@type": "Question",
      name: "How can I become a data reseller in Ghana?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Sign up for free at datahustle.shop. Top up your wallet via MoMo, then buy data at wholesale prices and resell at your own markup. You can also create your own branded agent store with custom pricing. Over 10,000 resellers already trust Data Hustle. No minimum purchase required."
      }
    },
    {
      "@type": "Question",
      name: "What payment methods does Data Hustle accept?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "We accept MTN Mobile Money (MoMo), Telecel Cash, AirtelTigo Money, Visa/Mastercard, and wallet balance. You can buy data as a guest with MoMo — no account needed. Wallet payments have zero transaction fees."
      }
    },
    {
      "@type": "Question",
      name: "How fast is data delivery on Data Hustle?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Most orders are delivered within 5 minutes. During peak hours, delivery may take up to 4 hours depending on network conditions. You can track your order status in real-time on our platform."
      }
    },
    {
      "@type": "Question",
      name: "Is Data Hustle safe and legit?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes. Data Hustle is a trusted platform used by over 10,000 resellers across Ghana. All payments are processed securely through Paystack (PCI-DSS certified). We've been operating since 2024 with 24/7 customer support."
      }
    },
    {
      "@type": "Question",
      name: "Can I buy data without creating an account?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes! Visit datahustle.shop/buy to purchase data instantly without signing up. Just select your network, choose a bundle, enter the recipient number, and pay with MoMo. No registration required."
      }
    },
    {
      "@type": "Question",
      name: "How much does AirtelTigo data cost on Data Hustle?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "AirtelTigo data bundles start from GH₵3.95 for 1GB, GH₵19.50 for 5GB, GH₵38.50 for 10GB, and GH₵115.00 for 30GB. These are wholesale prices — cheaper than buying directly from AirtelTigo."
      }
    },
    {
      "@type": "Question",
      name: "How much does Telecel data cost on Data Hustle?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Telecel data bundles start from GH₵19.50 for 5GB, GH₵36.50 for 10GB, GH₵69.80 for 20GB, and GH₵171.50 for 50GB. All at wholesale prices with fast delivery."
      }
    }
  ]
};

// Breadcrumb Schema
const breadcrumbSchema = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    {
      "@type": "ListItem",
      position: 1,
      name: "Home",
      item: "https://datahustle.shop"
    }
  ]
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Preconnect to important origins */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://datahustle.onrender.com" />
        
        {/* DNS Prefetch */}
        <link rel="dns-prefetch" href="https://www.googletagmanager.com" />
        <link rel="dns-prefetch" href="https://www.google-analytics.com" />
        
        {/* Structured Data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessSchema) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(mtnProductSchema) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(telecelProductSchema) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(atProductSchema) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(webAppSchema) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(howToSchema) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900`}
      >
        <ThemeProvider>
          {/* Google Tag Manager (noscript) - Add your GTM ID */}
          <noscript>
            <iframe
              src="https://www.googletagmanager.com/ns.html?id=GTM-XXXXXXX"
              height="0"
              width="0"
              style={{ display: "none", visibility: "hidden" }}
            />
          </noscript>

          <Navbar />
          <main className="flex-grow">
            {children}
            <WhatsAppLink />
          </main>
          <StorePromoModal />
          <Footer />
        </ThemeProvider>
        
        {/* Google Analytics 4 - Add your GA4 ID */}
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-XXXXXXXXXX', {
              page_title: document.title,
              page_location: window.location.href,
            });
          `}
        </Script>
        
        {/* Microsoft Clarity (Optional but good for UX insights) */}
        <Script id="microsoft-clarity" strategy="afterInteractive">
          {`
            (function(c,l,a,r,i,t,y){
              c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
              t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
              y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
            })(window, document, "clarity", "script", "YOUR_CLARITY_ID");
          `}
        </Script>

        {/* DataMart Delivery Tracker Widget */}
        <Script
          src="https://api.datamartgh.shop/widgets/delivery-tracker.js"
          data-api-key="fb9b9e81e9640c1861605b4ec333e3bd57bdf70dcce461d766fa877c9c0f7553"
          data-theme="dark"
          data-position="bottom-right"
          strategy="lazyOnload"
        />
      </body>
    </html>
  );
}