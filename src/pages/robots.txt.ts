import type { APIRoute } from 'astro';

// Preview builds (placeholders allowed, e.g. GitHub Pages) stay out of search engines.
const preview = process.env.ALLOW_PLACEHOLDERS === '1';

export const GET: APIRoute = ({ site }) => {
  const root = new URL(import.meta.env.BASE_URL.replace(/\/?$/, '/'), site);
  const body = preview
    ? 'User-agent: *\nDisallow: /\n'
    : `User-agent: *\nAllow: /\n\nSitemap: ${new URL('sitemap.xml', root)}\n`;
  return new Response(body, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
};
