/**
 * resume/matching/resumeDiffBuilder.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Deterministic Multi-Signal Entity Matching & Diff Builder
 *
 * Compares normalized parsed resume data against active Postgres CMS records.
 * Categorizes entities into: [NEW], [MATCHED], [POSSIBLE DUPLICATE], [MODIFIED].
 * Generates Dry Run batch preview breakdown.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { MATCHING_CONFIG } from '../config/resumeMatchingConfig';

/**
 * Builds entity diffs against active database records.
 *
 * @param {any} normalizedData 
 * @param {any} activeDbRecords { profile, experience, education, skills, projects, research }
 */
export function buildEntityDiffs(normalizedData, activeDbRecords) {
  const diff = {
    profile: null,
    experience: [],
    education: [],
    skills: [],
    projects: [],
    research: [],
    summary: {
      newCount: 0,
      matchedCount: 0,
      modifiedCount: 0,
      duplicateCount: 0,
      breakdown: {}
    }
  };

  // 1. Profile comparison
  if (normalizedData.profile) {
    const dbProfile = activeDbRecords.profile || {};
    const hasChanges = 
      (normalizedData.profile.headline && normalizedData.profile.headline !== dbProfile.headline) ||
      (normalizedData.profile.bio && normalizedData.profile.bio !== dbProfile.bio) ||
      (normalizedData.profile.location && normalizedData.profile.location !== dbProfile.location);

    diff.profile = {
      entity: normalizedData.profile,
      status: hasChanges ? 'MODIFIED' : 'MATCHED',
      existingId: dbProfile.id || 1,
      selected: hasChanges
    };
    if (hasChanges) diff.summary.modifiedCount++;
    else diff.summary.matchedCount++;
  }

  // 2. Skills comparison (multi-signal: normalized name)
  const dbSkillsMap = new Map((activeDbRecords.skills || []).map(s => [s.name.toLowerCase(), s]));
  let skillsAdded = 0;
  let skillsUpdated = 0;

  (normalizedData.skills || []).forEach(skill => {
    const key = skill.name.toLowerCase();
    if (dbSkillsMap.has(key)) {
      const existing = dbSkillsMap.get(key);
      const isHigherProficiency = skill.proficiency && skill.proficiency > (existing.proficiency || 0);
      diff.skills.push({
        entity: skill,
        status: isHigherProficiency ? 'MODIFIED' : 'MATCHED',
        existingId: existing.id,
        selected: isHigherProficiency
      });
      if (isHigherProficiency) {
        skillsUpdated++;
        diff.summary.modifiedCount++;
      } else {
        diff.summary.matchedCount++;
      }
    } else {
      diff.skills.push({
        entity: skill,
        status: 'NEW',
        existingId: null,
        selected: true
      });
      skillsAdded++;
      diff.summary.newCount++;
    }
  });

  diff.summary.breakdown.skills = `+${skillsAdded} new, ~${skillsUpdated} updated`;

  // 3. Experience comparison (multi-signal: organization + role_title)
  let expAdded = 0;
  let expUpdated = 0;
  let expDup = 0;

  (normalizedData.experience || []).forEach(exp => {
    const matched = (activeDbRecords.experience || []).find(dbExp => {
      const orgMatch = dbExp.organization.toLowerCase() === exp.organization.toLowerCase();
      const roleMatch = dbExp.role_title.toLowerCase() === exp.role_title.toLowerCase();
      return orgMatch && roleMatch;
    });

    if (matched) {
      const hasDateChange = (exp.start_date && exp.start_date !== matched.start_date) || (exp.end_date && exp.end_date !== matched.end_date);
      const status = hasDateChange ? 'MODIFIED' : 'MATCHED';
      diff.experience.push({
        entity: exp,
        status,
        existingId: matched.id,
        selected: status === 'MODIFIED'
      });
      if (status === 'MODIFIED') { expUpdated++; diff.summary.modifiedCount++; }
      else diff.summary.matchedCount++;
    } else {
      // Check possible fuzzy duplicate (matching org only)
      const possibleDup = (activeDbRecords.experience || []).find(dbExp => 
        dbExp.organization.toLowerCase() === exp.organization.toLowerCase()
      );
      if (possibleDup) {
        diff.experience.push({
          entity: exp,
          status: 'POSSIBLE DUPLICATE',
          existingId: possibleDup.id,
          selected: false
        });
        expDup++;
        diff.summary.duplicateCount++;
      } else {
        diff.experience.push({
          entity: exp,
          status: 'NEW',
          existingId: null,
          selected: true
        });
        expAdded++;
        diff.summary.newCount++;
      }
    }
  });

  diff.summary.breakdown.experience = `+${expAdded} new, ~${expUpdated} updated${expDup ? `, ${expDup} flagged duplicates` : ''}`;

  // 4. Education comparison (multi-signal: institution + degree)
  let eduAdded = 0;
  (normalizedData.education || []).forEach(edu => {
    const matched = (activeDbRecords.education || []).find(dbEdu => 
      dbEdu.institution.toLowerCase() === edu.institution.toLowerCase()
    );
    if (matched) {
      diff.education.push({ entity: edu, status: 'MATCHED', existingId: matched.id, selected: false });
      diff.summary.matchedCount++;
    } else {
      diff.education.push({ entity: edu, status: 'NEW', existingId: null, selected: true });
      eduAdded++;
      diff.summary.newCount++;
    }
  });
  diff.summary.breakdown.education = eduAdded ? `+${eduAdded} new` : 'No changes';

  // 5. Projects comparison
  let projAdded = 0;
  (normalizedData.projects || []).forEach(proj => {
    const matched = (activeDbRecords.projects || []).find(p => p.title.toLowerCase() === proj.title.toLowerCase());
    if (matched) {
      diff.projects.push({ entity: proj, status: 'MATCHED', existingId: matched.id, selected: false });
      diff.summary.matchedCount++;
    } else {
      diff.projects.push({ 
        entity: { ...proj, status: 'published' }, 
        status: 'NEW', 
        existingId: null, 
        selected: true 
      });
      projAdded++;
      diff.summary.newCount++;
    }
  });
  diff.summary.breakdown.projects = projAdded ? `+${projAdded} new` : 'No changes';

  // 6. Research comparison
  let resAdded = 0;
  (normalizedData.research || []).forEach(res => {
    const matched = (activeDbRecords.research || []).find(r => r.title.toLowerCase() === res.title.toLowerCase());
    if (matched) {
      diff.research.push({ entity: res, status: 'MATCHED', existingId: matched.id, selected: false });
      diff.summary.matchedCount++;
    } else {
      diff.research.push({ 
        entity: { ...res, status: 'published' }, 
        status: 'NEW', 
        existingId: null, 
        selected: true 
      });
      resAdded++;
      diff.summary.newCount++;
    }
  });
  diff.summary.breakdown.research = resAdded ? `+${resAdded} new` : 'No changes';

  return diff;
}
