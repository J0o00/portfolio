import { supabase } from '../../../src/lib/supabase';

export const projectService = {
  async getProjects() {
    const { data, error } = await supabase
      .from('projects')
      .select('id, title, status, featured, updated_at')
      .order('updated_at', { ascending: false });

    if (error) throw error;
    return data;
  },

  async createProject({ title, slug, userId }) {
    const { data, error } = await supabase
      .from('projects')
      .insert({
        title,
        slug,
        status: 'draft',
        created_by: userId,
        updated_by: userId
      })
      .select('id, title, status, featured, updated_at')
      .single();

    if (error) throw error;
    return data;
  },

  async deleteProject(id) {
    const { error } = await supabase
      .from('projects')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  async getProject(id) {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  },

  async updateProject(id, payload) {
    const { data, error } = await supabase
      .from('projects')
      .update(payload)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async getProjectGallery(id) {
    const { data, error } = await supabase
      .from('project_media')
      .select('id, media_id, display_order, media_library(*)')
      .eq('project_id', id)
      .order('display_order', { ascending: true });

    if (error) throw error;
    return data;
  },

  async saveProjectMedia(projectId, { coverMediaId, galleryMediaIds }) {
    // 1. Update project cover
    const { error: coverError } = await supabase
      .from('projects')
      .update({ cover_media_id: coverMediaId })
      .eq('id', projectId);

    if (coverError) throw coverError;

    // 2. Sync project_media (Gallery)
    const { data: existingMedia, error: fetchError } = await supabase
      .from('project_media')
      .select('id, media_id')
      .eq('project_id', projectId);

    if (fetchError) throw fetchError;

    const existingMediaIds = existingMedia.map(m => m.media_id);
    
    // Ensure unique IDs to prevent duplicate inserts
    const uniqueGalleryIds = [...new Set(galleryMediaIds)];

    const toDeleteIds = existingMedia
      .filter(m => !uniqueGalleryIds.includes(m.media_id))
      .map(m => m.id);

    const toInsertIds = uniqueGalleryIds.filter(id => !existingMediaIds.includes(id));

    if (toDeleteIds.length > 0) {
      const { error: deleteError } = await supabase
        .from('project_media')
        .delete()
        .in('id', toDeleteIds);
      if (deleteError) throw deleteError;
    }

    if (toInsertIds.length > 0) {
      const insertPayload = toInsertIds.map((mediaId) => ({
        project_id: projectId,
        media_id: mediaId,
        display_order: uniqueGalleryIds.indexOf(mediaId)
      }));

      const { error: insertError } = await supabase
        .from('project_media')
        .insert(insertPayload);
      if (insertError) throw insertError;
    }

    // Update display_order for existing assets
    const toUpdate = existingMedia.filter(m => uniqueGalleryIds.includes(m.media_id));
    for (const item of toUpdate) {
      const newOrder = uniqueGalleryIds.indexOf(item.media_id);
      await supabase
        .from('project_media')
        .update({ display_order: newOrder })
        .eq('id', item.id);
    }
  },

  async getTags() {
    const { data, error } = await supabase
      .from('project_tags')
      .select('*')
      .order('name');
    if (error) throw error;
    return data;
  },

  async createTag(name) {
    const slug = name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
      
    const { data, error } = await supabase
      .from('project_tags')
      .insert({ name, slug })
      .select()
      .single();
      
    if (error) throw error;
    return data;
  },

  async getProjectTags(projectId) {
    const { data, error } = await supabase
      .from('project_tag_links')
      .select('tag_id, project_tags(*)')
      .eq('project_id', projectId);
      
    if (error) throw error;
    return data.map(item => item.project_tags);
  },

  async saveProjectTags(projectId, tagIds) {
    const { data: existingLinks, error: fetchError } = await supabase
      .from('project_tag_links')
      .select('tag_id')
      .eq('project_id', projectId);

    if (fetchError) throw fetchError;

    const existingTagIds = existingLinks.map(l => l.tag_id);
    const uniqueTagIds = [...new Set(tagIds)];

    const toDeleteIds = existingTagIds.filter(id => !uniqueTagIds.includes(id));
    const toInsertIds = uniqueTagIds.filter(id => !existingTagIds.includes(id));

    if (toDeleteIds.length > 0) {
      const { error: deleteError } = await supabase
        .from('project_tag_links')
        .delete()
        .eq('project_id', projectId)
        .in('tag_id', toDeleteIds);
      if (deleteError) throw deleteError;
    }

    if (toInsertIds.length > 0) {
      const insertPayload = toInsertIds.map((tagId) => ({
        project_id: projectId,
        tag_id: tagId
      }));

      const { error: insertError } = await supabase
        .from('project_tag_links')
        .insert(insertPayload);
      if (insertError) throw insertError;
    }
  }
};
