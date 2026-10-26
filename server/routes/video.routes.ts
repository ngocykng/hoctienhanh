import { Router } from 'express';
import {
  handleExtractVideoVocab,
  handleGetVideoSessions,
  handleGetVideoSessionById,
  handleUpdateSubtitles,
} from '../controllers/video.controller.ts';

const router = Router();

router.post('/extract', handleExtractVideoVocab);
router.get('/sessions', handleGetVideoSessions);
router.get('/:sessionId', handleGetVideoSessionById);
router.put('/sessions/:sessionId/subtitles', handleUpdateSubtitles);

export default router;
