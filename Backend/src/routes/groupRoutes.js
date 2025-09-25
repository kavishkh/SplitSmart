import express from 'express';
import { getAllGroups, createGroup, getGroupById, updateGroup, deleteGroup } from '../controllers/groupController.js';

const router = express.Router();

router.get('/', getAllGroups);
router.post('/', createGroup);
router.get('/:id', getGroupById);
router.put('/:id', updateGroup);
router.delete('/:id', deleteGroup);

export default router;