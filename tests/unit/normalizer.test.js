import { describe, it, expect } from 'vitest';
import { technicalNormalize } from '../../quantum-control/src/resume/normalizer/technicalNormalizer';
import { businessNormalize, normalizeAlias, normalizeDate } from '../../quantum-control/src/resume/normalizer/businessNormalizer';

describe('Resume Normalization Layer', () => {
  describe('technicalNormalize', () => {
    it('cleans whitespace and unicode non-breaking spaces in strings', () => {
      const raw = 'Jovial \u00A0 Joyson   ';
      expect(technicalNormalize(raw)).toBe('Jovial Joyson');
    });

    it('lowercases emails inside object structures correctly', () => {
      const input = { name: 'Jovial', email: 'JOVIALJOYSON@GMAIL.COM ' };
      expect(technicalNormalize(input).email).toBe('jovialjoyson@gmail.com');
    });
  });

  describe('businessNormalize', () => {
    it('normalizes tech stack aliases (e.g. react.js -> React)', () => {
      expect(normalizeAlias('react.js')).toBe('React');
      expect(normalizeAlias('node.js')).toBe('Node');
      expect(normalizeAlias('python3')).toBe('Python');
    });

    it('enforces strict date integrity without guessing exact months', () => {
      const parsed = normalizeDate('2025');
      expect(parsed).toBe('2025');
    });

    it('deduplicates skills case-insensitively keeping max proficiency', () => {
      const raw = {
        skills: [
          { name: 'react.js', proficiency: 80 },
          { name: 'React', proficiency: 95 }
        ]
      };
      const normalized = businessNormalize(raw);
      expect(normalized.skills).toHaveLength(1);
      expect(normalized.skills[0].proficiency).toBe(95);
      expect(normalized.skills[0].name).toBe('React');
    });
  });
});
