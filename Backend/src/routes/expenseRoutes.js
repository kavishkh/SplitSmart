import express from 'express';
import { getAllExpenses, createExpense, getExpensesByGroup, updateExpense, deleteExpense } from '../controllers/expenseController.js';

const router = express.Router();

router.get('/', getAllExpenses);
router.post('/', createExpense);
router.get('/group/:groupId', getExpensesByGroup);
router.put('/:id', updateExpense);
router.delete('/:id', deleteExpense);

export default router;