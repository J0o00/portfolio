/**
 * GalleryService.js
 * Data access layer for the Living Gallery. Fetches the media_library
 * from Supabase and normalizes every row into a flat, UI-ready shape.
 */

import { supabase } from '../../src/lib/supabase.js';

const TABLE = 'media_library';

const COLUMNS = [
  'id', 'filename', 'bucket', 'storage_path', 'alt_text', 'tags', 'created_at'
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
  // Generate public URL using Supabase Storage API
  const { data: { publicUrl } } = supabase.storage
    .from(row.bucket)
    .getPublicUrl(row.storage_path);

  return {
    id: row.id,
    url: publicUrl,
    title: (row.filename || '').trim() || 'Untitled',
    description: '',
    altText: row.alt_text || row.filename || 'Engineering media',
    category: 'Media',
    tags: normalizeTags(row.tags),
    createdAt: row.created_at,
  };
}

function normalizeTags(tags) {
  if (Array.isArray(tags)) return tags.filter(Boolean);
  if (typeof tags === 'string' && tags.length)
    return tags.split(',').map(t => t.trim()).filter(Boolean);
  return [];
}
