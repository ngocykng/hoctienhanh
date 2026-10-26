import { Router } from 'express';
import { getadminstatus } from '../controllers/admin.controller.ts';

const router = Router();

router.get('/status', getadminstatus);

export default router;
