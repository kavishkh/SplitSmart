import express from 'express';
import { sendInvitationEmail, sendSettlementReminder } from '../controllers/emailController.js';

const router = express.Router();

router.post('/send-invitation-email', sendInvitationEmail);
router.post('/send-settlement-reminder', sendSettlementReminder);

export default router;