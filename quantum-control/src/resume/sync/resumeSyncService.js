/**
 * resume/sync/resumeSyncService.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Enterprise Database Synchronization & Audit Logging Service
 *
 * Applies human reviewed entity changes to Supabase CMS tables.
 * Enforces:
 *  - Safe skill merging
 *  - Draft status for Projects & Research
 *  - Clean CMS slug generation
 *  - Audit Logging (audit_logs)
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { supabase } from '../../../../src/lib/supabase';

export function slugify(text) {
  if (!text) return '';
  return text.toString().toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-\+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '');
}

/**
 * Executes approved batch sync against Supabase tables.
 *
 * @param {any} approvedDiff 
 * @param {string} userId 
 * @param {string} uploadId 
 */
export async function syncApprovedChanges(approvedDiff, userId, uploadId) {
  const syncResults = {
    profileUpdated: false,
    skillsAdded: 0,
    skillsUpdated: 0,
    experienceAdded: 0,
    experienceUpdated: 0,
    educationAdded: 0,
    projectsAdded: 0,
    researchAdded: 0
  };

  // 1. Profile sync
  if (approvedDiff.profile && approvedDiff.profile.selected) {
    const prof = approvedDiff.profile.entity;
    await supabase.from('site_profile').update({
      headline: prof.headline || undefined,
      bio: prof.bio || undefined,
      location: prof.location || undefined,
      updated_by: userId,
      updated_at: new Date().toISOString()
    }).eq('id', 1);
    syncResults.profileUpdated = true;
  }

  // 2. Skills sync
  for (const item of (approvedDiff.skills || [])) {
    if (!item.selected) continue;
    const s = item.entity;
    if (item.status === 'NEW') {
      await supabase.from('skills').insert([{
        name: s.name,
        category: s.category || 'General',
        proficiency: s.proficiency || 80,
        slug: slugify(s.name)
      }]);
      syncResults.skillsAdded++;
    } else if (item.status === 'MODIFIED' && item.existingId) {
      await supabase.from('skills').update({
        proficiency: s.proficiency
      }).eq('id', item.existingId);
      syncResults.skillsUpdated++;
    }
  }

  // 3. Experience sync
  for (const item of (approvedDiff.experience || [])) {
    if (!item.selected) continue;
    const e = item.entity;
    if (item.status === 'NEW') {
      await supabase.from('experience').insert([{
        role_title: e.role_title,
        organization: e.organization,
        location: e.location || null,
        summary: e.summary || null,
        description: e.description || null,
        type: e.type || 'Work',
        start_date: e.start_date || null,
        end_date: e.end_date || null,
        is_current: !!e.is_current,
        status: 'published',
        slug: slugify(`${e.organization}-${e.role_title}-${Date.now().toString().slice(-4)}`),
        created_by: userId
      }]);
      syncResults.experienceAdded++;
    } else if (item.status === 'MODIFIED' && item.existingId) {
      await supabase.from('experience').update({
        summary: e.summary || undefined,
        description: e.description || undefined,
        start_date: e.start_date || undefined,
        end_date: e.end_date || undefined,
        updated_by: userId
      }).eq('id', item.existingId);
      syncResults.experienceUpdated++;
    }
  }

  // 4. Education sync
  for (const item of (approvedDiff.education || [])) {
    if (!item.selected) continue;
    const ed = item.entity;
    if (item.status === 'NEW') {
      await supabase.from('education').insert([{
        institution: ed.institution,
        degree: ed.degree || null,
        field_of_study: ed.field_of_study || null,
        cgpa: ed.cgpa || null,
        start_date: ed.start_date || null,
        end_date: ed.end_date || null,
        status: 'published',
        description: ed.description || null
      }]);
      syncResults.educationAdded++;
    }
  }

  // 5. Projects sync (Forced Draft)
  for (const item of (approvedDiff.projects || [])) {
    if (!item.selected) continue;
    const p = item.entity;
    if (item.status === 'NEW') {
      await supabase.from('projects').insert([{
        title: p.title,
        slug: slugify(`${p.title}-${Date.now().toString().slice(-4)}`),
        short_description: p.short_description || null,
        full_description: p.full_description || null,
        status: 'draft', // NEVER auto-publish
        created_by: userId
      }]);
      syncResults.projectsAdded++;
    }
  }

  // 6. Research sync (Forced Draft)
  for (const item of (approvedDiff.research || [])) {
    if (!item.selected) continue;
    const r = item.entity;
    if (item.status === 'NEW') {
      await supabase.from('research').insert([{
        title: r.title,
        slug: slugify(`${r.title}-${Date.now().toString().slice(-4)}`),
        type: r.type || 'Investigation',
        abstract: r.abstract || null,
        venue: r.venue || null,
        status: 'draft', // NEVER auto-publish
        created_by: userId
      }]);
      syncResults.researchAdded++;
    }
  }

  // 7. Update resume_uploads stage
  if (uploadId) {
    await supabase.from('resume_uploads').update({
      status: 'processed',
      processing_stage: 'SYNCED'
    }).eq('id', uploadId);
  }

  // 8. Insert Audit Log
  await supabase.from('audit_logs').insert([{
    user_id: userId || null,
    action: 'RESUME_INTELLIGENCE_SYNC',
    target: `Upload #${uploadId || 'manual'} synced (${syncResults.experienceAdded + syncResults.skillsAdded + syncResults.projectsAdded} entities)`,
    timestamp: new Date().toISOString()
  }]);

  return syncResults;
}
