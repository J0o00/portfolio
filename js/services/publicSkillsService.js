import { supabase } from '../../src/lib/supabase.js';

export const publicSkillsService = {
  async getSkills() {
    const { data, error } = await supabase
      .from('skills')
      .select('*')
      .order('display_order', { ascending: true })
      .order('proficiency', { ascending: false });

    if (error) {
      console.error('[PublicSkillsService] Error fetching skills:', error);
      return [];
    }
    
    return data;
  }
};
