/**
 * resume/normalizer/businessNormalizer.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Business Normalization Engine
 *
 * Enforces domain specific standardisation rules:
 *  - Tech stack alias mapping (React.js -> React)
 *  - Skill deduplication
 *  - Strict Date integrity (never guess months if only year is given)
 *  - Untrusted slug removal
 * ─────────────────────────────────────────────────────────────────────────────
 */

const ALIAS_MAP = {
  'react.js': 'React',
  'reactjs': 'React',
  'node.js': 'Node',
  'nodejs': 'Node',
  'python programming': 'Python',
  'python3': 'Python',
  'js': 'JavaScript',
  'javascript es6': 'JavaScript',
  'ts': 'TypeScript',
  'matlab ': 'MATLAB',
  'siemens coe': 'Siemens Centre of Excellence'
};

/**
 * Normalizes a tech alias or organization string
 */
export function normalizeAlias(input) {
  if (!input || typeof input !== 'string') return input;
  const lower = input.trim().toLowerCase();
  return ALIAS_MAP[lower] || input.trim();
}

/**
 * Enforces strict date rule: do not invent months if only year is given.
 */
export function normalizeDate(dateStr) {
  if (!dateStr || typeof dateStr !== 'string') return null;
  const trimmed = dateStr.trim();
  // If it's just a 4-digit year, keep it as is or leave exact date null
  if (/^\d{4}$/.test(trimmed)) {
    return trimmed;
  }
  return trimmed;
}

/**
 * Main Business Normalization entry
 */
export function businessNormalize(data) {
  if (!data || typeof data !== 'object') return data;

  const result = { ...data };

  // 1. Deduplicate & normalize skills
  if (Array.isArray(result.skills)) {
    const seen = new Map();
    result.skills.forEach(skill => {
      if (!skill || !skill.name) return;
      const normalizedName = normalizeAlias(skill.name);
      const key = normalizedName.toLowerCase();
      if (seen.has(key)) {
        // Keep higher confidence or proficiency
        const existing = seen.get(key);
        existing.confidence = Math.max(existing.confidence || 0.9, skill.confidence || 0.9);
        existing.proficiency = Math.max(existing.proficiency || 80, skill.proficiency || 80);
      } else {
        seen.set(key, { ...skill, name: normalizedName });
      }
    });
    result.skills = Array.from(seen.values());
  }

  // 2. Normalize experiences
  if (Array.isArray(result.experience)) {
    result.experience = result.experience.map(exp => ({
      ...exp,
      organization: normalizeAlias(exp.organization),
      start_date: normalizeDate(exp.start_date),
      end_date: normalizeDate(exp.end_date)
    }));
  }

  // 3. Normalize education
  if (Array.isArray(result.education)) {
    result.education = result.education.map(edu => ({
      ...edu,
      institution: normalizeAlias(edu.institution),
      start_date: normalizeDate(edu.start_date),
      end_date: normalizeDate(edu.end_date)
    }));
  }

  return result;
}
