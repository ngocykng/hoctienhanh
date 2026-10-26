import { Router } from 'express';
import { getadminstatus } from './admin.controller';

const router = Router();

router.get('/status', getadminstatus);

export default router;
