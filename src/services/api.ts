import { Topic, VocabCard, VideoSession, VideoWord, SubtitleItem, SentenceCheckResult } from '../types/index.ts';

export async function generateVocab(topic: string, level?: string, excludeWords?: string[]): Promise<{ topic: Topic; cards: VocabCard[] }> {
  const res = await fetch('/api/vocab/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ topic, level, excludeWords }),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Lỗi khi tạo từ vựng theo chủ đề');
  }
  return { topic: data.topic, cards: data.cards };
}

export async function getTopics(): Promise<Topic[]> {
  const res = await fetch('/api/vocab/topics');
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Lỗi khi tải danh sách chủ đề');
  }

  // Đảm bảo luôn trả về mảng dù API trả về { topics: [] } hoặc trực tiếp []
  if (Array.isArray(data)) return data;
  if (data && Array.isArray(data.topics)) return data.topics;
  return [];
}

export async function getTopicCards(topicId: string): Promise<{ topic: Topic; cards: VocabCard[] }> {
  const res = await fetch(`/api/vocab/${topicId}`);
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Lỗi khi tải danh sách thẻ từ vựng');
  }
  return { topic: data.topic, cards: data.cards || [] };
}

export async function deleteTopic(topicId: string): Promise<void> {
  const res = await fetch(`/api/vocab/${topicId}`, {
    method: 'DELETE',
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Lỗi khi xóa chủ đề');
  }
}

export async function extractVideoVocab(
  youtube_url: string,
  title?: string,
  custom_transcript?: string,
  force_refresh?: boolean
): Promise<{ session: VideoSession; words: VideoWord[] }> {
  const res = await fetch('/api/video/extract', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ youtube_url, title, custom_transcript, force_refresh }),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Lỗi khi trích xuất từ vựng từ video');
  }
  return { session: data.session, words: data.words || [] };
}

export async function updateVideoSubtitles(
  sessionId: string,
  subtitles: SubtitleItem[]
): Promise<VideoSession> {
  const res = await fetch(`/api/video/sessions/${sessionId}/subtitles`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ subtitles }),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Lỗi khi cập nhật phụ đề');
  }
  return data.session;
}

export async function getVideoSessions(): Promise<VideoSession[]> {
  const res = await fetch('/api/video/sessions');
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Lỗi khi tải danh sách video');
  }
  return data.sessions || [];
}

export async function getVideoSession(sessionId: string): Promise<{ session: VideoSession; words: VideoWord[] }> {
  const res = await fetch(`/api/video/${sessionId}`);
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Lỗi khi tải chi tiết video');
  }
  return { session: data.session, words: data.words || [] };
}

export async function quickLookup(text: string, sourceLang?: string) {
  const res = await fetch('/api/translate/lookup', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, sourceLang }),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Lỗi tra cứu từ điển');
  }
  return data.data;
}

export async function autoFillCard(inputWord: string, existingFields?: Partial<VocabCard>): Promise<Partial<VocabCard>> {
  const res = await fetch('/api/vocab/autofill', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ inputWord, existingFields }),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Lỗi khi AI tự động điền thẻ từ vựng');
  }
  return data.data;
}

export async function createCustomCard(cardData: Partial<VocabCard> & { topicName?: string }): Promise<{ card: VocabCard; topic?: Topic }> {
  const res = await fetch('/api/vocab/cards', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(cardData),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Lỗi khi lưu thẻ từ vựng');
  }
  return { card: data.card, topic: data.topic };
}

export async function updateCard(cardId: string, updates: Partial<VocabCard>): Promise<VocabCard> {
  const res = await fetch(`/api/vocab/cards/${cardId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Lỗi khi cập nhật thẻ từ vựng');
  }
  return data.card;
}

export async function deleteCard(cardId: string): Promise<void> {
  const res = await fetch(`/api/vocab/cards/${cardId}`, {
    method: 'DELETE',
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Lỗi khi xóa thẻ từ vựng');
  }
}

export async function toggleCardLearned(cardId: string): Promise<VocabCard> {
  const res = await fetch(`/api/vocab/cards/${cardId}/toggle-learned`, {
    method: 'POST',
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Lỗi khi cập nhật trạng thái học');
  }
  return data.card;
}

export async function getAllNotebookCards(): Promise<{ cards: VocabCard[]; topics: Topic[] }> {
  const res = await fetch('/api/vocab/notebook/all');
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Lỗi khi tải danh sách từ vựng trong sổ tay');
  }
  return { cards: data.cards || [], topics: data.topics || [] };
}

export async function createTopic(name: string, level?: string): Promise<Topic> {
  const res = await fetch('/api/vocab/topics', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, level }),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Lỗi khi tạo sổ tay mới');
  }
  return data.topic;
}

export async function checkSentence(params: {
  targetWord: string;
  userSentence: string;
  language?: 'en' | 'zh' | 'ja';
  targetWordMeaning?: string;
}): Promise<SentenceCheckResult> {
  const res = await fetch('/api/vocab/check-sentence', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Lỗi khi kiểm tra câu với AI');
  }
  return data.result;
}


