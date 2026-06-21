import { supabase } from '../../../src/lib/supabase';

export async function getEducationList() {
  const { data, error } = await supabase
    .from('education')
    .select('*')
    .order('display_order', { ascending: true })
    .order('start_date', { ascending: false });

  if (error) {
    console.error('Error fetching education:', error);
    throw error;
  }
  return data || [];
}

export async function getEducationById(id) {
  const { data, error } = await supabase
    .from('education')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error(`Error fetching education ${id}:`, error);
    throw error;
  }
  return data;
}

export async function createEducation(educationData) {
  const { data, error } = await supabase
    .from('education')
    .insert([educationData])
    .select()
    .single();

  if (error) {
    console.error('Error creating education:', error);
    throw error;
  }
  
  // Create initial revision
  await createRevision(data.id, data, educationData.created_by);
  return data;
}

export async function updateEducation(id, educationData, userId) {
  const { data, error } = await supabase
    .from('education')
    .update(educationData)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error(`Error updating education ${id}:`, error);
    throw error;
  }

  // Create new revision
  await createRevision(id, data, userId);
  return data;
}

export async function deleteEducation(id) {
  const { error } = await supabase
    .from('education')
    .delete()
    .eq('id', id);

  if (error) {
    console.error(`Error deleting education ${id}:`, error);
    throw error;
  }
  return true;
}

async function createRevision(contentId, snapshotJson, userId) {
  if (!userId) return; // Need user ID for revisions

  // Find latest version
  const { data: latestRevs } = await supabase
    .from('content_revisions')
    .select('version')
    .eq('content_type', 'education')
    .eq('content_id', contentId)
    .order('version', { ascending: false })
    .limit(1);

  const nextVersion = (latestRevs && latestRevs.length > 0) ? latestRevs[0].version + 1 : 1;

  await supabase
    .from('content_revisions')
    .insert([{
      content_type: 'education',
      content_id: contentId,
      version: nextVersion,
      snapshot_json: snapshotJson,
      created_by: userId
    }]);
}
