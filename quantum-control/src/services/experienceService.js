import { supabase } from '../../../src/lib/supabase';

export const experienceService = {
  // GET all experience
  async getExperience() {
    const { data, error } = await supabase
      .from('experience')
      .select(`
        id, role_title, organization, type, start_date, end_date, is_current, status, featured, display_order,
        cover_media_id,
        cover_media:media_library!experience_cover_media_id_fkey(bucket, storage_path, filename)
      `)
      .order('display_order', { ascending: true })
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  },

  // GET single experience by id
  async getExperienceById(id) {
    const { data, error } = await supabase
      .from('experience')
      .select(`
        *,
        cover_media:media_library!experience_cover_media_id_fkey(*),
        experience_tag_links(experience_tags(*))
      `)
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  },

  // CREATE
  async createExperience(experienceData) {
    const allowed = ['role_title', 'organization', 'slug', 'type', 'summary', 'start_date', 'end_date', 'is_current', 'status', 'featured', 'featured_order', 'display_order', 'cover_media_id', 'created_by', 'updated_by'];
    const payload = {};
    allowed.forEach(key => { if (experienceData[key] !== undefined) payload[key] = experienceData[key]; });
    const { data, error } = await supabase
      .from('experience')
      .insert([payload])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // UPDATE
  async updateExperience(id, updates) {
    const allowed = ['role_title', 'organization', 'slug', 'type', 'summary', 'start_date', 'end_date', 'is_current', 'status', 'featured', 'featured_order', 'display_order', 'cover_media_id', 'created_by', 'updated_by'];
    const payload = {};
    allowed.forEach(key => { if (updates[key] !== undefined) payload[key] = updates[key]; });
    const { data, error } = await supabase
      .from('experience')
      .update(payload)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // DELETE
  async deleteExperience(id) {
    const { error } = await supabase
      .from('experience')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  // --- TAGS ---
  async getTags() {
    const { data, error } = await supabase
      .from('experience_tags')
      .select('*')
      .order('name');
    if (error) throw error;
    return data;
  },

  async createTag(name) {
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
    const { data, error } = await supabase
      .from('experience_tags')
      .insert([{ name, slug }])
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async addTagToExperience(experienceId, tagId) {
    const { error } = await supabase
      .from('experience_tag_links')
      .insert([{ experience_id: experienceId, tag_id: tagId }]);
    if (error) throw error;
  },

  async removeTagFromExperience(experienceId, tagId) {
    const { error } = await supabase
      .from('experience_tag_links')
      .delete()
      .match({ experience_id: experienceId, tag_id: tagId });
    if (error) throw error;
  },

  // --- REVISIONS ---
  async getExperienceRevisions(id) {
    const { data, error } = await supabase
      .from('content_revisions')
      .select('*, users_profile(email)')
      .eq('content_type', 'experience')
      .eq('content_id', id)
      .order('version', { ascending: false });
    if (error) throw error;
    return data;
  },

  async createExperienceRevision(id, userId, label) {
    const experience = await this.getExperienceById(id);
    // Get latest version number
    const { data: latestRevs } = await supabase
      .from('content_revisions')
      .select('version')
      .eq('content_type', 'experience')
      .eq('content_id', id)
      .order('version', { ascending: false })
      .limit(1);

    const nextVersion = latestRevs && latestRevs.length > 0 ? latestRevs[0].version + 1 : 1;

    const { error } = await supabase
      .from('content_revisions')
      .insert([{
        content_type: 'experience',
        content_id: id,
        version: nextVersion,
        snapshot_json: experience,
        revision_label: label,
        created_by: userId
      }]);

    if (error) throw error;
  },

  async restoreExperienceRevision(id, revisionId, userId) {
    const { data: revision, error: revError } = await supabase
      .from('content_revisions')
      .select('*')
      .eq('id', revisionId)
      .single();

    if (revError) throw revError;

    // Save current state before restoring
    await this.createExperienceRevision(id, userId, 'Auto-Snapshot: Before Restore');

    const snapshot = revision.snapshot_json;

    // Restore main record
    const { error: updateError } = await supabase
      .from('experience')
      .update({
        role_title: snapshot.role_title,
        organization: snapshot.organization,
        location: snapshot.location,
        type: snapshot.type,
        start_date: snapshot.start_date,
        end_date: snapshot.end_date,
        is_current: snapshot.is_current,
        summary: snapshot.summary,
        description: snapshot.description,
        featured: snapshot.featured,
        featured_order: snapshot.featured_order,
        display_order: snapshot.display_order,
        status: snapshot.status,
        cover_media_id: snapshot.cover_media_id
      })
      .eq('id', id);

    if (updateError) throw updateError;

    // Restore tags (clear and re-insert)
    await supabase.from('experience_tag_links').delete().eq('experience_id', id);
    if (snapshot.tags && snapshot.tags.length > 0) {
      const tagLinks = snapshot.tags.map(t => ({ experience_id: id, tag_id: t.id }));
      await supabase.from('experience_tag_links').insert(tagLinks);
    }
  }
};
