import { supabase } from '../../../src/lib/supabase';

export async function getSkills() {
  const { data, error } = await supabase
    .from('skills')
    .select('*')
    .order('display_order', { ascending: true })
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching skills:', error);
    throw error;
  }
  return data || [];
}

export async function getSkillById(id) {
  const { data, error } = await supabase
    .from('skills')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error(`Error fetching skill ${id}:`, error);
    throw error;
  }
  return data;
}

export async function createSkill(skillData) {
  // ensure slug is clean
  if (!skillData.slug && skillData.name) {
    skillData.slug = skillData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  }

  const { data, error } = await supabase
    .from('skills')
    .insert([skillData])
    .select()
    .single();

  if (error) {
    console.error('Error creating skill:', error);
    throw error;
  }
  return data;
}

export async function updateSkill(id, skillData) {
  const { data, error } = await supabase
    .from('skills')
    .update(skillData)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error(`Error updating skill ${id}:`, error);
    throw error;
  }
  return data;
}

export async function deleteSkill(id) {
  const { error } = await supabase
    .from('skills')
    .delete()
    .eq('id', id);

  if (error) {
    console.error(`Error deleting skill ${id}:`, error);
    throw error;
  }
  return true;
}
