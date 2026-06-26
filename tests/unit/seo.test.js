import { describe, it, expect } from 'vitest';

function buildSitemapEntry(route, lastmod, priority) {
  return `<url><loc>https://jovialjoyson.com${route}</loc><lastmod>${lastmod}</lastmod><priority>${priority}</priority></url>`;
}

function generatePersonJsonLd(profile) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: profile.name || 'Jovial Joyson',
    jobTitle: profile.headline || 'Electrical & Electronics Engineer',
    url: 'https://jovialjoyson.com',
    sameAs: profile.socials || ['https://github.com/J0o00', 'https://linkedin.com/in/jovial-joyson-0a4882276']
  };
}

describe('SEO & Structured Data Engine', () => {
  it('formats clean XML sitemap entry correctly', () => {
    const xml = buildSitemapEntry('/project/digital-twin-motor', '2026-06-25', '0.8');
    expect(xml).toContain('https://jovialjoyson.com/project/digital-twin-motor');
    expect(xml).toContain('<priority>0.8</priority>');
  });

  it('generates compliant schema.org Person JSON-LD object', () => {
    const jsonLd = generatePersonJsonLd({ name: 'Jovial Joyson', headline: 'EEE Engineer' });
    expect(jsonLd['@type']).toBe('Person');
    expect(jsonLd.sameAs).toContain('https://github.com/J0o00');
  });
});
