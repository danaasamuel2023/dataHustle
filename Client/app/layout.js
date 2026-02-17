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
    default: "Data Hustle | #1 Cheapest Data Bundle Reseller Platform in Ghana",
    template: "%s | Data Hustle Ghana"
  },
  description: "Buy cheapest MTN, Telecel & AirtelTigo data bundles in Ghana. Wholesale prices for resellers. No expiry data, instant delivery, wallet & MoMo payment. Join 10,000+ resellers today!",
  
  // Comprehensive Keywords
  keywords: [
    // Primary keywords
    "cheap data bundles Ghana",
    "data reseller Ghana",
    "wholesale data Ghana",
    "buy data online Ghana",
    "MTN data bundles Ghana",
    "Telecel data bundles",
    "AirtelTigo data bundles",
    
    // Long-tail keywords
    "cheapest data bundles in Ghana",
    "best data reseller platform Ghana",
    "no expiry data bundles Ghana",
    "bulk data purchase Ghana",
    "data vendor Ghana",
    "internet data reseller",
    
    // Action keywords
    "buy MTN data cheap",
    "sell data bundles Ghana",
    "resell data Ghana",
    "data bundle wholesale price",
    
    // Location keywords
    "Ghana data marketplace",
    "Accra data bundles",
    "Kumasi data reseller",
    "Ghana telecom data",
    
    // Brand keywords
    "Data Hustle",
    "DataHustle Ghana",
    "datahustle.shop"
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
    title: "Data Hustle | Cheapest Data Bundles for Resellers in Ghana",
    description: "Ghana's #1 data reseller platform. Buy MTN, Telecel & AirtelTigo bundles at wholesale prices. No expiry, instant delivery. Start reselling today!",
    images: [
      {
        url: "https://datahustle.shop/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "Data Hustle - Ghana's Cheapest Data Bundle Platform",
        type: "image/jpeg",
      },
      {
        url: "https://datahustle.shop/og-image-square.jpg",
        width: 600,
        height: 600,
        alt: "Data Hustle Logo",
        type: "image/jpeg",
      },
    ],
  },
  
  // Twitter Card
  twitter: {
    card: "summary_large_image",
    site: "@datahustle_gh",
    creator: "@datahustle_gh",
    title: "Data Hustle | Cheapest Data Bundles in Ghana",
    description: "Buy & resell MTN, Telecel, AirtelTigo data at wholesale prices. No expiry. Instant delivery. Join 10,000+ resellers!",
    images: ["https://datahustle.shop/twitter-card.jpg"],
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
  serviceType: ["Data Bundle Sales", "Mobile Data Reselling", "Telecom Services"]
};

// Product/Service Schema
const serviceSchema = {
  "@context": "https://schema.org",
  "@type": "Service",
  name: "Data Bundle Reselling Platform",
  provider: {
    "@type": "Organization",
    name: "Data Hustle"
  },
  description: "Buy and resell MTN, Telecel, and AirtelTigo data bundles at wholesale prices in Ghana",
  areaServed: {
    "@type": "Country",
    name: "Ghana"
  },
  hasOfferCatalog: {
    "@type": "OfferCatalog",
    name: "Data Bundles",
    itemListElement: [
      {
        "@type": "Offer",
        itemOffered: {
          "@type": "Service",
          name: "MTN Data Bundles",
          description: "Non-expiry MTN data bundles from 1GB to 50GB"
        }
      },
      {
        "@type": "Offer",
        itemOffered: {
          "@type": "Service",
          name: "Telecel Data Bundles",
          description: "Telecel data bundles at wholesale prices"
        }
      },
      {
        "@type": "Offer",
        itemOffered: {
          "@type": "Service",
          name: "AirtelTigo Data Bundles",
          description: "AirtelTigo data bundles for resellers"
        }
      }
    ]
  }
};

// FAQ Schema (helps with rich snippets)
const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "How do I buy data bundles on Data Hustle?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Simply create an account, top up your wallet via Mobile Money, select your network (MTN, Telecel, or AirtelTigo), choose your bundle size, enter the recipient number, and complete your purchase. It's that easy!"
      }
    },
    {
      "@type": "Question",
      name: "Is Data Hustle the cheapest data reseller in Ghana?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes! Data Hustle offers wholesale prices on all data bundles, making us one of the most affordable data reseller platforms in Ghana. Our MTN non-expiry bundles start from just GH₵4.20 for 1GB."
      }
    },
    {
      "@type": "Question",
      name: "Do the data bundles expire?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Our MTN bundles are non-expiry data packages. Telecel and AirtelTigo bundles have standard validity periods as per network terms."
      }
    },
    {
      "@type": "Question",
      name: "How can I become a data reseller in Ghana?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Join Data Hustle for free! Sign up, top up your wallet, and start reselling data bundles at your own prices. No minimum purchase required. Over 10,000 resellers trust us."
      }
    },
    {
      "@type": "Question",
      name: "What payment methods does Data Hustle accept?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "We accept Mobile Money (MTN MoMo, Telecel Cash, AirtelTigo Money) and wallet payments. Wallet payments have no transaction fees!"
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
      </body>
    </html>
  );
}