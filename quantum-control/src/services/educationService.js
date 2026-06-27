import { supabase } from '../../../src/lib/supabase';

function decodeEducationRow(row) {
  if (!row) return row;
  let desc = row.description || '';
  let meta = { status: 'published', cgpa: null, featured: false, display_order: row.display_order || 0 };
  const match = desc.match(/<!--meta:(.*?)-->/);
  if (match && match[1]) {
    try {
      const parsed = JSON.parse(match[1]);
      meta = { ...meta, ...parsed };
      desc = desc.replace(/<!--meta:.*?-->/g, '').trim();
    } catch (e) {}
  }
  return {
    ...row,
    status: meta.status || 'published',
    cgpa: meta.cgpa || null,
    featured: !!meta.featured,
    display_order: meta.display_order !== undefined ? meta.display_order : (row.display_order || 0),
    description: desc
  };
}

function encodeEducationPayload(data) {
  const allowed = ['institution', 'degree', 'field_of_study', 'start_date', 'end_date', 'display_order', 'created_by'];
  const cleaned = {};
  allowed.forEach(key => {
    if (data[key] !== undefined) cleaned[key] = data[key];
  });
  
  let desc = data.description || '';
  desc = desc.replace(/<!--meta:.*?-->/g, '').trim();
  
  const meta = {
    status: data.status || 'published',
    cgpa: data.cgpa || null,
    featured: !!data.featured,
    display_order: parseInt(data.display_order) || 0
  };
  
  cleaned.description = (desc ? desc + '\n\n' : '') + `<!--meta:${JSON.stringify(meta)}-->`;
  if (data.display_order !== undefined) cleaned.display_order = parseInt(data.display_order) || 0;
  return cleaned;
}

async function syncEducationToProfile(allEduList) {
  try {
    let list = allEduList;
    if (!list) {
      const { data } = await supabase
        .from('education')
        .select('*')
        .order('display_order', { ascending: true })
        .order('start_date', { ascending: false });
      list = (data || []).map(decodeEducationRow);
    }
    const publishedList = list.filter(e => e.status === 'published');
    const { data: profile } = await supabase.from('site_profile').select('*').limit(1).single();
    if (profile) {
      const updatedSettings = {
        ...(profile.about_settings || {}),
        education: publishedList
      };
      await supabase.from('site_profile').update({ about_settings: updatedSettings }).eq('id', profile.id);
    }
  } catch (err) {
    console.error('Error syncing education to profile:', err);
  }
}

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
  const decoded = (data || []).map(decodeEducationRow);
  syncEducationToProfile(decoded).catch(e => console.error(e));
  return decoded;
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
  return decodeEducationRow(data);
}

export async function createEducation(educationData) {
  const payload = encodeEducationPayload(educationData);
  const { data, error } = await supabase
    .from('education')
    .insert([payload])
    .select()
    .single();

  if (error) {
    console.error('Error creating education:', error);
    throw error;
  }
  
  const decoded = decodeEducationRow(data);
  await createRevision(data.id, decoded, educationData.created_by);
  await syncEducationToProfile();
  return decoded;
}

export async function updateEducation(id, educationData, userId) {
  const payload = encodeEducationPayload(educationData);
  const { data, error } = await supabase
    .from('education')
    .update(payload)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error(`Error updating education ${id}:`, error);
    throw error;
  }

  const decoded = decodeEducationRow(data);
  await createRevision(id, decoded, userId);
  await syncEducationToProfile();
  return decoded;
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
  await syncEducationToProfile();
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
