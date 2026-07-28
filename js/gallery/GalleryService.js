/**
 * GalleryService.js
 * Data access layer for the Living Gallery. Fetches the media_library
 * from Supabase (the same table Quantum Control uses) and normalizes
 * every row into a flat, UI-ready shape.
 *
 * Nothing is hardcoded. Nothing is uploaded separately.
 * If a project, research item, or experience record gets a new image
 * in Quantum Control, it automatically appears here.
 */

import { supabase } from '../../src/lib/supabase.js';

const TABLE = 'media_library';

const COLUMNS = [
  'id', 'url', 'title', 'description', 'alt_text', 'category', 'tags',
  'project_slug', 'research_slug', 'experience_slug', 'created_at',
].join(', ');

/**
 * Fetch every published media item, newest first.
 * Throws on network / Supabase errors so the gallery can show
 * a graceful error state instead of an empty screen.
 */
export async function fetchMediaLibrary() {
  const { data, error } = await supabase
    .from(TABLE)
    .select(COLUMNS)
    .order('created_at', { ascending: false });

  if (error) throw new Error(`Gallery: ${error.message}`);

  return (data ?? []).map(normalizeItem);
}

function normalizeItem(row) {
  return {
    id: row.id,
    url: row.url,
    title: (row.title || '').trim() || 'Untitled',
    description: row.description ?? '',
    altText: row.alt_text || row.title || 'Engineering media',
    category: row.category || 'Uncategorized',
    tags: normalizeTags(row.tags),
    projectSlug: row.project_slug || null,
    researchSlug: row.research_slug || null,
    experienceSlug: row.experience_slug || null,
    createdAt: row.created_at,
  };
}

function normalizeTags(tags) {
  if (Array.isArray(tags)) return tags.filter(Boolean);
  if (typeof tags === 'string' && tags.length)
    return tags.split(',').map(t => t.trim()).filter(Boolean);
  return [];
}
