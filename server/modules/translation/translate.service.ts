import { Router, Request, Response } from 'express';
import { generateContentWithRetryAndFallback } from '../../config/genai.client.ts';
import { Type } from '@google/genai';

const router = Router();

router.post('/lookup', async (req: Request, res: Response) => {
  try {
    const { text, sourceLang } = req.body;
    if (!text) {
      return res.status(400).json({ error: 'Text required' });
    }

    const response = await generateContentWithRetryAndFallback({
      model: 'gemini-1.5-flash',
      contents: `Phân tích từ/cụm từ "${text}" (ngôn ngữ nguồn: ${sourceLang || 'auto'}).
Cung cấp:
- word_en: từ tiếng Anh tương đương
- word_zh: từ tiếng Trung tương đương
- pinyin: pinyin có dấu nếu là tiếng Trung
- meaning_vi: giải nghĩa tiếng Việt chi tiết kèm loại từ
- example_sentence: câu ví dụ song ngữ`,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            word_en: { type: Type.STRING },
            word_zh: { type: Type.STRING },
            pinyin: { type: Type.STRING },
            meaning_vi: { type: Type.STRING },
            example_sentence: { type: Type.STRING },
          },
          required: ['word_en', 'word_zh', 'pinyin', 'meaning_vi'],
        },
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    return res.json({ success: true, data: parsed });
  } catch (error: any) {
    console.error('Translation error:', error);
    return res.status(500).json({ error: error.message || 'Lỗi tra cứu từ điển' });
  }
});

export default router;
