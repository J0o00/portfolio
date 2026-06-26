/**
 * resume/config/resumeMatchingConfig.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Configurable Matching Sensitivity Thresholds
 * ─────────────────────────────────────────────────────────────────────────────
 */

export const MATCHING_CONFIG = {
  skills: { similarityThreshold: 0.95 },
  education: { similarityThreshold: 0.90 },
  experience: { similarityThreshold: 0.85 },
  projects: { similarityThreshold: 0.85 },
  research: { similarityThreshold: 0.90 }
};
