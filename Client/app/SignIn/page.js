// app/SignIn/page.jsx - SEO wrapper for Login Page
import LoginClient from './LoginClient';

export const metadata = {
  title: "Sign In | Data Hustle - Ghana's Premier Data Marketplace",
  description: "Sign in to Data Hustle - Ghana's trusted data marketplace for resellers. Access your account to buy and sell cheap MTN, Telecel, AirtelTigo data bundles at wholesale prices. Instant delivery, best rates.",
  keywords: [
    // Brand keywords
    "Data Hustle login",
    "Data Hustle Ghana sign in",
    "Data Hustle account",
    "datahustle.shop login",
    
    // Action keywords
    "sign in data reseller Ghana",
    "login data marketplace",
    "data reseller login Ghana",
    "wholesale data account Ghana",
    
    // Feature keywords  
    "cheap data account Ghana",
    "data bundle reseller account",
    "MTN data reseller login",
    "Telecel data reseller login",
    "AirtelTigo data reseller login",
    
    // Market keywords
    "Ghana data marketplace login",
    "buy sell data Ghana",
    "data reselling platform Ghana",
    "wholesale data bundles login",
  ],
  authors: [{ name: "Data Hustle Ghana" }],
  openGraph: {
    title: "Sign In | Data Hustle - Ghana's Premier Data Marketplace",
    description: "Sign in to Ghana's trusted data marketplace. Buy and sell MTN, Telecel, AirtelTigo bundles at wholesale prices. Best rates for resellers!",
    url: "https://datahustle.shop/SignIn",
    siteName: "Data Hustle",
    type: "website",
    locale: "en_GH",
    images: [
      {
        url: "/og-signin.jpg",
        width: 1200,
        height: 630,
        alt: "Data Hustle - Sign In",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Sign In | Data Hustle - Ghana's Data Marketplace",
    description: "Sign in to access wholesale data bundles. MTN, Telecel, AirtelTigo at best prices.",
    images: ["/og-signin.jpg"],
    creator: "@datahustle",
  },
  alternates: {
    canonical: "https://datahustle.shop/SignIn",
  },
  robots: {
    index: true,
    follow: true,
  },
};

const signInSchema = {
  "@context": "https://schema.org",
  "@type": "WebPage",
  "@id": "https://datahustle.shop/SignIn/#webpage",
  "url": "https://datahustle.shop/SignIn",
  "name": "Sign In - Data Hustle Ghana",
  "description": "Sign in to Data Hustle to access wholesale data bundles and reseller features",
  "isPartOf": {
    "@id": "https://datahustle.shop/#website"
  },
  "breadcrumb": {
    "@type": "BreadcrumbList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": "Home",
        "item": "https://datahustle.shop"
      },
      {
        "@type": "ListItem",
        "position": 2,
        "name": "Sign In",
        "item": "https://datahustle.shop/SignIn"
      }
    ]
  }
};

const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "Data Hustle",
  "url": "https://datahustle.shop",
  "logo": "https://datahustle.shop/logo.png",
  "description": "Ghana's premier data marketplace for resellers",
  "address": {
    "@type": "PostalAddress",
    "addressCountry": "GH",
    "addressLocality": "Accra"
  },
  "contactPoint": {
    "@type": "ContactPoint",
    "contactType": "customer service",
    "availableLanguage": "English"
  }
};

export default function SignInPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(signInSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
      />
      <LoginClient />
    </>
  );
}