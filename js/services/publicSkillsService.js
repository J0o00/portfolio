import { supabase } from '../../src/lib/supabase.js';

export const publicSkillsService = {
  async getSkills() {
    try {
      const { data: profile } = await supabase
        .from('site_profile')
        .select('about_settings')
        .limit(1)
        .single();

      if (profile && profile.about_settings && Array.isArray(profile.about_settings.skills) && profile.about_settings.skills.length > 0) {
        return profile.about_settings.skills;
      }
    } catch (e) {
      console.error('[PublicSkillsService] Error fetching profile settings:', e);
    }

    const { data, error } = await supabase
      .from('skills')
      .select('*')
      .order('display_order', { ascending: true })
      .order('proficiency', { ascending: false });

    if (error) {
      console.error('[PublicSkillsService] Error fetching skills:', error);
      return [];
    }
    
    return data || [];
  }
};
