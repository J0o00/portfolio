import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env variables (Vite usually puts them in .env.local for local dev, 
// but Vercel sets them in the build environment).
// Using process.env natively if run via `node --env-file=.env.local`
// OR they are injected by CI.
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('[Sitemap Generator] VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY is missing. Skipping sitemap generation.');
  process.exit(0); // Exit gracefully so it doesn't break builds without env vars
}

const supabase = createClient(supabaseUrl, supabaseKey);
const BASE_URL = 'https://jovialjoyson.com';

async function generateSitemap() {
  console.log('[Sitemap Generator] Fetching published content...');

  try {
    const { data: projects, error: pErr } = await supabase
      .from('projects')
      .select('slug, updated_at')
      .eq('status', 'published');
    
    if (pErr) throw pErr;

    const { data: research, error: rErr } = await supabase
      .from('research')
      .select('slug, published_date')
      .eq('status', 'published');

    if (rErr) throw rErr;

    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
    xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;

    // 1. Base URL
    xml += `  <url>\n`;
    xml += `    <loc>${BASE_URL}/</loc>\n`;
    xml += `    <changefreq>weekly</changefreq>\n`;
    xml += `    <priority>1.0</priority>\n`;
    xml += `  </url>\n`;

    // 2. Projects
    projects.forEach(p => {
      xml += `  <url>\n`;
      xml += `    <loc>${BASE_URL}/?project=${p.slug}</loc>\n`;
      if (p.updated_at) {
        xml += `    <lastmod>${new Date(p.updated_at).toISOString().split('T')[0]}</lastmod>\n`;
      }
      xml += `    <changefreq>monthly</changefreq>\n`;
      xml += `    <priority>0.8</priority>\n`;
      xml += `  </url>\n`;
    });

    // 3. Research
    research.forEach(r => {
      xml += `  <url>\n`;
      xml += `    <loc>${BASE_URL}/?research=${r.slug}</loc>\n`;
      if (r.published_date) {
        xml += `    <lastmod>${new Date(r.published_date).toISOString().split('T')[0]}</lastmod>\n`;
      }
      xml += `    <changefreq>monthly</changefreq>\n`;
      xml += `    <priority>0.8</priority>\n`;
      xml += `  </url>\n`;
    });

    xml += `</urlset>`;

    const publicDir = path.join(__dirname, '../public');
    if (!fs.existsSync(publicDir)) {
      fs.mkdirSync(publicDir);
    }

    fs.writeFileSync(path.join(publicDir, 'sitemap.xml'), xml);
    console.log(`[Sitemap Generator] Successfully generated sitemap.xml with ${projects.length} projects and ${research.length} research items.`);
  } catch (err) {
    console.error('[Sitemap Generator] Error generating sitemap:', err);
    process.exit(1);
  }
}

generateSitemap();
