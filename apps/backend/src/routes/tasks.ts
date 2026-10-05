import { Router } from 'express';
import { getTasks, getSelectedTasks, updateSelectedTasks } from '../controllers/tasks';
import { authMiddleware } from '../middleware/auth';

const router = Router();

router.get('/', getTasks);
router.get('/selected', authMiddleware, getSelectedTasks);
router.put('/selected', authMiddleware, updateSelectedTasks);

export default router;
