import { Router } from 'express';
import { syncUser, getMe } from '../controllers/authController';

const router = Router();

router.post('/sync', syncUser);
router.get('/me', getMe);

export default router;
