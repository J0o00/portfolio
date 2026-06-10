import { supabase } from '../../../src/lib/supabase';

/**
 * Fetches the currently published profile.
 */
export async function getPublishedProfile() {
  const { data, error } = await supabase
    .from('site_profile')
    .select('*')
    .limit(1);

  if (error) {
    throw error;
  }
  
  const profile = data && data.length > 0 ? data[0] : null;

  if (profile && profile.profile_picture) {
    profile.profile_image_url = profile.profile_picture;
  }

  return profile || {
    name: '',
    headline: '',
    bio: '',
    email: '',
    phone: '',
    location: '',
    profile_image_url: '',
    profile_thumbnail_url: '',
    cover_image: '',
    resume_url: '',
    hero_settings: {},
    about_settings: {},
    seo_settings: {},
    social_links: {},
    version: 0
  };
}

/**
 * Fetches the most recent draft/revision.
 */
export async function getLatestDraft() {
  try {
    const profile = await getPublishedProfile();
    console.log(`[Profile] Loaded profile ID: ${profile.id}`);

    const { data, error } = await supabase
      .from('content_revisions')
      .select('*')
      .eq('content_type', 'site_profile')
      .eq('content_id', profile.id)
      .order('created_at', { ascending: false })
      .limit(1);

    if (error) {
      console.log('[Profile] No revisions found.');
      console.log('[Profile] Starting with clean draft state.');
      return null;
    }

    if (!data || !data.length) {
      console.log('[Profile] No revisions found.');
      console.log('[Profile] Starting with clean draft state.');
      return null;
    }

    return data[0];
  } catch (err) {
    return null;
  }
}

/**
 * Fetches all revisions for the profile history.
 */
export async function getProfileHistory() {
  try {
    const profile = await getPublishedProfile();
    
    const { data, error } = await supabase
      .from('content_revisions')
      .select('id, version, created_at, created_by, users_profile(email)')
      .eq('content_type', 'site_profile')
      .eq('content_id', profile.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.log(`[Profile] Loaded revisions: 0`);
      return [];
    }
    
    console.log(`[Profile] Loaded revisions: ${data ? data.length : 0}`);
    return data || [];
  } catch (err) {
    console.log(`[Profile] Loaded revisions: 0`);
    return [];
  }
}

/**
 * Saves a new draft to the revisions table without publishing to the public site.
 */
export async function saveDraft(profileData, userId) {
  const profile = await getPublishedProfile();

  // Find the latest version number
  const latestDraft = await getLatestDraft();
  const nextVersion = latestDraft ? latestDraft.version + 1 : 1;

  const { data, error } = await supabase
    .from('content_revisions')
    .insert([{
      content_type: 'site_profile',
      content_id: profile.id,
      version: nextVersion,
      snapshot_json: profileData,
      created_by: userId
    }])
    .select();

  if (error) throw error;
  return data && data.length > 0 ? data[0] : null;
}

/**
 * Publishes a specific revision to the active site_profile table.
 */
export async function publishRevision(revisionId, userId) {
  const profile = await getPublishedProfile();

  // 1. Fetch the revision
  const { data: revisions, error: fetchErr } = await supabase
    .from('content_revisions')
    .select('*')
    .eq('id', revisionId)
    .limit(1);

  if (fetchErr) throw fetchErr;
  if (!revisions || !revisions.length) throw new Error('Revision not found');

  const revision = revisions[0];
  const profileData = revision.snapshot_json;

  // 2. Update site_profile
  const { data, error } = await supabase
    .from('site_profile')
    .update({
      name: profileData.name || null,
      headline: profileData.headline || null,
      bio: profileData.bio || null,
      email: profileData.email || null,
      phone: profileData.phone || null,
      location: profileData.location || null,
      profile_picture: profileData.profile_image_url || null, // Map to actual DB column
      profile_thumbnail_url: profileData.profile_thumbnail_url || null,
      cover_image: profileData.cover_image || null,
      resume_url: profileData.resume_url || null,
      hero_settings: profileData.hero_settings || {},
      about_settings: profileData.about_settings || {},
      seo_settings: profileData.seo_settings || {},
      social_links: profileData.social_links || {},
      version: revision.version,
      updated_by: userId,
      updated_at: new Date().toISOString()
    })
    .eq('id', 1)
    .select();

  if (error) throw error;
  return data && data.length > 0 ? data[0] : null;
}
