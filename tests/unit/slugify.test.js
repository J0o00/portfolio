import { describe, it, expect } from 'vitest';
import { slugify } from '../../quantum-control/src/resume/sync/resumeSyncService';

describe('slugify() deterministic utility', () => {
  it('converts basic text to lowercase hyphenated slug', () => {
    expect(slugify('Digital Twin of Induction Motor')).toBe('digital-twin-of-induction-motor');
  });

  it('strips special characters and punctuation', () => {
    expect(slugify('AI-Assisted Motor Fault Detection (v2.0)!')).toBe('ai-assisted-motor-fault-detection-v20');
  });

  it('handles multiple consecutive spaces', () => {
    expect(slugify('Smart   Predictive   Maintenance')).toBe('smart-predictive-maintenance');
  });

  it('returns empty string for null or undefined input', () => {
    expect(slugify(null)).toBe('');
    expect(slugify(undefined)).toBe('');
  });
});
