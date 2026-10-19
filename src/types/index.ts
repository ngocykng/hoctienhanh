export type CEFRLevel = 'ALL' | 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';

export type LanguagePairMode = 'all' | 'en-vi' | 'zh-vi' | 'ja-vi';

export interface VocabCard {
  id: string;
  topic_id: string;
  word_en: string;
  ipa_en?: string;
  word_zh: string;
  pinyin: string;
  word_ja?: string;
  reading_ja?: string; // Furigana / Romaji / Hiragana
  meaning_vi: string;
  example_en: string;
  example_zh: string;
  example_ja?: string;
  example_meaning_vi: string;
  difficulty?: 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2' | string;
  learned?: boolean;
}

export interface Topic {
  id: string;
  name: string;
  created_at: string;
  card_count?: number;
  level?: CEFRLevel | string;
  batch?: number;
}

export interface SubtitleItem {
  id: string;
  start: number;
  duration?: number;
  text_original: string;
  text_vi: string;
  pinyin?: string;
  reading_ja?: string;
}

export interface VideoWord {
  id: string;
  session_id: string;
  word: string;
  language: 'en' | 'zh' | 'ja';
  ipa_en?: string;
  pinyin?: string;
  reading_ja?: string;
  timestamp_sec: number;
  meaning_vi: string;
  context_sentence?: string;
  difficulty?: 'A2' | 'B1' | 'B2' | 'C1' | 'HSK1' | 'HSK2' | 'HSK3' | 'HSK4' | 'HSK5' | 'N5' | 'N4' | 'N3' | 'N2' | 'N1';
}

export interface VideoSession {
  id: string;
  youtube_url: string;
  video_id: string;
  title: string;
  channel_title?: string;
  duration_sec?: number;
  language?: 'en' | 'zh' | 'ja' | 'mixed';
  created_at: string;
  words_count?: number;
  subtitles?: SubtitleItem[];
}

export interface VideoTranscriptItem {
  text: string;
  start: number;
  duration: number;
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
