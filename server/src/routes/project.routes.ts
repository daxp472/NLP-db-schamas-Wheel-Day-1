import { Router } from 'express';
import { ProjectController } from '../controllers/project.controller';
import { requireAuth } from '../middleware/auth';

const router = Router();

// ==========================================
// Public Endpoints (Accessible anonymously)
// ==========================================
router.get('/public', ProjectController.listPublicProjects);
router.get('/public/:id', ProjectController.getPublicProject);
router.post('/generate-direct', ProjectController.generateDirect);
router.post('/save-schema', ProjectController.saveSchema);

// ==========================================
// Authenticated Project Management
// ==========================================
router.get('/', requireAuth, ProjectController.listProjects);
router.post('/', requireAuth, ProjectController.createProject);
router.get('/:id', requireAuth, ProjectController.getProject);
router.patch('/:id', requireAuth, ProjectController.updateProject);
router.delete('/:id', requireAuth, ProjectController.deleteProject);

// Visibility & Cloning
router.patch('/:id/visibility', requireAuth, ProjectController.updateVisibility);
router.post('/:id/clone', requireAuth, ProjectController.cloneProject);

// Schema Mutations & Exports
router.patch('/:id/schema', requireAuth, ProjectController.saveSchema);
router.post('/:id/schema', requireAuth, ProjectController.saveSchema);
router.post('/:id/save-schema', requireAuth, ProjectController.saveSchema);
router.post('/:id/generate', requireAuth, ProjectController.generateForProject);
router.post('/iterate', requireAuth, ProjectController.iterateSchema);
router.post('/:id/iterate', requireAuth, ProjectController.iterateSchema);
router.post('/resolve-questions', requireAuth, ProjectController.resolveQuestions);
router.post('/:id/resolve-questions', requireAuth, ProjectController.resolveQuestions);
router.post('/:id/validate', requireAuth, ProjectController.validateSchema);
router.post('/:id/export', requireAuth, ProjectController.exportArtifact);

// Collaboration & Team Members
router.get('/:id/members', requireAuth, ProjectController.listMembers);
router.post('/:id/invitations', requireAuth, ProjectController.inviteCollaborator);
router.post('/:id/members/invite', requireAuth, ProjectController.inviteCollaborator);
router.patch('/:id/members/:memberUserId', requireAuth, ProjectController.updateMemberRole);
router.patch('/:id/members/:memberUserId/role', requireAuth, ProjectController.updateMemberRole);
router.delete('/:id/members/:memberUserId', requireAuth, ProjectController.removeMember);
router.delete('/:id/invitations/:invitationId', requireAuth, ProjectController.revokeInvitation);

export default router;
