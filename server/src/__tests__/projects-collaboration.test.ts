import { describe, it, expect, beforeEach } from 'vitest';
import { ProjectController } from '../controllers/project.controller';
import { InvitationController } from '../controllers/invitation.controller';
import { EmailService } from '../services/email.service';
import { DataStore } from '../db/mongo';

function createMockReqRes(options: {
  body?: any;
  headers?: Record<string, string>;
  params?: Record<string, string>;
  query?: Record<string, string>;
  user?: any;
}) {
  const req: any = {
    body: options.body || {},
    headers: options.headers || {},
    params: options.params || {},
    query: options.query || {},
    user: options.user,
    ip: '127.0.0.1',
    socket: { remoteAddress: '127.0.0.1' },
  };

  let statusCode = 200;
  let responseData: any = null;

  const res: any = {
    status(code: number) {
      statusCode = code;
      return res;
    },
    json(data: any) {
      responseData = data;
      return res;
    },
  };

  return {
    req,
    res,
    getStatus: () => statusCode,
    getBody: () => responseData,
  };
}

describe('Public Projects, Cloning & Team Collaboration', () => {
  beforeEach(() => {
    EmailService.clearDispatches();
  });

  const ownerId = `user_owner_${Date.now()}`;
  const editorId = `user_editor_${Date.now()}`;
  const viewerId = `user_viewer_${Date.now()}`;
  const strangerId = `user_stranger_${Date.now()}`;

  const ownerUser = { id: ownerId, email: 'owner@example.com', name: 'Lead Architect' };
  const editorUser = { id: editorId, email: 'editor@example.com', name: 'Backend Engineer' };
  const viewerUser = { id: viewerId, email: 'viewer@example.com', name: 'Product Analyst' };
  const strangerUser = { id: strangerId, email: 'stranger@example.com', name: 'External Dev' };

  let projectId = '';

  it('creates project with private visibility by default', async () => {
    const { req, res, getStatus, getBody } = createMockReqRes({
      user: ownerUser,
      body: {
        name: 'Enterprise Supply Chain',
        description: 'Global warehouse and freight logistics schema',
        targetDialect: 'postgresql',
      },
    });

    await ProjectController.createProject(req, res);
    expect(getStatus()).toBe(201);
    const data = getBody().data;
    expect(data.id).toBeDefined();
    expect(data.visibility).toBe('private');
    expect(data.cloneCount).toBe(0);
    expect(data.version).toBe(1);

    projectId = data.id;
  });

  it('does not display private projects in public discovery listing', async () => {
    const { req, res, getStatus, getBody } = createMockReqRes({
      query: { search: 'Supply Chain' },
    });

    await ProjectController.listPublicProjects(req, res);
    expect(getStatus()).toBe(200);
    const items = getBody().data.items;
    const found = items.find((p: any) => p.id === projectId);
    expect(found).toBeUndefined();
  });

  it('rejects visibility change from unauthorized user (HTTP 403)', async () => {
    const { req, res, getStatus, getBody } = createMockReqRes({
      user: strangerUser,
      params: { id: projectId },
      body: { visibility: 'public' },
    });

    await ProjectController.updateVisibility(req, res);
    expect(getStatus()).toBe(403);
    expect(getBody().error.code).toBe('FORBIDDEN');
  });

  it('allows owner to publish project and makes it discoverable publicly', async () => {
    // 1. Owner updates visibility to public
    const updateMock = createMockReqRes({
      user: ownerUser,
      params: { id: projectId },
      body: { visibility: 'public' },
    });
    await ProjectController.updateVisibility(updateMock.req, updateMock.res);
    expect(updateMock.getStatus()).toBe(200);
    expect(updateMock.getBody().data.visibility).toBe('public');

    // 2. Project appears in public discovery
    const publicListMock = createMockReqRes({
      query: { search: 'Enterprise Supply Chain' },
    });
    await ProjectController.listPublicProjects(publicListMock.req, publicListMock.res);
    expect(publicListMock.getStatus()).toBe(200);
    const items = publicListMock.getBody().data.items;
    const found = items.find((p: any) => p.id === projectId);
    expect(found).toBeDefined();
    expect(found.name).toBe('Enterprise Supply Chain');

    // 3. Anonymous visitor can fetch public project details
    const publicGetMock = createMockReqRes({
      params: { id: projectId },
    });
    await ProjectController.getPublicProject(publicGetMock.req, publicGetMock.res);
    expect(publicGetMock.getStatus()).toBe(200);
    expect(publicGetMock.getBody().data.schema).toBeDefined();
  });

  it('allows authenticated user to clone public project with decoupled IDs and attribution', async () => {
    const cloneMock = createMockReqRes({
      user: strangerUser,
      params: { id: projectId },
    });

    await ProjectController.cloneProject(cloneMock.req, cloneMock.res);
    expect(cloneMock.getStatus()).toBe(201);
    const clonedData = cloneMock.getBody().data;
    expect(clonedData.id).toBeDefined();
    expect(clonedData.name).toBe('Enterprise Supply Chain (Clone)');
    expect(clonedData.clonedFrom.sourceProjectId).toBe(projectId);

    // Verify source project's clone count was atomically incremented
    const sourceProject = await DataStore.findOne('projects', { _id: projectId });
    expect(sourceProject.cloneCount).toBe(1);

    // Verify cloned project is owned by strangerUser and is private
    const clonedProject = await DataStore.findOne('projects', { _id: clonedData.id });
    expect(clonedProject.userId).toBe(strangerId);
    expect(clonedProject.visibility).toBe('private');

    // Verify deep clone decoupled entity IDs: cloned entity IDs must not equal source entity IDs
    const sourceEntityIds = sourceProject.currentSchema.entities.map((e: any) => e.id);
    const clonedEntityIds = clonedProject.currentSchema.entities.map((e: any) => e.id);
    expect(sourceEntityIds[0]).not.toBe(clonedEntityIds[0]);

    // Verify relationships in clone point to the new cloned entity IDs
    const firstRel = clonedProject.currentSchema.relationships[0];
    if (firstRel) {
      expect(clonedEntityIds).toContain(firstRel.sourceEntityId);
      expect(clonedEntityIds).toContain(firstRel.targetEntityId);
    }
  });

  it('unpublishing project immediately denies public access', async () => {
    // Owner sets visibility back to private
    const unpublishMock = createMockReqRes({
      user: ownerUser,
      params: { id: projectId },
      body: { visibility: 'private' },
    });
    await ProjectController.updateVisibility(unpublishMock.req, unpublishMock.res);
    expect(unpublishMock.getStatus()).toBe(200);

    // Anonymous public get must now be 404
    const publicGetMock = createMockReqRes({
      params: { id: projectId },
    });
    await ProjectController.getPublicProject(publicGetMock.req, publicGetMock.res);
    expect(publicGetMock.getStatus()).toBe(404);
  });

  it('manages collaborator invitation lifecycle and prevents wrong email acceptance', async () => {
    // 1. Owner invites editor
    const inviteMock = createMockReqRes({
      user: ownerUser,
      params: { id: projectId },
      body: { email: editorUser.email, role: 'editor' },
    });
    await ProjectController.inviteCollaborator(inviteMock.req, inviteMock.res);
    expect(inviteMock.getStatus()).toBe(201);

    const token = EmailService.getLatestTokenFor(editorUser.email, 'collaboration_invitation');
    expect(token).toBeDefined();

    // 2. Stranger tries to accept editor's invitation -> MUST BE 403 EMAIL MISMATCH
    const mismatchAcceptMock = createMockReqRes({
      user: strangerUser,
      params: { token: token! },
    });
    await InvitationController.acceptInvitation(mismatchAcceptMock.req, mismatchAcceptMock.res);
    expect(mismatchAcceptMock.getStatus()).toBe(403);
    expect(mismatchAcceptMock.getBody().error.code).toBe('FORBIDDEN_EMAIL_MISMATCH');

    // 3. Intended editor accepts invitation
    const correctAcceptMock = createMockReqRes({
      user: editorUser,
      params: { token: token! },
    });
    await InvitationController.acceptInvitation(correctAcceptMock.req, correctAcceptMock.res);
    expect(correctAcceptMock.getStatus()).toBe(200);

    // Verify editor is now in project members
    const updatedProject = await DataStore.findOne('projects', { _id: projectId });
    const member = updatedProject.members.find((m: any) => m.userId === editorId);
    expect(member).toBeDefined();
    expect(member.role).toBe('editor');
  });

  it('enforces role permissions: Editor can save, Viewer cannot, and Concurrency detects conflicts', async () => {
    // 1. Add viewer directly to project
    await DataStore.updateOne('projects', { _id: projectId }, {
      $push: {
        members: {
          userId: viewerId,
          email: viewerUser.email,
          name: viewerUser.name,
          role: 'viewer',
          addedAt: new Date().toISOString(),
        }
      }
    });

    const projectBefore = await DataStore.findOne('projects', { _id: projectId });
    const currentVersion = projectBefore.version || 1;

    // 2. Viewer attempts to save schema -> MUST BE 403 FORBIDDEN
    const viewerSaveMock = createMockReqRes({
      user: viewerUser,
      params: { id: projectId },
      body: {
        schema: projectBefore.currentSchema,
        expectedVersion: currentVersion,
      },
    });
    await ProjectController.saveSchema(viewerSaveMock.req, viewerSaveMock.res);
    expect(viewerSaveMock.getStatus()).toBe(403);
    expect(viewerSaveMock.getBody().error.code).toBe('FORBIDDEN');

    // 3. Editor saves schema successfully -> increments version
    const editorSaveMock = createMockReqRes({
      user: editorUser,
      params: { id: projectId },
      body: {
        schema: projectBefore.currentSchema,
        expectedVersion: currentVersion,
      },
    });
    await ProjectController.saveSchema(editorSaveMock.req, editorSaveMock.res);
    expect(editorSaveMock.getStatus()).toBe(200);
    expect(editorSaveMock.getBody().data.version).toBe(currentVersion + 1);

    // 4. Stale save with old version -> MUST BE 409 CONFLICT
    const staleSaveMock = createMockReqRes({
      user: editorUser,
      params: { id: projectId },
      body: {
        schema: projectBefore.currentSchema,
        expectedVersion: currentVersion, // Stale! Current is now currentVersion + 1
      },
    });
    await ProjectController.saveSchema(staleSaveMock.req, staleSaveMock.res);
    expect(staleSaveMock.getStatus()).toBe(409);
    expect(staleSaveMock.getBody().error.code).toBe('SCHEMA_CONFLICT');
  });

  it('revoking member immediately removes access', async () => {
    // Owner removes editor
    const removeMock = createMockReqRes({
      user: ownerUser,
      params: { id: projectId, memberUserId: editorId },
    });
    await ProjectController.removeMember(removeMock.req, removeMock.res);
    expect(removeMock.getStatus()).toBe(200);

    // Former editor attempts to access project -> MUST BE 403 FORBIDDEN
    const accessMock = createMockReqRes({
      user: editorUser,
      params: { id: projectId },
    });
    await ProjectController.getProject(accessMock.req, accessMock.res);
    expect(accessMock.getStatus()).toBe(403);
  });

  it('seamlessly auto-provisions unpersisted client proj_ IDs when changing visibility to public', async () => {
    const clientGeneratedId = `proj_${Date.now()}`;
    const visMock = createMockReqRes({
      user: ownerUser,
      params: { id: clientGeneratedId },
      body: { visibility: 'public', projectName: 'AI Architecture Alpha' },
    });

    await ProjectController.updateVisibility(visMock.req, visMock.res);
    expect(visMock.getStatus()).toBe(200);
    expect(visMock.getBody().data.visibility).toBe('public');

    // Confirm it exists in DataStore with owner and public visibility
    const stored = await DataStore.findOne('projects', { _id: clientGeneratedId });
    expect(stored).toBeDefined();
    expect(stored.userId).toBe(ownerId);
    expect(stored.visibility).toBe('public');
  });

  it('seamlessly auto-provisions unpersisted client proj_ IDs when opening team members and inviting', async () => {
    const clientGeneratedId = `proj_${Date.now() + 10}`;
    const membersMock = createMockReqRes({
      user: ownerUser,
      params: { id: clientGeneratedId },
    });

    await ProjectController.listMembers(membersMock.req, membersMock.res);
    expect(membersMock.getStatus()).toBe(200);
    expect(membersMock.getBody().data.owner.id).toBe(ownerId);
    expect(membersMock.getBody().data.myRole).toBe('owner');

    // Inviting a collaborator should also work seamlessly
    const inviteMock = createMockReqRes({
      user: ownerUser,
      params: { id: clientGeneratedId },
      body: { email: 'teammate@example.com', role: 'editor' },
    });

    await ProjectController.inviteCollaborator(inviteMock.req, inviteMock.res);
    expect(inviteMock.getStatus()).toBe(201);
    expect(inviteMock.getBody().data.invitedEmail).toBe('teammate@example.com');
  });

  it('allows teammate to view pending invitations and accept with token in request body', async () => {
    const inviteeEmail = 'teammate_body@example.com';
    const inviteeUser = { id: `user_teammate_${Date.now()}`, email: inviteeEmail, name: 'Frontend Engineer' };

    // 1. Owner invites teammate
    const inviteMock = createMockReqRes({
      user: ownerUser,
      params: { id: projectId },
      body: { email: inviteeEmail, role: 'editor' },
    });
    await ProjectController.inviteCollaborator(inviteMock.req, inviteMock.res);
    expect(inviteMock.getStatus()).toBe(201);
    const rawToken = inviteMock.getBody().data.rawToken;
    expect(rawToken).toBeDefined();

    // 2. Teammate checks my-invitations
    const listMock = createMockReqRes({
      user: inviteeUser,
    });
    await InvitationController.listMyInvitations(listMock.req, listMock.res);
    expect(listMock.getStatus()).toBe(200);
    const invites = listMock.getBody().data;
    const myInvite = invites.find((inv: any) => inv.projectId === projectId);
    expect(myInvite).toBeDefined();
    expect(myInvite.role).toBe('editor');

    // 3. Teammate accepts invitation with token in body (as sent from CollaborationPage)
    const acceptMock = createMockReqRes({
      user: inviteeUser,
      body: { token: rawToken },
    });
    await InvitationController.acceptInvitation(acceptMock.req, acceptMock.res);
    expect(acceptMock.getStatus()).toBe(200);
    expect(acceptMock.getBody().data.role).toBe('editor');
  });

  it('updates schema via iterateSchema natural language instructions', async () => {
    const sampleSchema = {
      version: '1.0.0',
      projectName: 'Marketplace Core',
      targetDialect: 'postgresql' as const,
      assumptions: [],
      unresolvedQuestions: [],
      entities: [
        {
          id: 'e_users',
          name: 'users',
          fields: [
            { id: 'f_id', name: 'id', dataType: 'uuid', isPrimaryKey: true, isForeignKey: false, isNullable: false, isUnique: true }
          ]
        }
      ],
      relationships: [],
    };

    const iterateMock = createMockReqRes({
      user: ownerUser,
      body: {
        schema: sampleSchema,
        instruction: 'Add payments table with transaction records',
      },
    });

    await ProjectController.iterateSchema(iterateMock.req, iterateMock.res);
    expect(iterateMock.getStatus()).toBe(200);
    const updated = iterateMock.getBody().data.schema;
    expect(updated).toBeDefined();
    expect(updated.entities.some((e: any) => e.name === 'payments')).toBe(true);
    expect(iterateMock.getBody().data.summary).toBeDefined();
  });

  it('batch resolves all unresolved questions together in one go', async () => {
    const sampleSchema = {
      version: '1.0.0',
      projectName: 'Fintech Hub',
      targetDialect: 'postgresql' as const,
      assumptions: ['Normalized to 3NF'],
      unresolvedQuestions: [
        'Should audit events be tracked in an immutable ledger?',
        'Should soft deletes be enabled across all operational tables?'
      ],
      entities: [
        {
          id: 'e_accounts',
          name: 'accounts',
          fields: [
            { id: 'f_id', name: 'id', dataType: 'uuid', isPrimaryKey: true, isForeignKey: false, isNullable: false, isUnique: true }
          ]
        }
      ],
      relationships: [],
    };

    const resolveMock = createMockReqRes({
      user: ownerUser,
      body: {
        schema: sampleSchema,
        batchAnswers: '1. Yes, store audit events in an immutable audit ledger.\n2. Enable soft deletes with deleted_at timestamptz.',
      },
    });

    await ProjectController.resolveQuestions(resolveMock.req, resolveMock.res);
    expect(resolveMock.getStatus()).toBe(200);
    const updated = resolveMock.getBody().data.schema;
    expect(updated.unresolvedQuestions.length).toBe(0);
    expect(resolveMock.getBody().data.summary).toContain('Resolved');
  });
});
