import { Request, Response } from 'express';
import crypto from 'crypto';
import { z } from 'zod';
import { 
  SAMPLE_ECOMMERCE_SCHEMA, 
  generatePostgresDDL,
  canonicalSchemaZodSchema,
  generateRequirementInputSchema,
  updateVisibilitySchema,
  inviteCollaboratorSchema,
  updateMemberRoleSchema,
  CanonicalSchema,
  Entity,
  Relationship
} from '@schema-studio/shared';
import { DataStore } from '../db/mongo';
import { AuthRequest } from '../middleware/auth';
import { AIService } from '../services/ai.service';
import { SchemaValidatorService } from '../services/schema-validator.service';
import { EmailService } from '../services/email.service';
import { ENV } from '../config/env';

const createProjectSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, 'Project name is required.').max(100),
  description: z.string().max(1000).optional().default(''),
  targetDialect: z.enum(['postgresql', 'mysql', 'sqlite']).default('postgresql'),
  requirementsPrompt: z.string().optional(),
  currentSchema: z.any().optional(),
  schema: z.any().optional(),
  visibility: z.enum(['private', 'public', 'unlisted']).optional(),
});

export type EffectiveRole = 'owner' | 'editor' | 'viewer' | 'public_viewer' | 'none';

export function getProjectRole(project: any, userId?: string): EffectiveRole {
  if (userId) {
    if (project.userId === userId) return 'owner';
    const member = Array.isArray(project.members)
      ? project.members.find((m: any) => m.userId === userId)
      : null;
    if (member) return member.role;
  }
  if (project.visibility === 'public') return 'public_viewer';
  return 'none';
}

/**
 * Finds project safely by _id or id, auto-provisioning for authenticated users if not yet created in the DB
 */
export async function findOrProvisionProject(
  id: string,
  userId?: string,
  fallbackMeta?: { name?: string; targetDialect?: any; currentSchema?: any }
): Promise<any> {
  let project = await DataStore.findOne('projects', { _id: id });
  if (!project && id) {
    project = await DataStore.findOne('projects', { id });
  }

  // If not found and user is authenticated, auto-provision this project
  if (!project && userId && id) {
    const projectName = fallbackMeta?.name || 'My Schema Project';
    const targetDialect = fallbackMeta?.targetDialect || 'postgresql';
    const currentSchema = fallbackMeta?.currentSchema || {
      ...SAMPLE_ECOMMERCE_SCHEMA,
      projectName,
      targetDialect,
    };

    const newDoc = {
      _id: id,
      id,
      userId,
      name: projectName,
      description: '',
      targetDialect,
      requirementsPrompt: '',
      currentSchema,
      visibility: 'private',
      cloneCount: 0,
      members: [],
      version: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await DataStore.insertOne('projects', newDoc);
    project = (await DataStore.findOne('projects', { _id: id })) || newDoc;
  }

  return project;
}

/**
 * Deep clones canonical schema with freshly decoupled identifiers
 */
function deepCloneSchema(sourceSchema: CanonicalSchema, newProjectName: string): CanonicalSchema {
  const entityIdMap = new Map<string, string>();
  const fieldIdMap = new Map<string, string>();

  // Pre-generate unique IDs for all entities and fields
  sourceSchema.entities.forEach((entity, eIdx) => {
    const newEntityId = `e_${Date.now()}_${eIdx}_${Math.random().toString(36).substring(2, 6)}`;
    entityIdMap.set(entity.id, newEntityId);

    entity.fields.forEach((field, fIdx) => {
      const newFieldId = `f_${Date.now()}_${eIdx}_${fIdx}_${Math.random().toString(36).substring(2, 6)}`;
      fieldIdMap.set(field.id, newFieldId);
    });
  });

  const newEntities: Entity[] = sourceSchema.entities.map((entity) => {
    const newEntityId = entityIdMap.get(entity.id) || entity.id;

    const newFields = entity.fields.map((field) => ({
      ...field,
      id: fieldIdMap.get(field.id) || field.id,
    }));

    const newCompositePK = entity.compositePrimaryKey?.map(
      (oldFieldId) => fieldIdMap.get(oldFieldId) || oldFieldId
    );

    const newIndexes = entity.indexes?.map((idx, iIdx) => ({
      ...idx,
      id: `idx_${Date.now()}_${iIdx}_${Math.random().toString(36).substring(2, 6)}`,
      fields: idx.fields.map((f) => fieldIdMap.get(f) || f),
    }));

    const newChecks = entity.checks?.map((chk, cIdx) => ({
      ...chk,
      id: `chk_${Date.now()}_${cIdx}_${Math.random().toString(36).substring(2, 6)}`,
    }));

    return {
      ...entity,
      id: newEntityId,
      fields: newFields,
      compositePrimaryKey: newCompositePK,
      indexes: newIndexes,
      checks: newChecks,
    };
  });

  const newRelationships: Relationship[] = sourceSchema.relationships.map((rel, rIdx) => ({
    ...rel,
    id: `rel_${Date.now()}_${rIdx}_${Math.random().toString(36).substring(2, 6)}`,
    sourceEntityId: entityIdMap.get(rel.sourceEntityId) || rel.sourceEntityId,
    sourceFieldId: fieldIdMap.get(rel.sourceFieldId) || rel.sourceFieldId,
    targetEntityId: entityIdMap.get(rel.targetEntityId) || rel.targetEntityId,
    targetFieldId: fieldIdMap.get(rel.targetFieldId) || rel.targetFieldId,
  }));

  const newLayout = sourceSchema.layout
    ? {
        ...sourceSchema.layout,
        positions: Object.fromEntries(
          Object.entries(sourceSchema.layout.positions || {}).map(([oldEntityId, pos]) => [
            entityIdMap.get(oldEntityId) || oldEntityId,
            { ...pos },
          ])
        ),
      }
    : undefined;

  return {
    ...sourceSchema,
    projectName: newProjectName,
    entities: newEntities,
    relationships: newRelationships,
    layout: newLayout,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

export class ProjectController {
  /**
   * List projects where user is owner or collaborator
   */
  public static async listProjects(req: AuthRequest, res: Response): Promise<void> {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required.' } });
      return;
    }

    const projects = await DataStore.find('projects', {
      $or: [
        { userId },
        { 'members.userId': userId }
      ]
    });

    res.status(200).json({
      success: true,
      data: projects.map((p) => {
        const isOwner = p.userId === userId;
        const memberInfo = Array.isArray(p.members) ? p.members.find((m: any) => m.userId === userId) : null;
        const myRole = isOwner ? 'owner' : (memberInfo?.role || 'viewer');

        return {
          id: p._id || p.id,
          name: p.name,
          description: p.description,
          targetDialect: p.targetDialect,
          visibility: p.visibility || 'private',
          cloneCount: p.cloneCount || 0,
          myRole,
          isOwner,
          entityCount: p.currentSchema?.entities?.length || 0,
          relationshipCount: p.currentSchema?.relationships?.length || 0,
          clonedFrom: p.clonedFrom,
          updatedAt: p.updatedAt,
        };
      }),
    });
  }

  /**
   * Create a new private project
   */
  public static async createProject(req: AuthRequest, res: Response): Promise<void> {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required.' } });
      return;
    }

    const body = createProjectSchema.parse(req.body);

    const initialSchema = body.currentSchema || body.schema || {
      ...SAMPLE_ECOMMERCE_SCHEMA,
      projectName: body.name,
      targetDialect: body.targetDialect,
    };

    const docToInsert: any = {
      userId,
      name: body.name,
      description: body.description,
      targetDialect: body.targetDialect,
      requirementsPrompt: body.requirementsPrompt || '',
      currentSchema: initialSchema,
      visibility: body.visibility || 'private',
      cloneCount: 0,
      members: [],
      version: 1,
    };
    if (body.id) {
      docToInsert._id = body.id;
      docToInsert.id = body.id;
    }

    const { insertedId } = await DataStore.insertOne('projects', docToInsert);

    res.status(201).json({
      success: true,
      data: {
        id: insertedId,
        name: body.name,
        description: body.description,
        targetDialect: body.targetDialect,
        visibility: body.visibility || 'private',
        cloneCount: 0,
        myRole: 'owner',
        schema: initialSchema,
        version: 1,
      },
    });
  }

  /**
   * Get project with role verification
   */
  public static async getProject(req: AuthRequest, res: Response): Promise<void> {
    const { id } = req.params;
    const project = await findOrProvisionProject(id, req.user?.id);

    if (!project) {
      res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Project not found.' } });
      return;
    }

    const role = getProjectRole(project, req.user?.id);
    if (role === 'none') {
      res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'You do not have access to this project.' } });
      return;
    }

    res.status(200).json({
      success: true,
      data: {
        ...project,
        myRole: role,
        visibility: project.visibility || 'private',
        cloneCount: project.cloneCount || 0,
      },
    });
  }

  /**
   * Update project metadata (Owner or Editor)
   */
  public static async updateProject(req: AuthRequest, res: Response): Promise<void> {
    const { id } = req.params;
    const project = await findOrProvisionProject(id, req.user?.id, { name: req.body?.name, targetDialect: req.body?.targetDialect });

    if (!project) {
      res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Project not found.' } });
      return;
    }

    const role = getProjectRole(project, req.user?.id);
    if (role !== 'owner' && role !== 'editor') {
      res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'Only owners and editors can update project details.' } });
      return;
    }

    const { name, description, targetDialect } = req.body;
    await DataStore.updateOne('projects', { _id: id }, {
      $set: {
        ...(name && { name }),
        ...(description !== undefined && { description }),
        ...(targetDialect && { targetDialect }),
      },
    });

    res.status(200).json({ success: true, message: 'Project updated successfully.' });
  }

  /**
   * Delete project (Owner only)
   */
  public static async deleteProject(req: AuthRequest, res: Response): Promise<void> {
    const { id } = req.params;
    const project = await DataStore.findOne('projects', { _id: id });

    if (!project) {
      res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Project not found.' } });
      return;
    }

    const role = getProjectRole(project, req.user?.id);
    if (role !== 'owner') {
      res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'Only the project owner can delete this project.' } });
      return;
    }

    const versions = await DataStore.find('schema_versions', { projectId: id });
    for (const v of versions) {
      await DataStore.deleteOne('schema_versions', { _id: v._id || v.id });
    }

    // Delete pending invitations for this project
    const invitations = await DataStore.find('project_invitations', { projectId: id });
    for (const inv of invitations) {
      await DataStore.deleteOne('project_invitations', { _id: inv._id || inv.id });
    }

    await DataStore.deleteOne('projects', { _id: id });
    res.status(200).json({ success: true, message: 'Project deleted successfully.' });
  }

  /**
   * Update project visibility (Owner only)
   */
  public static async updateVisibility(req: AuthRequest, res: Response): Promise<void> {
    const { id } = req.params;
    const { visibility } = updateVisibilitySchema.parse(req.body);
    const project = await findOrProvisionProject(id, req.user?.id, { name: req.body?.projectName });

    if (!project) {
      res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Project not found.' } });
      return;
    }

    const role = getProjectRole(project, req.user?.id);
    if (role !== 'owner') {
      res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'Only the project owner can change visibility.' } });
      return;
    }

    await DataStore.updateOne('projects', { _id: id }, {
      $set: { visibility, updatedAt: new Date() }
    });

    res.status(200).json({
      success: true,
      data: { visibility },
      message: `Project is now ${visibility}.`,
    });
  }

  /**
   * Public discovery gallery listing
   */
  public static async listPublicProjects(req: Request, res: Response): Promise<void> {
    const page = Math.max(1, parseInt(req.query.page as string, 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string, 10) || 12));
    const skip = (page - 1) * limit;
    const search = ((req.query.search as string) || '').toLowerCase().trim();
    const dialect = (req.query.dialect as string) || '';
    const sortBy = (req.query.sort as string) || 'recent';

    const sortConfig: Record<string, 1 | -1> =
      sortBy === 'clones'
        ? { cloneCount: -1, updatedAt: -1 }
        : sortBy === 'name'
        ? { name: 1 }
        : { updatedAt: -1 };

    let query: Record<string, any> = { visibility: 'public' };
    if (dialect) {
      query.targetDialect = dialect;
    }

    const allPublic = await DataStore.find('projects', query, { sort: sortConfig });
    
    // Filter search text in memory if provided
    const filtered = search
      ? allPublic.filter((p) =>
          p.name.toLowerCase().includes(search) || (p.description || '').toLowerCase().includes(search)
        )
      : allPublic;

    const total = filtered.length;
    const paginated = filtered.slice(skip, skip + limit);

    // Collect author IDs and fetch display names safely
    const authorIds = Array.from(new Set(paginated.map((p) => p.userId)));
    const authors = await Promise.all(
      authorIds.map((uid) => DataStore.findOne('users', { _id: uid }))
    );
    const authorNameMap = new Map<string, string>();
    authors.forEach((a) => {
      if (a) authorNameMap.set(a._id || a.id, a.name);
    });

    const items = paginated.map((p) => ({
      id: p._id || p.id,
      name: p.name,
      description: p.description || '',
      targetDialect: p.targetDialect || 'postgresql',
      authorName: authorNameMap.get(p.userId) || 'Schema Architect',
      tableCount: p.currentSchema?.entities?.length || 0,
      relationshipCount: p.currentSchema?.relationships?.length || 0,
      cloneCount: p.cloneCount || 0,
      clonedFrom: p.clonedFrom,
      updatedAt: p.updatedAt,
      createdAt: p.createdAt,
    }));

    res.status(200).json({
      success: true,
      data: {
        items,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
      },
    });
  }

  /**
   * Get single public project by ID (read-only for anyone)
   */
  public static async getPublicProject(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    const project = await DataStore.findOne('projects', { _id: id });

    if (!project || project.visibility !== 'public') {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Public project not found or has been set to private.' },
      });
      return;
    }

    const ownerUser = await DataStore.findOne('users', { _id: project.userId });

    res.status(200).json({
      success: true,
      data: {
        id: project._id || project.id,
        name: project.name,
        description: project.description || '',
        targetDialect: project.targetDialect,
        authorName: ownerUser?.name || 'Schema Architect',
        schema: project.currentSchema,
        layout: project.layout,
        cloneCount: project.cloneCount || 0,
        clonedFrom: project.clonedFrom,
        updatedAt: project.updatedAt,
        createdAt: project.createdAt,
      },
    });
  }

  /**
   * Clone / Fork project into caller's account
   */
  public static async cloneProject(req: AuthRequest, res: Response): Promise<void> {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required to clone projects.' } });
      return;
    }

    const { id } = req.params;
    const sourceProject = await DataStore.findOne('projects', { _id: id });

    if (!sourceProject) {
      res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Source project not found.' } });
      return;
    }

    // Verify access: must be public or user must have collaborator access
    const role = getProjectRole(sourceProject, userId);
    if (sourceProject.visibility !== 'public' && role === 'none') {
      res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'Cannot clone a private project without authorization.' } });
      return;
    }

    const sourceOwner = await DataStore.findOne('users', { _id: sourceProject.userId });
    const sourceOwnerName = sourceOwner?.name || 'Schema Architect';

    const clonedName = `${sourceProject.name} (Clone)`;
    const clonedSchema = deepCloneSchema(sourceProject.currentSchema, clonedName);

    const { insertedId: newProjectId } = await DataStore.insertOne('projects', {
      userId,
      name: clonedName,
      description: sourceProject.description ? `Cloned from ${sourceProject.name}. ${sourceProject.description}` : `Cloned from ${sourceProject.name}`,
      targetDialect: sourceProject.targetDialect,
      requirementsPrompt: sourceProject.requirementsPrompt || '',
      currentSchema: clonedSchema,
      layout: clonedSchema.layout,
      visibility: 'private', // Clones are private by default
      cloneCount: 0,
      clonedFrom: {
        sourceProjectId: sourceProject._id || sourceProject.id,
        sourceProjectName: sourceProject.name,
        sourceOwnerName,
        clonedAt: new Date().toISOString(),
      },
      members: [],
      version: 1,
    });

    // Atomically increment clone count on source project
    await DataStore.updateOne('projects', { _id: sourceProject._id || sourceProject.id }, {
      $inc: { cloneCount: 1 }
    });

    res.status(201).json({
      success: true,
      data: {
        id: newProjectId,
        name: clonedName,
        clonedFrom: {
          sourceProjectId: sourceProject._id || sourceProject.id,
          sourceProjectName: sourceProject.name,
          sourceOwnerName,
        },
      },
      message: 'Project successfully cloned into your workspace.',
    });
  }

  /**
   * Save schema and layout with concurrency conflict checks
   */
  public static async saveSchema(req: AuthRequest, res: Response): Promise<void> {
    const { schema, layout, expectedVersion } = req.body;
    const parsedSchema = canonicalSchemaZodSchema.parse(schema);

    if (req.params.id) {
      const project = await findOrProvisionProject(req.params.id, req.user?.id, {
        name: parsedSchema.projectName,
        targetDialect: parsedSchema.targetDialect,
        currentSchema: parsedSchema,
      });
      if (!project) {
        res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Project not found.' } });
        return;
      }

      const role = getProjectRole(project, req.user?.id);
      if (role !== 'owner' && role !== 'editor') {
        res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'Viewers cannot modify schemas.' } });
        return;
      }

      // Optimistic concurrency check
      if (expectedVersion !== undefined && typeof project.version === 'number' && project.version > expectedVersion) {
        res.status(409).json({
          success: false,
          error: {
            code: 'SCHEMA_CONFLICT',
            message: 'A newer schema revision exists on the server. Please reload the latest changes to avoid overwriting.',
            serverVersion: project.version,
            currentSchema: project.currentSchema,
          },
        });
        return;
      }

      const newVersion = (project.version || 1) + 1;
      await DataStore.updateOne('projects', { _id: req.params.id }, {
        $set: {
          currentSchema: parsedSchema,
          version: newVersion,
          ...(layout && { layout }),
          updatedAt: new Date(),
        },
      });

      res.status(200).json({
        success: true,
        data: { version: newVersion },
        message: 'Schema saved successfully.',
      });
      return;
    }

    res.status(200).json({ success: true, message: 'Schema validated.' });
  }

  /**
   * List project members & pending invitations
   */
  public static async listMembers(req: AuthRequest, res: Response): Promise<void> {
    const { id } = req.params;
    const project = await findOrProvisionProject(id, req.user?.id);

    if (!project) {
      res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Project not found.' } });
      return;
    }

    const role = getProjectRole(project, req.user?.id);
    if (role === 'none') {
      res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'Access denied.' } });
      return;
    }

    const ownerUser = await DataStore.findOne('users', { _id: project.userId });
    const members = project.members || [];

    let pendingInvitations: any[] = [];
    if (role === 'owner') {
      pendingInvitations = await DataStore.find('project_invitations', {
        projectId: id,
        status: 'pending',
      });
    }

    res.status(200).json({
      success: true,
      data: {
        owner: {
          id: project.userId,
          name: ownerUser?.name || 'Owner',
          email: ownerUser?.email || '',
        },
        members,
        invitations: pendingInvitations.map((inv) => ({
          id: inv._id || inv.id,
          invitedEmail: inv.invitedEmail,
          role: inv.role,
          createdAt: inv.createdAt,
          expiresAt: inv.expiresAt,
        })),
        myRole: role,
      },
    });
  }

  /**
   * Invite collaborator (Owner only)
   */
  public static async inviteCollaborator(req: AuthRequest, res: Response): Promise<void> {
    const { id } = req.params;
    const project = await findOrProvisionProject(id, req.user?.id);

    if (!project) {
      res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Project not found.' } });
      return;
    }

    const role = getProjectRole(project, req.user?.id);
    if (role !== 'owner') {
      res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'Only the project owner can invite collaborators.' } });
      return;
    }

    const { email, role: invitedRole } = inviteCollaboratorSchema.parse(req.body);
    const targetEmail = email.toLowerCase().trim();

    if (targetEmail === req.user?.email.toLowerCase()) {
      res.status(400).json({ success: false, error: { code: 'SELF_INVITE', message: 'You cannot invite yourself.' } });
      return;
    }

    if (project.members?.some((m: any) => m.email.toLowerCase() === targetEmail)) {
      res.status(409).json({ success: false, error: { code: 'ALREADY_MEMBER', message: 'This user is already a project collaborator.' } });
      return;
    }

    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');

    const { insertedId: invId } = await DataStore.insertOne('project_invitations', {
      projectId: id,
      projectName: project.name,
      invitedEmail: targetEmail,
      role: invitedRole,
      inviterId: req.user?.id,
      inviterName: req.user?.name,
      inviterEmail: req.user?.email,
      tokenHash,
      status: 'pending',
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      createdAt: new Date(),
    });

    await EmailService.sendInvitationEmail(targetEmail, project.name, req.user?.name || 'Architect', invitedRole, rawToken);

    res.status(201).json({
      success: true,
      data: {
        id: invId,
        invitedEmail: targetEmail,
        role: invitedRole,
        invitationLink: `${ENV.FRONTEND_URL}/collaboration?invite=${rawToken}`,
        rawToken,
      },
      message: `Invitation dispatched to ${targetEmail}.`,
    });
  }

  /**
   * Update member role (Owner only)
   */
  public static async updateMemberRole(req: AuthRequest, res: Response): Promise<void> {
    const { id, memberUserId } = req.params;
    const project = await findOrProvisionProject(id, req.user?.id);

    if (!project) {
      res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Project not found.' } });
      return;
    }

    const role = getProjectRole(project, req.user?.id);
    if (role !== 'owner') {
      res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'Only the project owner can change member roles.' } });
      return;
    }

    const { role: newRole } = updateMemberRoleSchema.parse(req.body);

    const updatedMembers = (project.members || []).map((m: any) => {
      if (m.userId === memberUserId) {
        return { ...m, role: newRole };
      }
      return m;
    });

    await DataStore.updateOne('projects', { _id: id }, {
      $set: { members: updatedMembers, updatedAt: new Date() }
    });

    res.status(200).json({ success: true, message: 'Member role updated successfully.' });
  }

  /**
   * Remove member from project (Owner or Self)
   */
  public static async removeMember(req: AuthRequest, res: Response): Promise<void> {
    const { id, memberUserId } = req.params;
    const project = await findOrProvisionProject(id, req.user?.id);

    if (!project) {
      res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Project not found.' } });
      return;
    }

    const isOwner = project.userId === req.user?.id;
    const isSelf = memberUserId === req.user?.id;

    if (!isOwner && !isSelf) {
      res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'Cannot remove this member.' } });
      return;
    }

    const updatedMembers = (project.members || []).filter((m: any) => m.userId !== memberUserId);

    await DataStore.updateOne('projects', { _id: id }, {
      $set: { members: updatedMembers, updatedAt: new Date() }
    });

    res.status(200).json({ success: true, message: isSelf ? 'You have left the project.' : 'Member removed.' });
  }

  /**
   * Revoke pending invitation (Owner only)
   */
  public static async revokeInvitation(req: AuthRequest, res: Response): Promise<void> {
    const { id, invitationId } = req.params;
    const project = await DataStore.findOne('projects', { _id: id });

    if (!project) {
      res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Project not found.' } });
      return;
    }

    if (project.userId !== req.user?.id) {
      res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'Only owner can revoke invitations.' } });
      return;
    }

    await DataStore.updateOne('project_invitations', { _id: invitationId, projectId: id }, {
      $set: { status: 'revoked', updatedAt: new Date() }
    });

    res.status(200).json({ success: true, message: 'Invitation revoked.' });
  }

  /**
   * Direct stateless AI schema generation
   */
  public static async generateDirect(req: AuthRequest, res: Response): Promise<void> {
    const input = generateRequirementInputSchema.parse(req.body);

    const result = await AIService.generateSchema({
      prompt: input.prompt,
      applicationName: input.applicationName,
      targetDialect: input.targetDialect,
      modules: input.modules,
      rules: input.rules,
      expectedScale: input.expectedScale,
    });

    res.status(200).json({
      success: true,
      data: {
        schema: result.schema,
        diagnostics: result.diagnostics,
        usedAI: result.usedAI,
      },
    });
  }

  /**
   * Generate schema for an existing project
   */
  public static async generateForProject(req: AuthRequest, res: Response): Promise<void> {
    const { id } = req.params;
    const project = await DataStore.findOne('projects', { _id: id });

    if (!project) {
      res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Project not found.' } });
      return;
    }

    const role = getProjectRole(project, req.user?.id);
    if (role !== 'owner' && role !== 'editor') {
      res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'Viewers cannot generate new schema versions.' } });
      return;
    }

    const input = generateRequirementInputSchema.parse(req.body);

    const result = await AIService.generateSchema({
      prompt: input.prompt,
      applicationName: project.name,
      targetDialect: project.targetDialect,
      modules: input.modules,
      rules: input.rules,
      expectedScale: input.expectedScale,
    });

    const newVersion = (project.version || 1) + 1;
    await DataStore.insertOne('schema_versions', {
      projectId: id,
      versionNumber: newVersion,
      snapshot: result.schema,
      triggeredBy: 'ai_generation',
      createdAt: new Date(),
    });

    await DataStore.updateOne('projects', { _id: id }, {
      $set: {
        currentSchema: result.schema,
        version: newVersion,
        updatedAt: new Date(),
      },
    });

    res.status(200).json({
      success: true,
      data: {
        schema: result.schema,
        diagnostics: result.diagnostics,
        version: newVersion,
      },
    });
  }

  /**
   * Validate schema on the fly
   */
  public static async validateSchema(req: AuthRequest, res: Response): Promise<void> {
    const schema = canonicalSchemaZodSchema.parse(req.body.schema);
    const diagnostics = SchemaValidatorService.validate(schema);

    res.status(200).json({
      success: true,
      data: {
        isValid: diagnostics.isValid,
        errors: diagnostics.errors,
        warnings: diagnostics.warnings,
        infos: diagnostics.infos,
      },
    });
  }

  /**
   * Export artifacts (PostgreSQL DDL, Markdown, JSON)
   */
  public static async exportArtifact(req: AuthRequest, res: Response): Promise<void> {
    const { schema, format } = req.body;
    const parsedSchema = canonicalSchemaZodSchema.parse(schema);

    if (format === 'json') {
      res.status(200).json({
        success: true,
        data: {
          content: JSON.stringify(parsedSchema, null, 2),
          filename: `${parsedSchema.projectName.toLowerCase().replace(/[^a-z0-9_]/g, '_')}_schema.json`,
          mimeType: 'application/json',
        },
      });
      return;
    }

    if (format === 'markdown') {
      let md = `# Database Data Dictionary — ${parsedSchema.projectName}\n\n`;
      parsedSchema.entities.forEach((e) => {
        md += `### Table: \`${e.name}\`\n`;
        if (e.description) md += `*${e.description}*\n\n`;
        md += `| Column | Type | Primary Key | Nullable |\n|---|---|---|---|\n`;
        e.fields.forEach((f) => {
          md += `| \`${f.name}\` | \`${f.dataType}\` | ${f.isPrimaryKey ? 'Yes' : 'No'} | ${f.isNullable ? 'Yes' : 'No'} |\n`;
        });
        md += `\n`;
      });

      res.status(200).json({
        success: true,
        data: {
          content: md,
          filename: `${parsedSchema.projectName.toLowerCase().replace(/[^a-z0-9_]/g, '_')}_dictionary.md`,
          mimeType: 'text/markdown',
        },
      });
      return;
    }

    const ddl = generatePostgresDDL(parsedSchema);
    res.status(200).json({
      success: true,
      data: {
        content: ddl,
        filename: `${parsedSchema.projectName.toLowerCase().replace(/[^a-z0-9_]/g, '_')}.sql`,
        mimeType: 'text/sql',
      },
    });
  }

  /**
   * Updates schema using natural language instructions (AI Update Chat)
   */
  public static async iterateSchema(req: AuthRequest, res: Response): Promise<void> {
    const { schema, instruction } = req.body;
    if (!instruction || typeof instruction !== 'string') {
      res.status(400).json({ success: false, error: { code: 'INVALID_INPUT', message: 'Update instruction is required.' } });
      return;
    }

    const parsedSchema = canonicalSchemaZodSchema.parse(schema);
    const result = await AIService.iterateSchema(parsedSchema, instruction);

    res.status(200).json({
      success: true,
      data: {
        schema: result.schema,
        summary: result.summary,
        diagnostics: result.diagnostics,
      },
    });
  }

  /**
   * Batch resolves multiple/all unresolved questions in one unified operation
   */
  public static async resolveQuestions(req: AuthRequest, res: Response): Promise<void> {
    const { schema, answers, batchAnswers } = req.body;
    const providedAnswers = batchAnswers || answers;
    if (!providedAnswers) {
      res.status(400).json({ success: false, error: { code: 'INVALID_INPUT', message: 'Answers are required to resolve questions.' } });
      return;
    }

    const parsedSchema = canonicalSchemaZodSchema.parse(schema);
    const result = await AIService.batchResolveQuestions(parsedSchema, providedAnswers);

    res.status(200).json({
      success: true,
      data: {
        schema: result.schema,
        summary: result.summary,
        diagnostics: result.diagnostics,
      },
    });
  }
}
