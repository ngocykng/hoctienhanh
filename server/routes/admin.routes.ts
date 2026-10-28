import { Router } from 'express';
import { getadminstatus, gethocvien } from '../controllers/admin.controller.ts';

const router = Router();

router.get('/status', getadminstatus);
router.get('/hocvien', gethocvien);

export default router;
