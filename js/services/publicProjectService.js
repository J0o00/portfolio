import { supabase } from '../../src/lib/supabase.js';

export const publicProjectService = {
  async getPublishedProjects() {
    const { data, error } = await supabase
      .from('projects')
      .select(`
        *,
        cover_media:media_library!projects_cover_media_id_fkey(*),
        project_tag_links(project_tags(*))
      `)
      .eq('status', 'published')
      .order('featured_order', { ascending: true });

    if (error) {
      console.error('[PublicProjectService] Error fetching projects:', error);
      return [];
    }
    
    // Clean up the data structure
    return data.map(project => {
      let cover_media = project.cover_media;
      if (cover_media && cover_media.bucket && cover_media.storage_path) {
        cover_media.url = supabase.storage.from(cover_media.bucket).getPublicUrl(cover_media.storage_path).data.publicUrl;
      }
      return {
        ...project,
        tags: project.project_tag_links ? project.project_tag_links.map(link => link.project_tags).filter(Boolean) : [],
        cover_media
      };
    });
  },

  async getProjectBySlug(slug) {
    const { data, error } = await supabase
      .from('projects')
      .select(`
        *,
        cover_media:media_library!projects_cover_media_id_fkey(*),
        project_tag_links(project_tags(*)),
        project_media(display_order, media_library(*))
      `)
      .eq('slug', slug)
      .eq('status', 'published')
      .single();

    if (error) {
      console.error(`[PublicProjectService] Error fetching project ${slug}:`, error);
      return null;
    }

    // Clean up the data structure
    const gallery = data.project_media
      ? data.project_media.sort((a, b) => a.display_order - b.display_order).map(pm => {
          const m = pm.media_library;
          if (m && m.bucket && m.storage_path) {
            m.url = supabase.storage.from(m.bucket).getPublicUrl(m.storage_path).data.publicUrl;
          }
          return m;
        }).filter(Boolean)
      : [];

    let cover_media = data.cover_media;
    if (cover_media && cover_media.bucket && cover_media.storage_path) {
      cover_media.url = supabase.storage.from(cover_media.bucket).getPublicUrl(cover_media.storage_path).data.publicUrl;
    }

    return {
      ...data,
      tags: data.project_tag_links ? data.project_tag_links.map(link => link.project_tags).filter(Boolean) : [],
      cover_media,
      gallery
    };
  }
};
