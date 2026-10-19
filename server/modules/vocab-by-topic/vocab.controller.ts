import { Request, Response } from 'express';
import { generateVocabByTopic, autoFillVocabCard, checkSentenceWithAI } from './vocab.service.ts';
import { db } from '../../db/store.ts';
import { Topic, VocabCard } from '../../../src/types/index.ts';

export async function handleGenerateVocab(req: Request, res: Response) {
  try {
    const { topic, level, excludeWords } = req.body;
    if (!topic || typeof topic !== 'string' || !topic.trim()) {
      return res.status(400).json({ error: 'Vui lòng cung cấp chủ đề hợp lệ.' });
    }

    const trimmedTopic = topic.trim();
    const selectedLevel = level && typeof level === 'string' && level.trim() !== 'ALL' ? level.trim().toUpperCase() : undefined;

    // Collect previously generated words for the same topic to ensure high variety and non-repetition
    const allExistingTopics = (await db.getTopics()).filter(
      (t) => t.name.toLowerCase() === trimmedTopic.toLowerCase()
    );

    let wordsToExclude: string[] = [];
    if (Array.isArray(excludeWords) && excludeWords.length > 0) {
      wordsToExclude = excludeWords.filter((w) => typeof w === 'string' && w.trim());
    } else {
      for (const t of allExistingTopics) {
        const tCards = await db.getCardsByTopic(t.id);
        for (const c of tCards) {
          if (c.word_en) wordsToExclude.push(c.word_en);
          if (c.word_zh) wordsToExclude.push(c.word_zh);
        }
      }
    }

    const batchIndex = allExistingTopics.length + 1;
    const generatedItems = await generateVocabByTopic(
      trimmedTopic,
      selectedLevel,
      wordsToExclude,
      batchIndex
    );

    const topicId = `topic-${Date.now()}`;
    const newTopic: Topic = {
      id: topicId,
      name: trimmedTopic,
      created_at: new Date().toISOString(),
      card_count: generatedItems.length,
      level: selectedLevel || 'ALL',
      batch: batchIndex,
    };

    const cards: VocabCard[] = generatedItems.map((item, index) => ({
      id: `card-${topicId}-${index + 1}`,
      topic_id: topicId,
      word_en: item.word_en,
      ipa_en: item.ipa_en,
      word_zh: item.word_zh,
      pinyin: item.pinyin,
      word_ja: item.word_ja,
      reading_ja: item.reading_ja,
      meaning_vi: item.meaning_vi,
      example_en: item.example_en,
      example_zh: item.example_zh,
      example_ja: item.example_ja,
      example_meaning_vi: item.example_meaning_vi,
      difficulty: item.difficulty || selectedLevel,
    }));

    await db.addTopic(newTopic);
    await db.addCards(cards);

    return res.json({
      success: true,
      topic: newTopic,
      cards,
    });
  } catch (error: any) {
    console.error('handleGenerateVocab error:', error);
    return res.status(500).json({
      error: error.message || 'Không thể tạo từ vựng cho chủ đề này. Vui lòng thử lại.',
    });
  }
}

export async function handleGetTopics(req: Request, res: Response) {
  try {
    const topics = await db.getTopics();
    return res.json({ success: true, topics });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}

export async function handleGetCardsByTopic(req: Request, res: Response) {
  try {
    const { topicId } = req.params;
    const topic = await db.getTopic(topicId);
    if (!topic) {
      return res.status(404).json({ error: 'Không tìm thấy chủ đề.' });
    }
    const cards = await db.getCardsByTopic(topicId);
    return res.json({ success: true, topic, cards });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}

export async function handleDeleteTopic(req: Request, res: Response) {
  try {
    const { topicId } = req.params;
    await db.deleteTopic(topicId);
    return res.json({ success: true, message: 'Đã xóa chủ đề thành công.' });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}

export async function handleAutoFillCard(req: Request, res: Response) {
  try {
    const { inputWord, existingFields } = req.body;
    if (!inputWord || typeof inputWord !== 'string' || !inputWord.trim()) {
      return res.status(400).json({ error: 'Vui lòng nhập từ hoặc cụm từ cần điền thông tin.' });
    }

    const filledData = await autoFillVocabCard(inputWord.trim(), existingFields);
    return res.json({ success: true, data: filledData });
  } catch (error: any) {
    console.error('handleAutoFillCard error:', error);
    return res.status(500).json({ error: error.message || 'Lỗi khi AI tự động điền thông tin thẻ từ vựng' });
  }
}

export async function handleAddCustomCard(req: Request, res: Response) {
  try {
    const {
      topic_id,
      topicName,
      word_en,
      ipa_en,
      word_zh,
      pinyin,
      word_ja,
      reading_ja,
      meaning_vi,
      example_en,
      example_zh,
      example_ja,
      example_meaning_vi,
      difficulty,
    } = req.body;

    if (!word_en && !word_zh && !word_ja && !meaning_vi) {
      return res.status(400).json({ error: 'Cần ít nhất một trường từ vựng (Tiếng Anh, Tiếng Trung, Tiếng Nhật hoặc Tiếng Việt).' });
    }

    let targetTopicId = topic_id && typeof topic_id === 'string' && topic_id.trim() ? topic_id.trim() : undefined;

    // Verify if targetTopicId exists in database
    if (targetTopicId) {
      const existingTopic = await db.getTopic(targetTopicId);
      if (!existingTopic) {
        targetTopicId = undefined;
      }
    }

    // If custom topicName provided or targetTopicId not found, ensure topic exists
    if (!targetTopicId) {
      const topicTitle = (topicName && typeof topicName === 'string' && topicName.trim())
        ? topicName.trim()
        : 'Sổ tay từ vựng của tôi';
      const existing = (await db.getTopics()).find((t) => t.name.toLowerCase() === topicTitle.toLowerCase());
      if (existing) {
        targetTopicId = existing.id;
      } else {
        targetTopicId = `topic-${Date.now()}`;
        const newTopic: Topic = {
          id: targetTopicId,
          name: topicTitle,
          created_at: new Date().toISOString(),
          card_count: 0,
          level: difficulty || 'ALL',
        };
        await db.addTopic(newTopic);
      }
    }

    const newCard: VocabCard = {
      id: `card-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      topic_id: targetTopicId,
      word_en: (word_en || '').trim(),
      ipa_en: (ipa_en || '').trim(),
      word_zh: (word_zh || '').trim(),
      pinyin: (pinyin || '').trim(),
      word_ja: (word_ja || '').trim(),
      reading_ja: (reading_ja || '').trim(),
      meaning_vi: (meaning_vi || '').trim(),
      example_en: (example_en || '').trim(),
      example_zh: (example_zh || '').trim(),
      example_ja: (example_ja || '').trim(),
      example_meaning_vi: (example_meaning_vi || '').trim(),
      difficulty: difficulty || 'B1',
      learned: false,
    };

    const savedCard = await db.addCard(newCard);
    const topic = await db.getTopic(targetTopicId);

    return res.status(201).json({
      success: true,
      card: savedCard,
      topic,
    });
  } catch (error: any) {
    console.error('handleAddCustomCard error:', error);
    return res.status(500).json({ error: error.message || 'Lỗi khi lưu thẻ từ vựng' });
  }
}

export async function handleUpdateCard(req: Request, res: Response) {
  try {
    const { cardId } = req.params;
    const updates = req.body;
    const updated = await db.updateCard(cardId, updates);
    if (!updated) {
      return res.status(404).json({ error: 'Không tìm thấy thẻ từ vựng.' });
    }
    return res.json({ success: true, card: updated });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}

export async function handleDeleteCard(req: Request, res: Response) {
  try {
    const { cardId } = req.params;
    const deleted = await db.deleteCard(cardId);
    if (!deleted) {
      return res.status(404).json({ error: 'Không tìm thấy thẻ từ vựng để xóa.' });
    }
    return res.json({ success: true, message: 'Đã xóa thẻ từ vựng thành công.' });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}

export async function handleToggleCardLearned(req: Request, res: Response) {
  try {
    const { cardId } = req.params;
    const card = await db.toggleCardLearned(cardId);
    if (!card) {
      return res.status(404).json({ error: 'Không tìm thấy thẻ từ vựng.' });
    }
    return res.json({ success: true, card });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}

export async function handleGetAllNotebookCards(req: Request, res: Response) {
  try {
    const cards = await db.getAllCards();
    const topics = await db.getTopics();
    return res.json({ success: true, cards, topics });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}

export async function handleCreateTopic(req: Request, res: Response) {
  try {
    const { name, level } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Vui lòng nhập tên sổ tay / chủ đề.' });
    }
    const topicId = `topic-${Date.now()}`;
    const newTopic: Topic = {
      id: topicId,
      name: name.trim(),
      created_at: new Date().toISOString(),
      card_count: 0,
      level: level || 'ALL',
    };
    await db.addTopic(newTopic);
    return res.status(201).json({ success: true, topic: newTopic });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}

export async function handleCheckSentence(req: Request, res: Response) {
  try {
    const { targetWord, userSentence, language, targetWordMeaning } = req.body;
    if (!targetWord || typeof targetWord !== 'string' || !targetWord.trim()) {
      return res.status(400).json({ error: 'Vui lòng cung cấp từ vựng mục tiêu.' });
    }
    if (!userSentence || typeof userSentence !== 'string' || !userSentence.trim()) {
      return res.status(400).json({ error: 'Vui lòng nhập câu bạn muốn kiểm tra.' });
    }

    const result = await checkSentenceWithAI(
      targetWord.trim(),
      userSentence.trim(),
      language || 'en',
      targetWordMeaning
    );

    return res.json({ success: true, result });
  } catch (error: any) {
    console.error('Error in handleCheckSentence:', error);
    return res.status(500).json({ error: error.message || 'Lỗi khi kiểm tra câu với AI.' });
  }
}
