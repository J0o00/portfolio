import { describe, it, expect } from 'vitest';

function checkPermission(role, action) {
  const permissions = {
    Owner: ['create', 'edit', 'delete', 'publish', 'invite_users', 'manage_rbac'],
    Admin: ['create', 'edit', 'delete', 'publish', 'invite_users'],
    Editor: ['create', 'edit'],
    Viewer: []
  };
  return (permissions[role] || []).includes(action);
}

describe('RBAC Role Permission Verification', () => {
  it('allows Owner and Admin to publish and delete', () => {
    expect(checkPermission('Owner', 'publish')).toBe(true);
    expect(checkPermission('Admin', 'delete')).toBe(true);
    expect(checkPermission('Owner', 'manage_rbac')).toBe(true);
  });

  it('forbids Editor from publishing or deleting records', () => {
    expect(checkPermission('Editor', 'publish')).toBe(false);
    expect(checkPermission('Editor', 'delete')).toBe(false);
    expect(checkPermission('Editor', 'edit')).toBe(true);
  });

  it('forbids Viewer from all CRUD operations', () => {
    expect(checkPermission('Viewer', 'create')).toBe(false);
    expect(checkPermission('Viewer', 'edit')).toBe(false);
  });
});
