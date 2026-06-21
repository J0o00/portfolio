import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure we are reading from the project root
const ROOT_DIR = path.resolve(__dirname, '..');
const DIST_DIR = path.join(ROOT_DIR, 'dist');
const ENV_FILE = path.join(ROOT_DIR, '.env.local');

// 1. Initialize Supabase
if (!fs.existsSync(ENV_FILE)) {
  console.error('[Generate Pages] Missing .env.local file. Cannot fetch data.');
  process.exit(1);
}

const envContent = fs.readFileSync(ENV_FILE, 'utf8');
const extractEnv = (key) => {
  const line = envContent.split('\n').find(l => l.startsWith(key + '='));
  return line ? line.split('=')[1].trim() : null;
};

const SUPABASE_URL = extractEnv('VITE_SUPABASE_URL');
const SUPABASE_ANON_KEY = extractEnv('VITE_SUPABASE_ANON_KEY');

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('[Generate Pages] Missing Supabase credentials in .env.local');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// 2. Fetch Data
async function fetchPublishedItems() {
  console.log('[Generate Pages] Fetching published items from Supabase...');
  
  const { data: projects, error: projectsError } = await supabase
    .from('projects')
    .select('title, slug, short_description, cover_media_id, media_library(bucket, storage_path)')
    .eq('status', 'published');
    
  if (projectsError) throw projectsError;

  const { data: research, error: researchError } = await supabase
    .from('research')
    .select('title, slug, abstract, cover_media_id, media_library(bucket, storage_path)')
    .eq('status', 'published');
    
  if (researchError) throw researchError;

  const { data: experience, error: experienceError } = await supabase
    .from('experience')
    .select('role_title, organization, slug, summary, cover_media_id, media_library(bucket, storage_path)')
    .eq('status', 'published');
    
  // Don't throw if experience errors due to missing slug column yet
  if (experienceError) {
    console.warn('[Generate Pages] Warning: Failed to fetch experience items. Have you run the slug migration?');
  }

  return {
    projects: projects || [],
    research: research || [],
    experience: experience || []
  };
}

// Helper to construct public image URL
function getPublicImageUrl(media) {
  if (!media || !media.bucket || !media.storage_path) return null;
  return `${SUPABASE_URL}/storage/v1/object/public/${media.bucket}/${media.storage_path}`;
}

// 3. Generate HTML Files
async function generate() {
  if (!fs.existsSync(path.join(DIST_DIR, 'index.html'))) {
    console.error('[Generate Pages] Base dist/index.html not found! Run Vite build first.');
    process.exit(1);
  }

  const baseHtml = fs.readFileSync(path.join(DIST_DIR, 'index.html'), 'utf8');
  const items = await fetchPublishedItems();

  const generatePage = (type, slug, seoData) => {
    if (!slug) return;
    
    const dir = path.join(DIST_DIR, type, slug);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    const { title, description, image } = seoData;
    
    // Default image if none provided
    const fallbackImage = `${SUPABASE_URL}/storage/v1/object/public/profile-assets/og-default.jpg`;
    const finalImage = image || fallbackImage;
    
    // Calculate relative path back to root for assets (../../)
    // Actually, Vite injects assets as /assets/..., which is absolute from domain root.
    // So we don't need to change asset paths if hosted at root.

    // Inject Preloaded Content & Meta Tags
    let newHtml = baseHtml;
    
    // Replace Title
    newHtml = newHtml.replace(/<title>.*?<\/title>/, `<title>${title} | Jovial Joyson</title>`);
    
    // Replace Meta Description
    newHtml = newHtml.replace(
      /<meta name="description" content=".*?">/, 
      `<meta name="description" content="${description}">`
    );
    
    // Inject Open Graph
    const ogTags = `
    <meta property="og:title" content="${title} | Jovial Joyson">
    <meta property="og:description" content="${description}">
    <meta property="og:image" content="${finalImage}">
    <meta property="og:type" content="article">
    <meta property="twitter:card" content="summary_large_image">
    <script>
      window.__PRELOADED_CONTENT__ = {
        type: "${type}",
        slug: "${slug}"
      };
    </script>
    </head>`;
    
    newHtml = newHtml.replace('</head>', ogTags);
    
    fs.writeFileSync(path.join(dir, 'index.html'), newHtml);
    console.log(`[Generate Pages] Created /${type}/${slug}`);
  };

  items.projects.forEach(p => {
    generatePage('project', p.slug, {
      title: p.title,
      description: p.short_description || 'View my project portfolio.',
      image: getPublicImageUrl(p.media_library)
    });
  });

  items.research.forEach(r => {
    generatePage('research', r.slug, {
      title: r.title,
      description: r.abstract || 'Read my research publication.',
      image: getPublicImageUrl(r.media_library)
    });
  });

  items.experience.forEach(e => {
    generatePage('experience', e.slug, {
      title: `${e.role_title} at ${e.organization}`,
      description: e.summary || 'View my experience timeline.',
      image: getPublicImageUrl(e.media_library)
    });
  });

  console.log('[Generate Pages] Complete!');
}

generate().catch(console.error);
