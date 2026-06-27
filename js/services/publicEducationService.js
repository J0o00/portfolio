import { supabase } from '../../src/lib/supabase.js';

export const publicEducationService = {
  async getPublishedEducation() {
    try {
      const { data: profile } = await supabase
        .from('site_profile')
        .select('about_settings')
        .limit(1)
        .single();

      if (profile && profile.about_settings && Array.isArray(profile.about_settings.education) && profile.about_settings.education.length > 0) {
        return profile.about_settings.education;
      }
    } catch (e) {
      console.error('[PublicEducationService] Error fetching profile settings:', e);
    }

    const { data, error } = await supabase
      .from('education')
      .select('*')
      .order('display_order', { ascending: true })
      .order('start_date', { ascending: false });

    if (error) {
      console.error('[PublicEducationService] Error fetching education:', error);
      return [];
    }
    
    return data || [];
  }
};
