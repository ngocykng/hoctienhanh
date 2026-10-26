import { generateContentWithRetryAndFallback } from '../config/genai.client.ts';
import { Type } from '@google/genai';

export interface GeneratedVocabItem {
  word_en: string;
  ipa_en?: string;
  word_zh: string;
  pinyin: string;
  word_ja?: string;
  reading_ja?: string;
  meaning_vi: string;
  example_en: string;
  example_zh: string;
  example_ja?: string;
  example_meaning_vi: string;
  difficulty?: string;
}

const LEVEL_DESCRIPTIONS: Record<string, string> = {
  A1: 'Trình độ A1 (Sơ cấp cơ bản / HSK 1 / JLPT N5): Tập trung vào từ vựng nền tảng, dễ hiểu nhất, từ đơn lẻ quen thuộc, đồ vật, số đếm, hành động hàng ngày.',
  A2: 'Trình độ A2 (Sơ cấp nâng cao / HSK 2 / JLPT N4): Tập trung vào từ vựng giao tiếp thường nhật, mua sắm, miêu tả cảm xúc đơn giản, du lịch, gia đình.',
  B1: 'Trình độ B1 (Trung cấp / HSK 3 / JLPT N3): Tập trung vào từ vựng diễn đạt ý kiến, thảo luận công việc cơ bản, thói quen, giải thích nguyên nhân, du lịch.',
  B2: 'Trình độ B2 (Trung cấp trên / HSK 4 / JLPT N2): Tập trung vào từ vựng đa dạng, phong phú, đàm thoại lưu loát, thành ngữ phổ biến, chủ đề xã hội, công sở.',
  C1: 'Trình độ C1 (Cao cấp / HSK 5 / JLPT N1): Tập trung vào từ vựng học thuật, chuyên ngành, thành ngữ/idioms, từ vựng trừu tượng, văn phong trang trọng.',
  C2: 'Trình độ C2 (Bậc thầy / HSK 6+ / JLPT N1+): Tập trung vào từ vựng cao cấp, tinh tế, văn chương cổ điển/hiện đại, thuật ngữ chuyên sâu và sắc thái biểu cảm phức tạp.',
};

export async function generateVocabByTopic(
  topic: string,
  level?: string,
  excludeWords?: string[],
  batchIndex?: number
): Promise<GeneratedVocabItem[]> {
  const selectedLevel = level && level !== 'ALL' ? level.toUpperCase() : undefined;
  const levelInstruction = selectedLevel && LEVEL_DESCRIPTIONS[selectedLevel]
    ? `\nĐẶC BIỆT YÊU CẦU ĐỘ KHÓ: Bộ từ vựng PHẢI TUÂN THỦ NGHIÊM NGẶT ${LEVEL_DESCRIPTIONS[selectedLevel]}. Tất cả 15 từ và câu ví dụ phải phù hợp chính xác với chuẩn CEFR ${selectedLevel}.`
    : `\nĐỘ KHÓ: Tạo danh sách 15 từ vựng đa dạng từ căn bản đến nâng cao (phân bổ phù hợp với chủ đề từ A1 đến C1).`;

  const randomSeed = Math.floor(Math.random() * 1000000);
  const excludeInstruction = excludeWords && excludeWords.length > 0
    ? `\n\n[QUY TẮC BẮT BUỘC VỀ SỰ ĐA DẠNG NGẪU NHIÊN]: Đây là lần tạo ngẫu nhiên bổ sung (Lượt #${batchIndex || 2}, Seed: ${randomSeed}).\nTUYỆT ĐỐI KHÔNG LẶP LẠI bất kỳ từ vựng tiếng Anh/tiếng Trung/tiếng Nhật nào sau đây đã xuất hiện trước đó: [${excludeWords.slice(0, 50).join(', ')}].\nHãy khám phá 15 từ vựng hoàn toàn MỚI LẠ, mở rộng theo các góc nhìn, ngữ cảnh, khía cạnh chuyên sâu, thành ngữ và biểu đạt độc đáo khác của chủ đề "${topic}".`
    : `\n\n[ĐA DẠNG HÓA TỰ NHIÊN]: Hãy tạo 15 từ vựng phong phú, tự nhiên, mang tính ngẫu nhiên sáng tạo cao (Seed: ${randomSeed}).`;

  const prompt = `Chủ đề: "${topic}".${levelInstruction}${excludeInstruction}

Tạo 15 từ vựng hoặc cụm từ/cụm động từ/thành ngữ tiếng Anh thiết thực (bao gồm cả từ đơn lẻ và các cụm tiếng Anh như phrasal verbs "wake up", "give up", "look forward to", "take care of", collocations "make a decision", "pay attention", idioms phù hợp theo chủ đề) đa ngôn ngữ Anh - Trung - Nhật (kèm phiên âm IPA tiếng Anh, Pinyin tiếng Trung có thanh điệu, Furigana/Romaji tiếng Nhật), giải nghĩa chi tiết bằng tiếng Việt.
Khuyến khích kết hợp cân đối giữa từ vựng đơn và các cụm từ/cụm động từ thực tế hay dùng trong đời sống hàng ngày.

Với mỗi từ/cụm từ, trả về đúng JSON schema sau:
- word_en: Từ hoặc cụm từ tiếng Anh (ví dụ: "wake up", "resilience", "take for granted", "figure out"...)
- ipa_en: Phiên âm quốc tế IPA chuẩn của từ hoặc cụm từ tiếng Anh kèm dấu trọng âm, đặt trong dấu gạch chéo (ví dụ: "/weɪk ʌp/", "/ˌser.ənˈdɪp.ə.ti/", "/ˈfɪɡ.ər aʊt/")
- word_zh: Từ/cụm từ tiếng Trung tương ứng (Hán tự chuẩn)
- pinyin: Phiên âm Pinyin kèm dấu thanh điệu chuẩn xác (ví dụ: "qǐchuáng", "nǐ hǎo")
- word_ja: Từ/cụm từ tiếng Nhật chuẩn (Kanji/Kana tự nhiên, ví dụ: "起きる", "一期一会")
- reading_ja: Cách đọc Hiragana và Romaji của từ tiếng Nhật (ví dụ: "おきる (okiru)", "いちごいちえ (ichigo ichie)")
- meaning_vi: Nghĩa tiếng Việt ngắn gọn, súc tích, chuẩn ngữ nghĩa
- example_en: Câu ví dụ tự nhiên bằng tiếng Anh sử dụng word_en (độ dài vừa phải)
- example_zh: Câu ví dụ tiếng Trung CÙNG NGHĨA với example_en
- example_ja: Câu ví dụ tiếng Nhật CÙNG NGHĨA với example_en (tự nhiên, chuẩn ngữ pháp Nhật)
- example_meaning_vi: Dịch câu ví dụ sang tiếng Việt tự nhiên và chính xác
- difficulty: Trình độ CEFR của từ này (${selectedLevel || 'A1, A2, B1, B2, C1, hoặc C2'})`;

  try {
    const response = await generateContentWithRetryAndFallback({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        systemInstruction: `You are an expert multilingual lexicographer and CEFR/HSK/JLPT language educator. You generate precisely 15 vocabulary items (including both single words and high-frequency English phrases, phrasal verbs, collocations, and idioms) matching the specified CEFR level (A1, A2, B1, B2, C1, C2) and topic. Ensure standard IPA phonetic transcription for English words/phrases, 100% correct Hanzi with tone-marked Pinyin for Chinese, natural Kanji/Kana with Hiragana & Romaji reading for Japanese, natural sentences in English, Chinese, and Japanese, and accurate Vietnamese definitions. Always output a diverse and randomized selection of terms, strictly avoiding any provided excluded words. Always output a valid JSON array matching the schema.`,
        temperature: 0.95,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              word_en: { type: Type.STRING, description: 'English word or phrase' },
              ipa_en: { type: Type.STRING, description: 'Standard IPA phonetic transcription, e.g. /ˈhæp.i/ or /ˌser.ənˈdɪp.ə.ti/' },
              word_zh: { type: Type.STRING, description: 'Chinese simplified Hanzi' },
              pinyin: { type: Type.STRING, description: 'Pinyin with tone marks' },
              word_ja: { type: Type.STRING, description: 'Japanese Kanji or Kana word' },
              reading_ja: { type: Type.STRING, description: 'Hiragana reading and Romaji, e.g. ぐうぜん (gūzen)' },
              meaning_vi: { type: Type.STRING, description: 'Vietnamese definition' },
              example_en: { type: Type.STRING, description: 'Natural English example sentence' },
              example_zh: { type: Type.STRING, description: 'Chinese example sentence with same meaning' },
              example_ja: { type: Type.STRING, description: 'Japanese example sentence with same meaning' },
              example_meaning_vi: { type: Type.STRING, description: 'Vietnamese translation of the example sentence' },
              difficulty: { type: Type.STRING, description: 'CEFR level (A1, A2, B1, B2, C1, C2)' },
            },
            required: [
              'word_en',
              'ipa_en',
              'word_zh',
              'pinyin',
              'word_ja',
              'reading_ja',
              'meaning_vi',
              'example_en',
              'example_zh',
              'example_ja',
              'example_meaning_vi',
            ],
          },
        },
      },
    });

    const text = response.text || '[]';
    const parsed: GeneratedVocabItem[] = JSON.parse(text);
    return parsed.map((item) => ({
      ...item,
      difficulty: item.difficulty || selectedLevel || 'B1',
    }));
  } catch (error) {
    console.error('Error generating vocab with Gemini after retries and fallback:', error);
    throw error;
  }
}

export async function autoFillVocabCard(
  inputWord: string,
  existingFields?: Partial<GeneratedVocabItem>
): Promise<GeneratedVocabItem> {
  const prompt = `Người dùng muốn tạo thẻ từ vựng với từ khóa đầu vào: "${inputWord}".
Thông tin có sẵn (nếu có): ${JSON.stringify(existingFields || {})}

Hãy phân tích và tự động điền đầy đủ, chuẩn xác tất cả các trường sau cho thẻ học đa ngôn ngữ Anh - Trung - Nhật giải nghĩa Tiếng Việt:
1. word_en: Từ hoặc cụm từ tiếng Anh chuẩn
2. ipa_en: Phiên âm quốc tế IPA chuẩn của từ tiếng Anh kèm dấu trọng âm, đặt trong dấu gạch chéo (ví dụ: "/ˌser.ənˈdɪp.ə.ti/", "/məˈtɪk.jə.ləs/", "/ˈæl.ɡə.rɪ.ðəm/")
3. word_zh: Chữ Hán giản thể chuẩn tương đương
4. pinyin: Phiên âm Pinyin kèm dấu thanh điệu chuẩn xác (ví dụ: "yī sī bù gǒu", "jī yuán qiǎo hé")
5. word_ja: Từ tiếng Nhật tương đương (Kanji/Kana tự nhiên)
6. reading_ja: Cách đọc Hiragana và Romaji của từ tiếng Nhật (ví dụ: "いちごいちえ (ichigo ichie)")
7. meaning_vi: Nghĩa tiếng Việt cô đọng, rõ ràng, chính xác
8. example_en: Câu ví dụ tự nhiên bằng tiếng Anh có chứa word_en
9. example_zh: Câu ví dụ tiếng Trung tương đồng ngữ nghĩa hoàn toàn với example_en
10. example_ja: Câu ví dụ tiếng Nhật tương đồng ngữ nghĩa hoàn toàn với example_en
11. example_meaning_vi: Dịch câu ví dụ sang tiếng Việt tự nhiên và mượt mà
12. difficulty: Trình độ CEFR phù hợp nhất (A1, A2, B1, B2, C1, hoặc C2)`;

  try {
    const response = await generateContentWithRetryAndFallback({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        systemInstruction: `You are an expert trilingual lexicographer and language curriculum designer (English, Chinese, Japanese, Vietnamese). Given any input query (which could be in English, Chinese, Japanese, or Vietnamese), return a complete, highly accurate multilingual vocabulary card with standard IPA for English, tone-marked Pinyin for Chinese, Kanji/Kana with Hiragana & Romaji for Japanese, natural contextual example sentences in English, Chinese, and Japanese, clear Vietnamese translation, and appropriate CEFR level. Always return a single JSON object strictly matching the schema.`,
        temperature: 0.3,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            word_en: { type: Type.STRING, description: 'English word or phrase' },
            ipa_en: { type: Type.STRING, description: 'Standard IPA phonetic transcription with slashes, e.g. /ˈhæp.i/' },
            word_zh: { type: Type.STRING, description: 'Chinese simplified characters' },
            pinyin: { type: Type.STRING, description: 'Pinyin with tone marks' },
            word_ja: { type: Type.STRING, description: 'Japanese Kanji or Kana word' },
            reading_ja: { type: Type.STRING, description: 'Hiragana reading and Romaji' },
            meaning_vi: { type: Type.STRING, description: 'Clear Vietnamese definition' },
            example_en: { type: Type.STRING, description: 'Natural English example sentence' },
            example_zh: { type: Type.STRING, description: 'Chinese example sentence with same meaning' },
            example_ja: { type: Type.STRING, description: 'Japanese example sentence with same meaning' },
            example_meaning_vi: { type: Type.STRING, description: 'Vietnamese translation of the example sentence' },
            difficulty: { type: Type.STRING, description: 'CEFR level (A1, A2, B1, B2, C1, C2)' },
          },
          required: [
            'word_en',
            'ipa_en',
            'word_zh',
            'pinyin',
            'word_ja',
            'reading_ja',
            'meaning_vi',
            'example_en',
            'example_zh',
            'example_ja',
            'example_meaning_vi',
          ],
        },
      },
    });

    const text = response.text || '{}';
    const parsed: GeneratedVocabItem = JSON.parse(text);
    return {
      word_en: parsed.word_en || inputWord,
      ipa_en: parsed.ipa_en || '',
      word_zh: parsed.word_zh || '',
      pinyin: parsed.pinyin || '',
      word_ja: parsed.word_ja || '',
      reading_ja: parsed.reading_ja || '',
      meaning_vi: parsed.meaning_vi || '',
      example_en: parsed.example_en || '',
      example_zh: parsed.example_zh || '',
      example_ja: parsed.example_ja || '',
      example_meaning_vi: parsed.example_meaning_vi || '',
      difficulty: parsed.difficulty || 'B1',
    };
  } catch (error) {
    console.error('Error auto-filling vocab card with Gemini:', error);
    throw error;
  }
}

export interface SentenceCheckError {
  part: string;
  issue: string;
  explanation: string;
  correction: string;
}

export interface SentenceCheckResult {
  isCorrect: boolean;
  score: number;
  wordUsedCorrectly: boolean;
  overallFeedback: string;
  errors: SentenceCheckError[];
  improvedSentence: string;
  vietnameseMeaning: string;
  betterAlternatives: string[];
}

export async function checkSentenceWithAI(
  targetWord: string,
  userSentence: string,
  language: 'en' | 'zh' | 'ja' = 'en',
  targetWordMeaning?: string
): Promise<SentenceCheckResult> {
  const langName = language === 'en' ? 'tiếng Anh' : language === 'zh' ? 'tiếng Trung' : 'tiếng Nhật';

  const prompt = `Người học đang thực hành đặt câu ${langName} với từ vựng mục tiêu: "${targetWord}"${targetWordMeaning ? ` (Nghĩa tiếng Việt: "${targetWordMeaning}")` : ''}.
Câu người học đã nhập: "${userSentence}".

Hãy đóng vai trò là một chuyên gia ngôn ngữ và giáo viên bản ngữ giàu kinh nghiệm. Hãy phân tích và chấm điểm thật chi tiết, tỉ mỉ câu của người học:
1. "wordUsedCorrectly": Người học có sử dụng đúng từ vựng mục tiêu "${targetWord}" (hoặc các biến thể ngữ pháp hợp lệ của từ này) trong đúng ngữ cảnh không? (true/false)
2. "isCorrect": Toàn bộ câu có chính xác 100% về ngữ pháp, thì (tenses), giới từ, từ loại, sự hòa hợp chủ vị, và dấu câu hay không? (true nếu không có bất kỳ lỗi nào, false nếu có ít nhất 1 lỗi)
3. "score": Chấm điểm câu trên thang điểm từ 0 đến 100 dựa trên độ chính xác ngữ pháp, từ vựng và tính tự nhiên.
4. "overallFeedback": Nhận xét tổng quan bằng tiếng Việt: khen ngợi điểm tốt, động viên và tóm tắt ngắn gọn cần chú ý điều gì.
5. "errors": Danh sách chi tiết các lỗi sai trong câu (nếu câu hoàn toàn đúng, trả về mảng rỗng []). Mỗi lỗi gồm:
   - "part": Trích đoạn/cụm từ cụ thể bị sai trong câu của người học (ví dụ: "wake up", "in morning", "go to home")
   - "issue": Tên loại lỗi ngắn gọn (ví dụ: "Lỗi chia thì quá khứ", "Thiếu mạo từ xác định", "Dùng sai giới từ")
   - "explanation": Giải thích cặn kẽ, dễ hiểu bằng tiếng Việt tại sao sai và cấu trúc/nguyên tắc ngữ pháp đúng là gì
   - "correction": Cách sửa đúng cho phần bị lỗi đó (ví dụ: "woke up", "in the morning", "go home")
6. "improvedSentence": Phiên bản câu hoàn chỉnh đã được sửa chuẩn xác, mượt mà và tự nhiên nhất.
7. "vietnameseMeaning": Dịch câu hoàn chỉnh (improvedSentence) sang tiếng Việt tự nhiên.
8. "betterAlternatives": 1 đến 2 câu gợi ý tự nhiên hơn, chuẩn phong cách người bản xứ hay dùng với từ vựng "${targetWord}".`;

  try {
    const response = await generateContentWithRetryAndFallback({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        systemInstruction: `You are an expert linguistics tutor and grammar evaluator. Carefully analyze the user's sentence practice with the target word. Accurately detect grammatical mistakes, spelling, punctuation, tense agreement, preposition usage, and collocations. Provide precise, constructive, encouraging explanations in Vietnamese. Always output valid JSON strictly adhering to the schema.`,
        temperature: 0.2,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            isCorrect: { type: Type.BOOLEAN, description: 'True if no errors found' },
            score: { type: Type.INTEGER, description: 'Score from 0 to 100' },
            wordUsedCorrectly: { type: Type.BOOLEAN, description: 'True if target word is used properly in context' },
            overallFeedback: { type: Type.STRING, description: 'Summary assessment in Vietnamese' },
            errors: {
              type: Type.ARRAY,
              description: 'List of specific errors in the sentence',
              items: {
                type: Type.OBJECT,
                properties: {
                  part: { type: Type.STRING, description: 'The exact part/phrase with error' },
                  issue: { type: Type.STRING, description: 'Issue title in Vietnamese' },
                  explanation: { type: Type.STRING, description: 'Detailed explanation in Vietnamese of why it is wrong and what rule applies' },
                  correction: { type: Type.STRING, description: 'Suggested fix' },
                },
                required: ['part', 'issue', 'explanation', 'correction'],
              },
            },
            improvedSentence: { type: Type.STRING, description: 'The corrected complete sentence' },
            vietnameseMeaning: { type: Type.STRING, description: 'Vietnamese translation of the corrected sentence' },
            betterAlternatives: {
              type: Type.ARRAY,
              description: '1-2 natural native alternatives',
              items: { type: Type.STRING },
            },
          },
          required: [
            'isCorrect',
            'score',
            'wordUsedCorrectly',
            'overallFeedback',
            'errors',
            'improvedSentence',
            'vietnameseMeaning',
            'betterAlternatives',
          ],
        },
      },
    });

    const text = response.text || '{}';
    const parsed: SentenceCheckResult = JSON.parse(text);
    return {
      isCorrect: !!parsed.isCorrect,
      score: typeof parsed.score === 'number' ? parsed.score : 80,
      wordUsedCorrectly: parsed.wordUsedCorrectly !== false,
      overallFeedback: parsed.overallFeedback || 'Câu của bạn đã được kiểm tra.',
      errors: Array.isArray(parsed.errors) ? parsed.errors : [],
      improvedSentence: parsed.improvedSentence || userSentence,
      vietnameseMeaning: parsed.vietnameseMeaning || '',
      betterAlternatives: Array.isArray(parsed.betterAlternatives) ? parsed.betterAlternatives : [],
    };
  } catch (error) {
    console.error('Error checking sentence with Gemini:', error);
    throw error;
  }
}

