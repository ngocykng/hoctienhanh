import { generateContentWithRetryAndFallback } from '../../config/genai.client.ts';
import { Type } from '@google/genai';
import { VideoTranscriptItem, SubtitleItem } from '../../../src/types/index.ts';

export interface ExtractedWordItem {
  word: string;
  language: 'en' | 'zh';
  ipa_en?: string;
  pinyin?: string;
  timestamp_sec: number;
  meaning_vi: string;
  context_sentence?: string;
  difficulty?: 'A2' | 'B1' | 'B2' | 'C1' | 'HSK1' | 'HSK2' | 'HSK3' | 'HSK4' | 'HSK5';
}

export async function extractVocabFromTranscript(
  transcript: VideoTranscriptItem[],
  videoContext?: { title?: string; videoId?: string; author?: string }
): Promise<{
  words: ExtractedWordItem[];
  subtitles: SubtitleItem[];
  detectedLanguage: 'en' | 'zh' | 'mixed';
}> {
  let contentPrompt = '';
  const videoTitle = videoContext?.title || `YouTube Video (${videoContext?.videoId || 'Study Video'})`;
  const authorInfo = videoContext?.author ? `bởi kênh "${videoContext.author}"` : '';

  if (transcript && transcript.length > 0) {
    // Pass up to 120 pre-merged sentences (covers full 10-20 min video naturally)
    const transcriptText = transcript
      .slice(0, 120)
      .map(
        (t, idx) =>
          `[Mục #${idx + 1}] [Thời gian: ${t.start.toFixed(1)}s - ${(t.start + (t.duration || 4)).toFixed(1)}s]\nCâu gốc: "${t.text}"`
      )
      .join('\n\n');

    contentPrompt = `Tiêu đề video: "${videoTitle}" ${authorInfo}

Dưới đây là các câu thoại gốc đã được trích xuất từ audio/phụ đề video YouTube kèm mốc thời gian:
---
${transcriptText}
---

YÊU CẦU XỬ LÝ CHÍNH XÁC VÀ BẢO TOÀN TỪ NGỮ GỐC:
1. Phát hiện ngôn ngữ chính của video: "en" (tiếng Anh), "zh" (tiếng Trung), hoặc "mixed".
2. DANH SÁCH PHỤ ĐỀ SONG NGỮ (subtitles):
   - Chuyển đổi từng mục câu thoại trên thành 1 item phụ đề song ngữ:
     + start: giữ nguyên mốc thời gian bắt đầu (giây) của câu thoại.
     + duration: thời lượng của câu (giây).
     + text_original: GIỮ NGUYÊN 100% CÂU TỪ GỐC của câu thoại. TUYỆT ĐỐI KHÔNG TỰ Ý BỎ BỚT TỪ (thiếu từ) VÀ KHÔNG TỰ BỊA THÊM TỪ (thừa từ). Chỉ chuẩn hóa viết hoa chữ cái đầu và dấu câu (. , ? !).
     + text_vi: bản dịch tiếng Việt chuẩn xác, tự nhiên, sát nghĩa nhất theo ngữ cảnh.
     + pinyin: phiên âm Pinyin có dấu thanh điệu đầy đủ nếu là câu tiếng Trung, nếu tiếng Anh thì để trống "".
3. DANH SÁCH TỪ VỰNG TRỌNG TÂM (words):
   - Chọn ra 8 đến 16 từ vựng / cụm từ hay, quan trọng (theo trình độ A2/B1/B2/C1 hoặc HSK2/3/4/5) THỰC SỰ XUẤT HIỆN trong các câu thoại trên.
   - Ghi rõ: word, language ("en" hoặc "zh"), ipa_en (phiên âm chuẩn IPA đặt trong /.../ nếu là tiếng Anh), pinyin (nếu tiếng Trung), timestamp_sec (mốc thời gian bắt đầu của câu chứa từ đó), meaning_vi (nghĩa tiếng Việt cô đọng, chính xác), context_sentence (câu gốc chứa từ đó), difficulty.

Sắp xếp cả hai danh sách theo thứ tự timestamp tăng dần.`;
  } else {
    // If captions disabled on YouTube, synthesize bilingual timeline subtitles
    contentPrompt = `Video YouTube: "${videoTitle}" ${authorInfo} (Video ID: ${videoContext?.videoId}).
Video này không có phụ đề trực tiếp. Dựa vào tiêu đề và chủ đề video, hãy xây dựng:
1. Danh sách 14 đến 20 đoạn PHỤ ĐỀ SONG NGỮ (subtitles) phân bổ mốc thời gian từ 0s đến 240s:
   - Mỗi câu gồm: start (giây), duration (5-7s), text_original (câu tiếng Anh hoặc tiếng Trung đàm thoại tự nhiên, chuẩn ngữ pháp), text_vi (bản dịch tiếng Việt chuẩn xác), pinyin (nếu tiếng Trung).
2. Danh sách 10 đến 14 TỪ VỰNG TRỌNG TÂM (words) xuất hiện trong các câu đó với timestamp_sec, word, ipa_en (nếu tiếng Anh), meaning_vi, difficulty, context_sentence.`;
  }

  try {
    const response = await generateContentWithRetryAndFallback({
      model: 'gemini-1.5-flash',
      contents: contentPrompt,
      config: {
        systemInstruction: `You are an expert bilingual subtitle translator and lexicographer for educational video platforms. You ensure 100% verbatim accuracy for original subtitles (no missing words, no hallucinated words), provide precise context-aware Vietnamese translations, and extract key vocabulary with accurate timestamps and standard IPA transcription for English words. Always output valid JSON matching the schema.`,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            detectedLanguage: {
              type: Type.STRING,
              description: 'Primary language: "en", "zh", or "mixed"',
            },
            subtitles: {
              type: Type.ARRAY,
              description: 'Continuous bilingual subtitles synced to video timestamps',
              items: {
                type: Type.OBJECT,
                properties: {
                  start: { type: Type.NUMBER, description: 'Start time in seconds' },
                  duration: { type: Type.NUMBER, description: 'Duration in seconds' },
                  text_original: { type: Type.STRING, description: 'Original English or Chinese sentence without omitted or hallucinated words' },
                  text_vi: { type: Type.STRING, description: 'Accurate Vietnamese translation' },
                  pinyin: { type: Type.STRING, description: 'Pinyin with tones for Chinese, or empty string' },
                },
                required: ['start', 'text_original', 'text_vi'],
              },
            },
            words: {
              type: Type.ARRAY,
              description: 'Highlighted key vocabulary',
              items: {
                type: Type.OBJECT,
                properties: {
                  word: { type: Type.STRING, description: 'Vocabulary word or phrase' },
                  language: { type: Type.STRING, description: '"en" or "zh"' },
                  ipa_en: { type: Type.STRING, description: 'Standard IPA phonetic transcription for English words (e.g. /ˈhæp.i/), or empty string' },
                  pinyin: { type: Type.STRING, description: 'Pinyin for Chinese, or empty string' },
                  timestamp_sec: { type: Type.NUMBER, description: 'Timestamp in seconds' },
                  meaning_vi: { type: Type.STRING, description: 'Vietnamese concise meaning' },
                  context_sentence: { type: Type.STRING, description: 'Sentence context from video' },
                  difficulty: { type: Type.STRING, description: 'Difficulty level, e.g., B1, B2, C1, HSK4' },
                },
                required: ['word', 'language', 'timestamp_sec', 'meaning_vi'],
              },
            },
          },
          required: ['detectedLanguage', 'subtitles', 'words'],
        },
      },
    });

    const parsed = JSON.parse(response.text || '{}');

    const words: ExtractedWordItem[] = (parsed.words || []).map((w: any) => ({
      word: (w.word || '').trim(),
      language: w.language === 'zh' ? 'zh' : 'en',
      ipa_en: w.ipa_en && w.ipa_en.trim() !== '' ? w.ipa_en.trim() : undefined,
      pinyin: w.pinyin && w.pinyin.trim() !== '' ? w.pinyin.trim() : undefined,
      timestamp_sec: Number(w.timestamp_sec) || 0,
      meaning_vi: (w.meaning_vi || '').trim(),
      context_sentence: (w.context_sentence || '').trim(),
      difficulty: w.difficulty || (w.language === 'zh' ? 'HSK4' : 'B2'),
    }));

    words.sort((a, b) => a.timestamp_sec - b.timestamp_sec);

    const subtitles: SubtitleItem[] = (parsed.subtitles || []).map((s: any, idx: number) => ({
      id: `sub-${idx + 1}-${Math.round(Number(s.start) || 0)}`,
      start: Number(s.start) || 0,
      duration: Number(s.duration) || 5,
      text_original: (s.text_original || '').trim(),
      text_vi: (s.text_vi || '').trim(),
      pinyin: s.pinyin && s.pinyin.trim() !== '' ? s.pinyin.trim() : undefined,
    }));

    subtitles.sort((a, b) => a.start - b.start);

    return {
      words,
      subtitles,
      detectedLanguage: (parsed.detectedLanguage as any) || 'en',
    };
  } catch (error) {
    console.error('Error extracting vocabulary & subtitles with Gemini:', error);
    throw error;
  }
}
