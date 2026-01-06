// app/SignUp/page.jsx - SEO wrapper for SignUp Page
import SignUpClient from './SignupClient';

export const metadata = {
  title: "Sign Up | Data Hustle - Join Ghana's Premier Data Marketplace",
  description: "Create your Data Hustle account - Ghana's trusted data marketplace for resellers. Start buying and selling cheap MTN, Telecel, AirtelTigo data bundles at wholesale prices. Join thousands of successful resellers today!",
  keywords: [
    // Brand keywords
    "Data Hustle signup",
    "Data Hustle Ghana register",
    "Data Hustle create account",
    "datahustle.shop register",
    
    // Action keywords
    "become data reseller Ghana",
    "join data marketplace",
    "register data reseller Ghana",
    "start data business Ghana",
    
    // Feature keywords  
    "data reseller registration",
    "wholesale data account",
    "MTN data reseller signup",
    "Telecel data reseller register",
    "AirtelTigo data reseller join",
    
    // Market keywords
    "Ghana data marketplace register",
    "data reselling business Ghana",
    "start selling data Ghana",
    "wholesale data bundles signup",
    
    // Benefit keywords
    "make money selling data Ghana",
    "data reseller profits",
    "cheap data wholesale Ghana"
  ],
  authors: [{ name: "Data Hustle Ghana" }],
  openGraph: {
    title: "Sign Up | Data Hustle - Join Ghana's Premier Data Marketplace",
    description: "Create your account and start reselling data bundles at wholesale prices. MTN, Telecel, AirtelTigo. Best rates in Ghana!",
    url: "https://datahustle.shop/SignUp",
    siteName: "Data Hustle",
    type: "website",
    locale: "en_GH",
    images: [
      {
        url: "/og-signup.jpg",
        width: 1200,
        height: 630,
        alt: "Data Hustle - Create Account",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Sign Up | Data Hustle - Ghana's Data Marketplace",
    description: "Join thousands of resellers. Buy and sell data bundles at wholesale prices.",
    images: ["/og-signup.jpg"],
    creator: "@datahustle",
  },
  alternates: {
    canonical: "https://datahustle.shop/SignUp",
  },
  robots: {
    index: true,
    follow: true,
  },
};

const signUpSchema = {
  "@context": "https://schema.org",
  "@type": "WebPage",
  "@id": "https://datahustle.shop/SignUp/#webpage",
  "url": "https://datahustle.shop/SignUp",
  "name": "Sign Up - Data Hustle Ghana",
  "description": "Create your Data Hustle account to start buying and selling data bundles",
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
        "name": "Sign Up",
        "item": "https://datahustle.shop/SignUp"
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

export default function SignUpPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(signUpSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
      />
      <SignUpClient />
    </>
  );
}