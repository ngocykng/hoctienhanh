import { Topic, VocabCard, VideoSession, VideoWord, SubtitleItem, SentenceCheckResult } from '../types/index.ts';

const API_BASE_URL = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');
interface AdminStatsResponse {
  success: boolean;
  message: string;
  data: {
    totalUsers: number;
  };
}
export async function apiRequest<T = Record<string, unknown>>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, options);
  const text = await res.text();
  let data: T | undefined;

  if (text.trim()) {
    try {
      data = JSON.parse(text) as T;
    } catch {
      throw new Error(`API trả về dữ liệu không hợp lệ (HTTP ${res.status}).`);
    }
  }

  if (!res.ok) {
    const errorData = data as { error?: string } | undefined;
    throw new Error(errorData?.error || `Yêu cầu API thất bại (HTTP ${res.status}).`);
  }

  return data || ({} as T);
}

export async function generateVocab(topic: string, level?: string, excludeWords?: string[]): Promise<{ topic: Topic; cards: VocabCard[] }> {
  const data = await apiRequest<{ topic: Topic; cards: VocabCard[] }>('/api/vocab/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ topic, level, excludeWords }),
  });

  return { topic: data.topic, cards: data.cards };
}

export async function getTopics(): Promise<Topic[]> {
  const data = await apiRequest<Topic[] | { topics: Topic[] }>('/api/vocab/topics');

  // Đảm bảo luôn trả về mảng dù API trả về { topics: [] } hoặc trực tiếp []
  if (Array.isArray(data)) return data;
  if (data && Array.isArray(data.topics)) return data.topics;
  return [];
}

export async function getTopicCards(topicId: string): Promise<{ topic: Topic; cards: VocabCard[] }> {
  const data = await apiRequest<{ topic: Topic; cards?: VocabCard[] }>(`/api/vocab/${topicId}`);
  return { topic: data.topic, cards: data.cards || [] };
}

export async function deleteTopic(topicId: string): Promise<void> {
  await apiRequest(`/api/vocab/${topicId}`, {
    method: 'DELETE',
  });
}

export async function extractVideoVocab(
  youtube_url: string,
  title?: string,
  custom_transcript?: string,
  force_refresh?: boolean
): Promise<{ session: VideoSession; words: VideoWord[] }> {
  const data = await apiRequest<{ session: VideoSession; words?: VideoWord[] }>('/api/video/extract', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ youtube_url, title, custom_transcript, force_refresh }),
  });

  return { session: data.session, words: data.words || [] };
}

export async function updateVideoSubtitles(
  sessionId: string,
  subtitles: SubtitleItem[]
): Promise<VideoSession> {
  const data = await apiRequest<{ session: VideoSession }>(`/api/video/sessions/${sessionId}/subtitles`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ subtitles }),
  });

  return data.session;
}

export async function getVideoSessions(): Promise<VideoSession[]> {
  const data = await apiRequest<{ sessions?: VideoSession[] }>('/api/video/sessions');
  return data.sessions || [];
}

export async function getVideoSession(sessionId: string): Promise<{ session: VideoSession; words: VideoWord[] }> {
  const data = await apiRequest<{ session: VideoSession; words?: VideoWord[] }>(`/api/video/${sessionId}`);
  return { session: data.session, words: data.words || [] };
}

export async function quickLookup(text: string, sourceLang?: string) {
  const data = await apiRequest<{ data: unknown }>('/api/translate/lookup', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, sourceLang }),
  });
  return data.data;
}

export async function autoFillCard(inputWord: string, existingFields?: Partial<VocabCard>): Promise<Partial<VocabCard>> {
  const data = await apiRequest<{ data: Partial<VocabCard> }>('/api/vocab/autofill', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ inputWord, existingFields }),
  });
  return data.data;
}

export async function createCustomCard(cardData: Partial<VocabCard> & { topicName?: string }): Promise<{ card: VocabCard; topic?: Topic }> {
  const data = await apiRequest<{ card: VocabCard; topic?: Topic }>('/api/vocab/cards', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(cardData),
  });
  return { card: data.card, topic: data.topic };
}

export async function updateCard(cardId: string, updates: Partial<VocabCard>): Promise<VocabCard> {
  const data = await apiRequest<{ card: VocabCard }>(`/api/vocab/cards/${cardId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates),
  });
  return data.card;
}

export async function deleteCard(cardId: string): Promise<void> {
  await apiRequest(`/api/vocab/cards/${cardId}`, {
    method: 'DELETE',
  });
}

export async function toggleCardLearned(cardId: string): Promise<VocabCard> {
  const data = await apiRequest<{ card: VocabCard }>(`/api/vocab/cards/${cardId}/toggle-learned`, {
    method: 'POST',
  });
  return data.card;
}

export async function getAllNotebookCards(): Promise<{ cards: VocabCard[]; topics: Topic[] }> {
  const data = await apiRequest<{ cards?: VocabCard[]; topics?: Topic[] }>('/api/vocab/notebook/all');
  return { cards: data.cards || [], topics: data.topics || [] };
}

export async function createTopic(name: string, level?: string): Promise<Topic> {
  const data = await apiRequest<{ topic: Topic }>('/api/vocab/topics', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, level }),
  });
  return data.topic;
}

export async function checkSentence(params: {
  targetWord: string;
  userSentence: string;
  language?: 'en' | 'zh' | 'ja';
  targetWordMeaning?: string;
}): Promise<SentenceCheckResult> {
  const data = await apiRequest<{ result: SentenceCheckResult }>('/api/vocab/check-sentence', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
  return data.result;
}

export async function fetchAdminStats() {
  const data = await apiRequest<{ data: { totalUsers: number } }>('/api/admin/status');
  return data.data;
}
