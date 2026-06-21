import { supabase } from '../../../src/lib/supabase';

export async function restoreOldData() {
  console.log("Restoring old data...");
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    console.error("No user found, cannot restore.");
    return;
  }

  // 1. Projects
  const { data: projects } = await supabase.from('projects').select('*');
  
  const digitalTwin = projects.find(p => p.title.toLowerCase().includes('digital twin'));
  if (digitalTwin) {
    await supabase.from('projects').update({
      short_description: 'TIA Portal • PLC • SCADA',
      full_description: '<p>Programmed and validated industrial PLC sequences using Siemens TIA Portal. Designed SCADA and HMI interfaces for live process supervision. Built structured fault-safe control architectures covering error states, watchdog timers, and operator alert systems.</p>'
    }).eq('id', digitalTwin.id);
    console.log("Updated Digital Twin");
  } else {
    await supabase.from('projects').insert([{
      title: 'Industrial Control Systems',
      slug: 'industrial-control-systems',
      short_description: 'TIA Portal • PLC • SCADA',
      full_description: '<p>Programmed and validated industrial PLC sequences using Siemens TIA Portal. Designed SCADA and HMI interfaces for live process supervision. Built structured fault-safe control architectures covering error states, watchdog timers, and operator alert systems.</p>',
      status: 'published',
      featured_order: 1,
      created_by: user.id
    }]);
    console.log("Inserted Industrial Control");
  }

  const ebaja = projects.find(p => p.title.toLowerCase().includes('ebaja') || p.title.toLowerCase().includes('energy management'));
  if (!ebaja) {
    await supabase.from('projects').insert([{
      title: 'Energy Management',
      slug: 'energy-management',
      short_description: 'BMS • Simulation • Integration',
      full_description: '<p>Engineered a complete Battery Management System for an electric all-terrain vehicle. Validated cell balancing algorithms in MATLAB before physical assembly.</p>',
      status: 'published',
      featured_order: 2,
      created_by: user.id
    }]);
    console.log("Inserted Energy Management");
  }

  const deterrent = projects.find(p => p.title.toLowerCase().includes('autonomous') || p.title.toLowerCase().includes('deterrent'));
  if (!deterrent) {
    await supabase.from('projects').insert([{
      title: 'Autonomous Detection',
      slug: 'autonomous-detection',
      short_description: 'Computer Vision • Raspberry Pi',
      full_description: '<p>Created an AI-powered field monitoring system using OpenCV and Raspberry Pi to detect unauthorized access and trigger automated deterrence mechanisms in real-time.</p>',
      status: 'published',
      featured_order: 3,
      created_by: user.id
    }]);
    console.log("Inserted Autonomous Detection");
  }

  // 2. Experience
  const { data: experiences } = await supabase.from('experience').select('*');
  
  const siemens = experiences.find(e => e.role_title.toLowerCase().includes('siemens') || (e.organization && e.organization.toLowerCase().includes('siemens')));
  if (siemens) {
    await supabase.from('experience').update({
      start_date: '2025-06-01',
      end_date: '2025-07-31',
      summary: 'Programmed and validated industrial PLC sequences using Siemens TIA Portal. Designed SCADA and HMI interfaces for live process supervision. Built structured fault-safe control architectures covering error states, watchdog timers, and operator alert systems.',
      type: 'Work',
      is_current: false
    }).eq('id', siemens.id);
    console.log("Updated Siemens Intern");
  } else {
    await supabase.from('experience').insert([{
      role_title: 'Industrial Automation Engineer Intern',
      organization: 'Siemens COE, Anna University',
      slug: 'industrial-automation-engineer-intern-siemens',
      start_date: '2025-06-01',
      end_date: '2025-07-31',
      is_current: false,
      summary: 'Programmed and validated industrial PLC sequences using Siemens TIA Portal. Designed SCADA and HMI interfaces for live process supervision. Built structured fault-safe control architectures covering error states, watchdog timers, and operator alert systems.',
      status: 'published',
      type: 'Work',
      created_by: user.id
    }]);
    console.log("Inserted Siemens Intern");
  }

  const liaison = experiences.find(e => e.role_title.toLowerCase().includes('liaison'));
  if (!liaison) {
    const { error: err1 } = await supabase.from('experience').insert([{
      role_title: 'Technical Liaison Intern',
      organization: 'White Matrix Software Solutions',
      slug: 'technical-liaison-intern',
      start_date: '2026-01-01',
      is_current: true,
      summary: 'Bridged client requirements and development execution. Authored structured technical documentation, requirement specifications, and facilitated cross-team communication to maintain delivery accuracy.',
      status: 'published',
      type: 'Work',
      created_by: user.id
    }]);
    if (err1) console.error("Liaison insert error:", err1);
    else console.log("Inserted Technical Liaison");
  }

  const hackathon = experiences.find(e => e.slug === 'winner-best-pitch-beachhack' || e.role_title.toLowerCase().includes('hackathon') || (e.organization && e.organization.toLowerCase().includes('hackathon')));
  if (!hackathon) {
    const { error: err2 } = await supabase.from('experience').insert([{
      role_title: 'Winner & Best Pitch',
      organization: 'BeachHack H4C National Hackathon',
      slug: 'winner-best-pitch-beachhack',
      start_date: '2025-01-01',
      end_date: '2025-01-01',
      is_current: false,
      summary: '1st place from a competitive field for an AI-driven hardware solution. Also awarded 1st place at the Pitch Perfect Idea Competition and reached the finals of the Beach Hack AI Challenge.',
      status: 'published',
      type: 'Award',
      created_by: user.id
    }]);
    if (err2) console.error("Hackathon insert error:", err2);
    else console.log("Inserted Hackathon Winner");
  }
  
  // --- AUTOMATED FIX: Upload local images and link them ---
  console.log("Starting automated fix for local images...");
  
  const localMedia = [
    { 
      type: 'project', 
      slugOrTitleMatch: 'energy-management', 
      cover: '/ebaja-bg.png', 
      gallery: ['/ebaja-schematic.png'] 
    },
    { 
      type: 'project', 
      slugOrTitleMatch: 'autonomous-detection', 
      cover: '/deterrent-bg.png', 
      gallery: ['/deterrent-architecture.png'] 
    },
    { 
      type: 'project', 
      slugOrTitleMatch: 'industrial-control-systems', 
      cover: '/siemens-bg.png', 
      gallery: ['/siemens-diagram.png'] 
    },
    { 
      type: 'research', 
      slugOrTitleMatch: 'patent', 
      cover: '/patent-bg.png', 
      gallery: ['/patent-diagram.png'] 
    }
  ];

  for (const item of localMedia) {
    try {
      // 1. Find the target record
      let targetRecord = null;
      if (item.type === 'project') {
        targetRecord = projects.find(p => p.slug === item.slugOrTitleMatch || p.title.toLowerCase().includes(item.slugOrTitleMatch));
      } else if (item.type === 'research') {
        const { data: research } = await supabase.from('research').select('*').ilike('title', `%${item.slugOrTitleMatch}%`);
        if (research && research.length > 0) targetRecord = research[0];
      }

      if (!targetRecord) {
        console.log(`Could not find ${item.type} for ${item.slugOrTitleMatch}, skipping.`);
        continue;
      }

      // Helper to upload and register media
      const uploadAndRegister = async (url) => {
        const filename = url.replace('/', '');
        const storagePath = `${user.id}/${Date.now()}_${filename}`;
        
        // Check if we already registered it (to prevent duplicates if run multiple times)
        const { data: existingMedia } = await supabase.from('media_library').select('*').eq('filename', filename).limit(1);
        if (existingMedia && existingMedia.length > 0) return existingMedia[0];

        console.log(`Uploading ${filename}...`);
        const res = await fetch(url);
        if (!res.ok) {
          console.warn(`Failed to fetch ${url}, it might not exist locally anymore.`);
          return null;
        }
        const blob = await res.blob();
        
        const { error: uploadError } = await supabase.storage.from('media-library').upload(storagePath, blob, { upsert: true });
        if (uploadError) {
          console.error(`Upload error for ${filename}:`, uploadError);
          return null;
        }

        const { data: insertedMedia, error: insertError } = await supabase.from('media_library').insert([{
          filename,
          bucket: 'media-library',
          storage_path: storagePath,
          asset_type: 'image',
          mime_type: blob.type,
          file_size: blob.size,
          uploaded_by: user.id
        }]).select().single();
        
        if (insertError) {
          console.error(`Insert error for ${filename}:`, insertError);
          return null;
        }
        return insertedMedia;
      };

      // Handle Cover
      if (item.cover && !targetRecord.cover_media_id) {
        const media = await uploadAndRegister(item.cover);
        if (media) {
          if (item.type === 'project') {
            await supabase.from('projects').update({ cover_media_id: media.id }).eq('id', targetRecord.id);
          } else if (item.type === 'research') {
            await supabase.from('research').update({ cover_media_id: media.id }).eq('id', targetRecord.id);
          }
          console.log(`Linked cover ${item.cover} to ${item.slugOrTitleMatch}`);
        }
      }

      // Handle Gallery (for projects only, based on schema)
      if (item.gallery && item.type === 'project') {
        for (let i = 0; i < item.gallery.length; i++) {
          const gUrl = item.gallery[i];
          const media = await uploadAndRegister(gUrl);
          if (media) {
            // Check if already linked
            const { data: existingLink } = await supabase.from('project_media').select('*').eq('project_id', targetRecord.id).eq('media_id', media.id);
            if (!existingLink || existingLink.length === 0) {
              await supabase.from('project_media').insert([{
                project_id: targetRecord.id,
                media_id: media.id,
                display_order: i
              }]);
              console.log(`Linked gallery image ${gUrl} to ${item.slugOrTitleMatch}`);
            }
          }
        }
      }
    } catch (e) {
      console.error(`Error processing ${item.slugOrTitleMatch}:`, e);
    }
  }

  console.log("Restore complete.");
}
