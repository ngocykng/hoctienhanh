import { Router } from 'express';
import {
  handleGenerateVocab,
  handleGetTopics,
  handleGetCardsByTopic,
  handleDeleteTopic,
  handleAutoFillCard,
  handleAddCustomCard,
  handleUpdateCard,
  handleDeleteCard,
  handleToggleCardLearned,
  handleGetAllNotebookCards,
  handleCreateTopic,
  handleCheckSentence,
} from './vocab.controller.ts';

const router = Router();

// Generation & Topic Listing
router.post('/generate', handleGenerateVocab);
router.post('/autofill', handleAutoFillCard);
router.post('/check-sentence', handleCheckSentence);
router.get('/topics', handleGetTopics);
router.post('/topics', handleCreateTopic);
router.get('/notebook/all', handleGetAllNotebookCards);

// Card CRUD & Learning
router.post('/cards', handleAddCustomCard);
router.put('/cards/:cardId', handleUpdateCard);
router.delete('/cards/:cardId', handleDeleteCard);
router.post('/cards/:cardId/toggle-learned', handleToggleCardLearned);

// Topic details & deletion
router.get('/:topicId', handleGetCardsByTopic);
router.delete('/:topicId', handleDeleteTopic);

export default router;

