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
  }
};
