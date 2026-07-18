import type { APIRoute } from 'astro';

export const GET: APIRoute = async ({ request }) => {
  const url = new URL(request.url);
  const baseUrl = url.origin;

  // List of all pages in the Secura application
  const pages = [
    { path: '', changefreq: 'daily', priority: '1.0' },
    { path: '/about', changefreq: 'weekly', priority: '0.8' },
    { path: '/pricing', changefreq: 'weekly', priority: '0.8' },
    { path: '/contact', changefreq: 'monthly', priority: '0.7' },
    { path: '/encrypted-policy', changefreq: 'monthly', priority: '0.7' },
    { path: '/login', changefreq: 'monthly', priority: '0.6' },
    { path: '/register', changefreq: 'monthly', priority: '0.6' },
    { path: '/terms', changefreq: 'yearly', priority: '0.4' },
    { path: '/privacy', changefreq: 'yearly', priority: '0.4' },
    { path: '/disclaimer', changefreq: 'yearly', priority: '0.4' },
    
    // Core Application and Tools Pages (lower crawling priority since they require authentication)
    { path: '/dashboard', changefreq: 'monthly', priority: '0.5' },
    { path: '/password-manager', changefreq: 'monthly', priority: '0.5' },
    { path: '/invoice-generator', changefreq: 'monthly', priority: '0.5' },
    { path: '/budget-planner', changefreq: 'monthly', priority: '0.5' },
    { path: '/expense-tracker', changefreq: 'monthly', priority: '0.5' },
    { path: '/expiry-reminder', changefreq: 'monthly', priority: '0.5' },
    { path: '/admin', changefreq: 'monthly', priority: '0.3' }
  ];

  const currentDate = new Date().toISOString().split('T')[0];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset 
  xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
  xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
  xsi:schemaLocation="http://www.sitemaps.org/schemas/sitemap/0.9 http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd"
>
${pages
  .map(
    (page) => `  <url>
    <loc>${baseUrl}${page.path}</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`
  )
  .join('\n')}
</urlset>`;

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=86400', // Cache for 1 day
    },
  });
};
