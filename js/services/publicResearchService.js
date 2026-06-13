import { supabase } from '../../src/lib/supabase.js';

export const publicResearchService = {
  async getPublishedResearch() {
    const { data, error } = await supabase
      .from('research')
      .select(`
        *,
        cover_media:media_library!research_cover_media_id_fkey(*),
        research_tag_links(research_tags(*))
      `)
      .eq('status', 'published')
      .order('featured', { ascending: false })
      .order('featured_order', { ascending: true, nullsFirst: false })
      .order('published_date', { ascending: false, nullsFirst: false })
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[PublicResearchService] Error fetching research:', error);
      return [];
    }

    return data.map(item => ({
      ...item,
      tags: item.research_tag_links ? item.research_tag_links.map(link => link.research_tags).filter(Boolean) : []
    }));
  },

  async getResearchBySlug(slug) {
    const { data, error } = await supabase
      .from('research')
      .select(`
        *,
        cover_media:media_library!research_cover_media_id_fkey(*),
        research_tag_links(research_tags(*))
      `)
      .eq('slug', slug)
      .eq('status', 'published')
      .single();

    if (error) {
      console.error(`[PublicResearchService] Error fetching research ${slug}:`, error);
      return null;
    }

    return {
      ...data,
      tags: data.research_tag_links ? data.research_tag_links.map(link => link.research_tags).filter(Boolean) : []
    };
  }
};
