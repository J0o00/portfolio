import { describe, it, expect } from 'vitest';
import { buildEntityDiffs } from '../../quantum-control/src/resume/matching/resumeDiffBuilder';

describe('buildEntityDiffs multi-signal deterministic matching', () => {
  const existingCmsData = {
    skills: [
      { id: '101', name: 'React', category: 'Frontend', proficiency: 85 }
    ],
    experience: [
      { id: '201', organization: 'Siemens CoE', role_title: 'Automation Intern', start_date: '2025-06-01' }
    ],
    projects: [
      { id: '301', title: 'Digital Twin Motor' }
    ],
    research: []
  };

  it('correctly categorizes existing skills as MATCHED or MODIFIED', () => {
    const normalizedData = {
      skills: [
        { name: 'React', proficiency: 95 }, // Modified proficiency
        { name: 'MATLAB', proficiency: 80 } // Brand new
      ]
    };

    const diff = buildEntityDiffs(normalizedData, existingCmsData);
    expect(diff.skills).toHaveLength(2);
    
    const reactDiff = diff.skills.find(s => s.entity.name === 'React');
    expect(reactDiff.status).toBe('MODIFIED');

    const matlabDiff = diff.skills.find(s => s.entity.name === 'MATLAB');
    expect(matlabDiff.status).toBe('NEW');
  });

  it('detects possible duplicates for experience based on organization', () => {
    const normalizedData = {
      experience: [
        { organization: 'Siemens CoE', role_title: 'SCADA Engineer', start_date: '2026-01-01' }
      ]
    };

    const diff = buildEntityDiffs(normalizedData, existingCmsData);
    const expDiff = diff.experience[0];
    expect(expDiff.status).toBe('POSSIBLE DUPLICATE');
    expect(expDiff.existingId).toBe('201');
  });
});
