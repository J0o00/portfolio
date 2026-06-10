import { supabase } from '../src/lib/supabase.js';

export async function initProfileData() {
  const urlParams = new URLSearchParams(window.location.search);
  const isPreview = urlParams.get('preview') === 'true';

  let profileData = null;

  try {
    if (isPreview) {
      // First fetch site_profile to get its ID
      const { data: profileDataArr } = await supabase
        .from('site_profile')
        .select('id')
        .limit(1);
        
      const profile = profileDataArr && profileDataArr.length > 0 ? profileDataArr[0] : null;

      if (profile) {
        console.log(`[Profile] Loaded profile ID: ${profile.id}`);
        // Try fetching latest draft
        const { data, error } = await supabase
          .from('content_revisions')
          .select('*')
          .eq('content_type', 'site_profile')
          .eq('content_id', profile.id)
          .order('created_at', { ascending: false })
          .limit(1);
      
      if (!error && data && data.length > 0) {
        profileData = data[0].snapshot_json;
        console.log('[ProfileLoader] Loaded draft profile data for Preview Mode');
        
        const previewBanner = document.createElement('div');
        previewBanner.style = "position: fixed; top: 0; left: 0; right: 0; background: #e74c3c; color: white; text-align: center; padding: 4px; z-index: 10000; font-weight: bold; font-size: 12px; letter-spacing: 1px;";
        previewBanner.innerText = "PREVIEW MODE - SHOWING UNPUBLISHED DRAFT";
        document.body.appendChild(previewBanner);
      }
      }
    }

    if (!profileData) {
      // Fetch published profile
      const { data, error } = await supabase
        .from('site_profile')
        .select('*')
        .eq('id', 1)
        .limit(1);
      
      if (!error && data && data.length > 0) {
        profileData = data[0];
      }
    }

    if (profileData) {
      applyProfileDataToDOM(profileData);
    }
  } catch (err) {
    console.error('[ProfileLoader] Failed to load profile data:', err);
  }
}

function applyProfileDataToDOM(data) {
  // Identity
  if (data.name) {
    const heroName = document.getElementById('hero-name');
    if (heroName) heroName.innerHTML = data.name.replace(' ', '<br>');
  }
  
  if (data.headline) {
    const subtitle = document.querySelector('.hero-subtitle');
    if (subtitle) subtitle.innerText = data.headline;
  }

  // Hero Settings
  if (data.hero_settings) {
    const hero = data.hero_settings;
    if (hero.greeting) {
      const greeting = document.getElementById('greeting-text');
      if (greeting) greeting.innerText = hero.greeting;
    }
  }

  // About Settings
  if (data.about_settings) {
    const about = data.about_settings;
    if (about.biography || data.bio) {
      const aboutContent = document.querySelector('.about-content');
      // Simple replace: just replace first paragraph
      if (aboutContent) {
        const p = aboutContent.querySelector('p');
        if (p) p.innerText = about.biography || data.bio;
      }
    }
  }

  // Media
  if (data.profile_image_url) {
    const img = document.querySelector('.profile-image');
    if (img) {
      img.src = data.profile_image_url;
      img.style.display = 'block';
    }
  }

  // SEO Settings
  if (data.seo_settings) {
    if (data.seo_settings.meta_title) {
      document.title = data.seo_settings.meta_title;
    }
    if (data.seo_settings.meta_description) {
      let metaDesc = document.querySelector('meta[name="description"]');
      if (metaDesc) metaDesc.setAttribute('content', data.seo_settings.meta_description);
    }
  }
}
