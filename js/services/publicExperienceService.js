import { supabase } from '../../src/lib/supabase.js';

export const publicExperienceService = {
  async getPublishedExperience() {
    const { data, error } = await supabase
      .from('experience')
      .select(`
        *,
        cover_media:media_library!experience_cover_media_id_fkey(*),
        experience_tag_links(experience_tags(*))
      `)
      .eq('status', 'published')
      .order('featured', { ascending: false })
      .order('featured_order', { ascending: true, nullsFirst: false })
      .order('display_order', { ascending: true })
      .order('start_date', { ascending: false, nullsFirst: false })
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[PublicExperienceService] Error fetching experience:', error);
      return [];
    }

    return data.map(exp => {
      let cover_media = exp.cover_media;
      if (cover_media && cover_media.bucket && cover_media.storage_path) {
        cover_media.url = supabase.storage.from(cover_media.bucket).getPublicUrl(cover_media.storage_path).data.publicUrl;
      }
      return {
        ...exp,
        tags: exp.experience_tag_links ? exp.experience_tag_links.map(link => link.experience_tags).filter(Boolean) : [],
        cover_media
      };
    });
  },

  async getExperienceById(id) {
    const { data, error } = await supabase
      .from('experience')
      .select(`
        *,
        cover_media:media_library!experience_cover_media_id_fkey(*),
        experience_tag_links(experience_tags(*))
      `)
      .eq('id', id)
      .eq('status', 'published')
      .single();

    if (error) {
      console.error(`[PublicExperienceService] Error fetching experience ${id}:`, error);
      return null;
    }

    let cover_media = data.cover_media;
    if (cover_media && cover_media.bucket && cover_media.storage_path) {
      cover_media.url = supabase.storage.from(cover_media.bucket).getPublicUrl(cover_media.storage_path).data.publicUrl;
    }

    return {
      ...data,
      tags: data.experience_tag_links ? data.experience_tag_links.map(link => link.experience_tags).filter(Boolean) : [],
      cover_media
    };
  }
};
