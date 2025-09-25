import express from 'express';
import { getAllSettlements, createSettlement, confirmSettlement, deleteSettlement } from '../controllers/settlementController.js';

const router = express.Router();

router.get('/', getAllSettlements);
router.post('/', createSettlement);
router.patch('/:id/confirm', confirmSettlement);
router.delete('/:id', deleteSettlement);

export default router;