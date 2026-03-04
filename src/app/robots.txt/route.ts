export async function GET() {
  const robots = `# hobbydork Robots.txt
User-agent: *
Allow: /
Disallow: /admin/
Disallow: /api/
Disallow: /checkout/
Disallow: /messages/
Disallow: /dashboard/
Disallow: /settings/
Disallow: /login/
Disallow: /verify-email/

# Crawl delay (optional - in seconds)
Crawl-delay: 1

# Sitemaps
Sitemap: https://hobbydork.com/sitemap.xml
`;

  return new Response(robots, {
    headers: {
      'Content-Type': 'text/plain',
      'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=604800',
    },
  });
}
