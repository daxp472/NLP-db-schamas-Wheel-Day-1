import { Response } from 'express';
import crypto from 'crypto';
import { DataStore } from '../db/mongo';
import { AuthRequest } from '../middleware/auth';

export class InvitationController {
  /**
   * List pending invitations addressed to the current authenticated user
   */
  public static async listMyInvitations(req: AuthRequest, res: Response): Promise<void> {
    const userEmail = req.user?.email.toLowerCase();
    if (!userEmail) {
      res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required.' } });
      return;
    }

    const invitations = await DataStore.find('project_invitations', {
      invitedEmail: userEmail,
      status: 'pending',
    });

    // Filter out expired in memory
    const activeInvitations = invitations.filter(
      (inv) => new Date(inv.expiresAt).getTime() > Date.now()
    );

    res.status(200).json({
      success: true,
      data: activeInvitations.map((inv) => ({
        id: inv._id || inv.id,
        projectId: inv.projectId,
        projectName: inv.projectName,
        role: inv.role,
        inviterName: inv.inviterName,
        inviterEmail: inv.inviterEmail,
        createdAt: inv.createdAt,
        expiresAt: inv.expiresAt,
        token: inv.tokenHash, // Safe hashed identifier for in-app action
      })),
    });
  }

  /**
   * Accept an invitation using raw token or token hash
   */
  public static async acceptInvitation(req: AuthRequest, res: Response): Promise<void> {
    const token = req.params.token || req.body?.token;
    const user = req.user;
    if (!user) {
      res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required.' } });
      return;
    }

    if (!token) {
      res.status(400).json({ success: false, error: { code: 'INVALID_TOKEN', message: 'Invitation token is required.' } });
      return;
    }

    // Search by SHA-256 hash of incoming raw token, direct token, or id
    const computedHash = crypto.createHash('sha256').update(token).digest('hex');

    const invitation =
      (await DataStore.findOne('project_invitations', { tokenHash: computedHash, status: 'pending' })) ||
      (await DataStore.findOne('project_invitations', { tokenHash: token, status: 'pending' })) ||
      (await DataStore.findOne('project_invitations', { _id: token, status: 'pending' }));

    if (!invitation) {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Invitation not found or has already been accepted/revoked.' },
      });
      return;
    }

    if (new Date(invitation.expiresAt).getTime() <= Date.now()) {
      res.status(400).json({
        success: false,
        error: { code: 'EXPIRED_INVITATION', message: 'This invitation has expired.' },
      });
      return;
    }

    // Security check: Verify email matches authenticated user
    if (invitation.invitedEmail.toLowerCase() !== user.email.toLowerCase()) {
      res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN_EMAIL_MISMATCH',
          message: `This invitation was addressed to ${invitation.invitedEmail}. You are signed in as ${user.email}.`,
        },
      });
      return;
    }

    const project = await DataStore.findOne('projects', { _id: invitation.projectId });
    if (!project) {
      res.status(404).json({
        success: false,
        error: { code: 'PROJECT_NOT_FOUND', message: 'The referenced project no longer exists.' },
      });
      return;
    }

    // Add user to project members if not already added
    const existingMembers = project.members || [];
    const isAlreadyMember = existingMembers.some((m: any) => m.userId === user.id);

    if (!isAlreadyMember) {
      const newMember = {
        userId: user.id,
        email: user.email,
        name: user.name,
        role: invitation.role,
        addedAt: new Date().toISOString(),
      };

      await DataStore.updateOne('projects', { _id: invitation.projectId }, {
        $push: { members: newMember },
        $set: { updatedAt: new Date() }
      });
    }

    // Mark invitation as accepted
    await DataStore.updateOne('project_invitations', { _id: invitation._id || invitation.id }, {
      $set: { status: 'accepted', acceptedAt: new Date() }
    });

    res.status(200).json({
      success: true,
      data: {
        projectId: invitation.projectId,
        projectName: invitation.projectName,
        role: invitation.role,
      },
      message: `You are now an ${invitation.role} on "${invitation.projectName}".`,
    });
  }

  /**
   * Decline an invitation
   */
  public static async declineInvitation(req: AuthRequest, res: Response): Promise<void> {
    const token = req.params.token || req.body?.token;
    const user = req.user;
    if (!user) {
      res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required.' } });
      return;
    }

    if (!token) {
      res.status(400).json({ success: false, error: { code: 'INVALID_TOKEN', message: 'Invitation token is required.' } });
      return;
    }

    const computedHash = crypto.createHash('sha256').update(token).digest('hex');

    const invitation =
      (await DataStore.findOne('project_invitations', { tokenHash: computedHash, status: 'pending' })) ||
      (await DataStore.findOne('project_invitations', { tokenHash: token, status: 'pending' })) ||
      (await DataStore.findOne('project_invitations', { _id: token, status: 'pending' }));

    if (!invitation) {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Invitation not found.' },
      });
      return;
    }

    if (invitation.invitedEmail.toLowerCase() !== user.email.toLowerCase()) {
      res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'Access denied.' },
      });
      return;
    }

    await DataStore.updateOne('project_invitations', { _id: invitation._id || invitation.id }, {
      $set: { status: 'declined', declinedAt: new Date() }
    });

    res.status(200).json({ success: true, message: 'Invitation declined.' });
  }

  /**
   * Overview of all team collaboration workspaces for current user
   */
  public static async listCollaborations(req: AuthRequest, res: Response): Promise<void> {
    const userId = req.user?.id;
    const userEmail = req.user?.email.toLowerCase();
    if (!userId || !userEmail) {
      res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required.' } });
      return;
    }

    // Projects shared with user (where user is member but not owner)
    const sharedWithMe = await DataStore.find('projects', {
      'members.userId': userId,
    });

    // Projects owned by user that have at least one collaborator
    const allOwned = await DataStore.find('projects', { userId });
    const ownedShared = allOwned.filter((p) => Array.isArray(p.members) && p.members.length > 0);

    // Pending incoming invitations
    const pendingInvites = await DataStore.find('project_invitations', {
      invitedEmail: userEmail,
      status: 'pending',
    });
    const validInvites = pendingInvites.filter((inv) => new Date(inv.expiresAt).getTime() > Date.now());

    res.status(200).json({
      success: true,
      data: {
        sharedWithMe: sharedWithMe.map((p) => {
          const myMember = p.members?.find((m: any) => m.userId === userId);
          return {
            id: p._id || p.id,
            name: p.name,
            description: p.description || '',
            targetDialect: p.targetDialect,
            visibility: p.visibility || 'private',
            role: myMember?.role || 'viewer',
            memberCount: (p.members?.length || 0) + 1,
            updatedAt: p.updatedAt,
          };
        }),
        ownedShared: ownedShared.map((p) => ({
          id: p._id || p.id,
          name: p.name,
          description: p.description || '',
          targetDialect: p.targetDialect,
          visibility: p.visibility || 'private',
          role: 'owner',
          memberCount: (p.members?.length || 0) + 1,
          updatedAt: p.updatedAt,
        })),
        pendingInvitations: validInvites.map((inv) => ({
          id: inv._id || inv.id,
          projectId: inv.projectId,
          projectName: inv.projectName,
          role: inv.role,
          inviterName: inv.inviterName,
          inviterEmail: inv.inviterEmail,
          createdAt: inv.createdAt,
          expiresAt: inv.expiresAt,
          token: inv.tokenHash,
        })),
      },
    });
  }
}
