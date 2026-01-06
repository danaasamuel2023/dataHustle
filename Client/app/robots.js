// Robots.txt configuration for Data Hustle Ghana
// Controls how search engines crawl and index the site

export default function robots() {
  const baseUrl = 'https://datahustle.shop';

  return {
    rules: [
      {
        userAgent: '*',
        allow: [
          '/',
          '/buy',
          '/mtnup2u',
          '/TELECEL',
          '/at-ishare',
          '/mtnup2u-pricing',
          '/SignIn',
          '/SignUp',
          '/howtodeposite',
          '/registerFriend',
        ],
        disallow: [
          '/admin',
          '/admin-*',
          '/api/',
          '/api-keys',
          '/api-doc',
          '/allorders',
          '/exportorders',
          '/update-price',
          '/testing',
          '/toggle',
          '/reports',
          '/report/',
          '/numbers',
          '/sms',
          '/bulkmtn',
          '/verification*',
          '/verify-otp',
          '/verify-payment',
          '/payment/',
          '/waiting',
          '/_next/',
          '/static/',
        ],
      },
      {
        userAgent: 'Googlebot',
        allow: '/',
        crawlDelay: 1,
      },
      {
        userAgent: 'Bingbot',
        allow: '/',
        crawlDelay: 2,
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  };
}
