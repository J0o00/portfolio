import { supabase } from '../../../src/lib/supabase';

export const researchService = {
  // ─── CORE CRUD ─────────────────────────────────────────────────────────────

  async getResearchList() {
    const { data, error } = await supabase
      .from('research')
      .select('id, title, type, status, published_date, is_ongoing, updated_at')
      .order('updated_at', { ascending: false });

    if (error) throw error;
    return data;
  },

  async getResearchById(id) {
    const { data, error } = await supabase
      .from('research')
      .select('*, media_library!research_cover_media_id_fkey(*)')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  },

  async createResearch({ title, slug, type, userId }) {
    const { data, error } = await supabase
      .from('research')
      .insert({
        title,
        slug,
        type,
        abstract: '',
        status: 'draft',
        created_by: userId,
        updated_by: userId
      })
      .select('id, title, type, status, published_date, is_ongoing, updated_at')
      .single();

    if (error) throw error;
    return data;
  },

  async updateResearch(id, payload) {
    const { data, error } = await supabase
      .from('research')
      .update(payload)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async deleteResearch(id) {
    const { error } = await supabase
      .from('research')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  // ─── TAGS ──────────────────────────────────────────────────────────────────

  async getTags() {
    const { data, error } = await supabase
      .from('research_tags')
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
      .from('research_tags')
      .insert({ name, slug })
      .select()
      .single();
      
    if (error) throw error;
    return data;
  },

  async getResearchTags(researchId) {
    const { data, error } = await supabase
      .from('research_tag_links')
      .select('tag_id, research_tags(*)')
      .eq('research_id', researchId);
      
    if (error) throw error;
    return data.map(item => item.research_tags);
  },

  async saveResearchTags(researchId, tagIds) {
    const { data: existingLinks, error: fetchError } = await supabase
      .from('research_tag_links')
      .select('tag_id')
      .eq('research_id', researchId);

    if (fetchError) throw fetchError;

    const existingTagIds = existingLinks.map(l => l.tag_id);
    const uniqueTagIds = [...new Set(tagIds)];

    const toDeleteIds = existingTagIds.filter(id => !uniqueTagIds.includes(id));
    const toInsertIds = uniqueTagIds.filter(id => !existingTagIds.includes(id));

    if (toDeleteIds.length > 0) {
      const { error: deleteError } = await supabase
        .from('research_tag_links')
        .delete()
        .eq('research_id', researchId)
        .in('tag_id', toDeleteIds);
      if (deleteError) throw deleteError;
    }

    if (toInsertIds.length > 0) {
      const insertPayload = toInsertIds.map((tagId) => ({
        research_id: researchId,
        tag_id: tagId
      }));

      const { error: insertError } = await supabase
        .from('research_tag_links')
        .insert(insertPayload);
      if (insertError) throw insertError;
    }
  },

  // ─── REVISIONS ─────────────────────────────────────────────────────────────

  async createResearchRevision(researchId, userId, label = 'Manual Snapshot') {
    // 1. Fetch current state
    const researchData = await this.getResearchById(researchId);
    const tagsData = await this.getResearchTags(researchId);

    const snapshot = {
      research: researchData,
      tags: tagsData.map(t => t.id)
    };

    // 2. Determine next version
    const { data: latestRevisions, error: revError } = await supabase
      .from('content_revisions')
      .select('version')
      .eq('content_id', researchId)
      .eq('content_type', 'research')
      .order('version', { ascending: false })
      .limit(1);

    if (revError) throw revError;
    const nextVersion = latestRevisions.length > 0 ? latestRevisions[0].version + 1 : 1;

    // 3. Save snapshot
    const { data, error } = await supabase
      .from('content_revisions')
      .insert({
        content_type: 'research',
        content_id: researchId,
        version: nextVersion,
        snapshot_json: snapshot,
        revision_label: label,
        created_by: userId
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async getResearchRevisions(researchId) {
    const { data, error } = await supabase
      .from('content_revisions')
      .select('id, version, revision_label, created_at, created_by, users_profile(email)')
      .eq('content_id', researchId)
      .eq('content_type', 'research')
      .order('version', { ascending: false });

    if (error) throw error;
    return data;
  },

  async restoreResearchRevision(researchId, revisionId, userId) {
    // 1. Auto-snapshot before destructive action
    await this.createResearchRevision(researchId, userId, 'Auto-Snapshot before Restore');

    // 2. Fetch the target revision
    const { data: revision, error: fetchError } = await supabase
      .from('content_revisions')
      .select('snapshot_json')
      .eq('id', revisionId)
      .single();

    if (fetchError) throw fetchError;

    const snapshot = revision.snapshot_json;

    // 3. Restore Core Data
    const payload = {
      title: snapshot.research.title,
      slug: snapshot.research.slug,
      type: snapshot.research.type,
      reference_number: snapshot.research.reference_number,
      venue: snapshot.research.venue,
      authors: snapshot.research.authors,
      status: snapshot.research.status,
      research_status: snapshot.research.research_status,
      next_steps: snapshot.research.next_steps,
      abstract: snapshot.research.abstract,
      content: snapshot.research.content,
      url: snapshot.research.url,
      cover_media_id: snapshot.research.cover_media_id,
      published_date: snapshot.research.published_date,
      featured: snapshot.research.featured,
      featured_order: snapshot.research.featured_order,
      is_ongoing: snapshot.research.is_ongoing,
      updated_by: userId
    };

    await this.updateResearch(researchId, payload);

    // 4. Restore Tags
    await this.saveResearchTags(researchId, snapshot.tags || []);
  }
};
