import { Router } from 'express';
import { InvitationController } from '../controllers/invitation.controller';
import { requireAuth } from '../middleware/auth';

const router = Router();

// Authenticated Invitation & Collaboration Actions
router.get('/', requireAuth, InvitationController.listMyInvitations);
router.get('/my-invitations', requireAuth, InvitationController.listMyInvitations);
router.get('/overview', requireAuth, InvitationController.listCollaborations);
router.post('/accept', requireAuth, InvitationController.acceptInvitation);
router.post('/:token/accept', requireAuth, InvitationController.acceptInvitation);
router.post('/decline', requireAuth, InvitationController.declineInvitation);
router.post('/:token/decline', requireAuth, InvitationController.declineInvitation);

export default router;
