import { supabase } from '../../src/lib/supabase.js';

export const publicEducationService = {
  async getPublishedEducation() {
    const { data, error } = await supabase
      .from('education')
      .select('*')
      .eq('status', 'published')
      .order('display_order', { ascending: true })
      .order('start_date', { ascending: false });

    if (error) {
      console.error('[PublicEducationService] Error fetching education:', error);
      return [];
    }
    
    return data;
  }
};
