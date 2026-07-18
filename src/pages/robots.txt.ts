import type { APIRoute } from 'astro';

export const GET: APIRoute = async ({ request }) => {
  const url = new URL(request.url);
  const baseUrl = url.origin;

  const robots = `# https://www.robotstxt.org/robotstxt.html
User-agent: *

# Allow crawling of public landing pages and resources
Allow: /$
Allow: /about
Allow: /pricing
Allow: /contact
Allow: /encrypted-policy
Allow: /terms
Allow: /privacy
Allow: /disclaimer

# Disallow crawling of secure authenticated dashboards, login flows, and administration panels
Disallow: /dashboard
Disallow: /password-manager
Disallow: /invoice-generator
Disallow: /budget-planner
Disallow: /expense-tracker
Disallow: /expiry-reminder
Disallow: /login
Disallow: /register
Disallow: /admin

# Sitemap link
Sitemap: ${baseUrl}/sitemap.xml
`;

  return new Response(robots, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=86400', // Cache for 1 day
    },
  });
};
