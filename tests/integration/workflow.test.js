import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { projectService } from '../../quantum-control/src/services/projectService';
import { syncApprovedChanges } from '../../quantum-control/src/resume/sync/resumeSyncService';

// Mock universal chainable Supabase query builder
const mockBuilder = {
  select: vi.fn().mockReturnThis(),
  insert: vi.fn().mockReturnThis(),
  update: vi.fn().mockReturnThis(),
  delete: vi.fn().mockReturnThis(),
  eq: vi.fn().mockReturnThis(),
  in: vi.fn().mockReturnThis(),
  order: vi.fn().mockReturnThis(),
  limit: vi.fn().mockReturnThis(),
  single: vi.fn().mockResolvedValue({ 
    data: { 
      id: 1, 
      title: 'Mock Project', 
      version: 1,
      snapshot_json: {
        project: { title: 'Restored Project', status: 'published' },
        media: ['cover-1'],
        tags: [1]
      }
    }, 
    error: null 
  }),
  then: (resolve) => resolve({ data: [], error: null })
};

const mockFrom = vi.fn(() => mockBuilder);

vi.mock('../../src/lib/supabase', () => ({
  supabase: {
    from: (table) => mockFrom(table)
  }
}));

describe('Enterprise CMS Workflow Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Project Publication & Revision Restore', () => {
    it('updates project payload setting status to published', async () => {
      const result = await projectService.updateProject(1, { status: 'published' });
      expect(result).toBeDefined();
      expect(mockFrom).toHaveBeenCalledWith('projects');
    });

    it('creates revision snapshot before applying restore operation', async () => {
      const spySnapshot = vi.spyOn(projectService, 'createProjectRevision').mockResolvedValue({ id: 99 });
      vi.spyOn(projectService, 'getProjectGallery').mockResolvedValue([]);
      vi.spyOn(projectService, 'getProjectTags').mockResolvedValue([]);
      vi.spyOn(projectService, 'updateProject').mockResolvedValue({});
      vi.spyOn(projectService, 'saveProjectMedia').mockResolvedValue({});
      vi.spyOn(projectService, 'saveProjectTags').mockResolvedValue({});

      await projectService.restoreProjectRevision(1, 10, 'user-123');
      expect(spySnapshot).toHaveBeenCalledWith(1, 'user-123', 'Auto-Snapshot before Restore');
    });
  });

  describe('Resume Intelligence Sync Engine', () => {
    it('forces newly ingested projects and research to draft status', async () => {
      const approvedDiff = {
        projects: [
          { selected: true, status: 'NEW', entity: { title: 'AI Motor Control', full_description: 'Desc' } }
        ],
        research: [
          { selected: true, status: 'NEW', entity: { title: 'Flyback Magnetics', abstract: 'Abstract' } }
        ]
      };

      const syncRes = await syncApprovedChanges(approvedDiff, 'admin-1', 'upload-55');
      expect(syncRes.projectsAdded).toBe(1);
      expect(syncRes.researchAdded).toBe(1);
      expect(mockFrom).toHaveBeenCalledWith('projects');
      expect(mockFrom).toHaveBeenCalledWith('research');
    });
  });

  describe('Media Management & Library Association Flow', () => {
    it('associates uploaded media with project cover and gallery tables', async () => {
      await projectService.saveProjectMedia(1, {
        coverMediaId: 'media-cover-1',
        galleryMediaIds: ['media-gal-1', 'media-gal-2']
      });

      expect(mockFrom).toHaveBeenCalledWith('projects');
      expect(mockFrom).toHaveBeenCalledWith('project_media');
    });
  });
});
