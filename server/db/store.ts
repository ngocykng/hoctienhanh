import { Topic, VocabCard, VideoSession, VideoWord } from '../../src/types/index.ts';
import { pool } from './pool';
import { v4 as uuidv4 } from 'uuid';

class Database {
  // Topics
  async getTopics(): Promise<Topic[]> {
    const result = await pool.query(`
      SELECT t.*,
      (SELECT COUNT(*) FROM vocab_cards c WHERE c.topic_id = t.id) as card_count
      FROM topics t
      ORDER BY created_at DESC
    `);
    return result.rows;
  }

  async getTopic(id: string): Promise<Topic | undefined> {
    const result = await pool.query('SELECT * FROM topics WHERE id = $1', [id]);
    return result.rows[0];
  }

  async addTopic(topic: Partial<Topic>): Promise<Topic> {
    const id = topic.id || `topic-${uuidv4()}`;
    const name = topic.name;
    const level = topic.level || 'ALL';
    const createdAt = topic.created_at || new Date().toISOString();

    await pool.query(
      'INSERT INTO topics (id, name, level, created_at) VALUES ($1, $2, $3, $4)',
      [id, name, level, createdAt]
    );

    return {
      id,
      name,
      level,
      created_at: createdAt,
      card_count: 0,
    };
  }

  async deleteTopic(id: string): Promise<boolean> {
    await pool.query('DELETE FROM vocab_cards WHERE topic_id = $1', [id]);
    const result = await pool.query('DELETE FROM topics WHERE id = $1', [id]);
    return result.rowCount !== null && result.rowCount > 0;
  }

  // Cards
  async getCardsByTopic(topicId: string): Promise<VocabCard[]> {
    const result = await pool.query('SELECT * FROM vocab_cards WHERE topic_id = $1', [topicId]);
    return result.rows;
  }

  async addCards(cards: VocabCard[]): Promise<void> {
    for (const card of cards) {
      await pool.query(
        `INSERT INTO vocab_cards (id, topic_id, word_en, ipa_en, word_zh, pinyin, word_ja, reading_ja, meaning_vi, example_en, example_zh, example_ja, example_meaning_vi, difficulty, learned)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
         ON CONFLICT (id) DO UPDATE SET
         word_en = EXCLUDED.word_en, meaning_vi = EXCLUDED.meaning_vi, learned = EXCLUDED.learned`,
        [card.id, card.topic_id, card.word_en, card.ipa_en, card.word_zh, card.pinyin, card.word_ja, card.reading_ja, card.meaning_vi, card.example_en, card.example_zh, card.example_ja, card.example_meaning_vi, card.difficulty, card.learned]
      );
    }
  }

  async addCard(card: VocabCard): Promise<VocabCard> {
    const id = card.id || `card-${uuidv4()}`;
    await pool.query(
      `INSERT INTO vocab_cards (id, topic_id, word_en, ipa_en, word_zh, pinyin, word_ja, reading_ja, meaning_vi, example_en, example_zh, example_ja, example_meaning_vi, difficulty, learned)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
       ON CONFLICT (id) DO UPDATE SET
       word_en = EXCLUDED.word_en, meaning_vi = EXCLUDED.meaning_vi, learned = EXCLUDED.learned`,
      [id, card.topic_id, card.word_en, card.ipa_en, card.word_zh, card.pinyin, card.word_ja, card.reading_ja, card.meaning_vi, card.example_en, card.example_zh, card.example_ja, card.example_meaning_vi, card.difficulty, card.learned]
    );
    return { ...card, id };
  }

  async updateCard(cardId: string, updates: Partial<VocabCard>): Promise<VocabCard | null> {
    const fields = Object.keys(updates).filter(k => k !== 'id');
    if (fields.length === 0) return null;

    const setClause = fields.map((f, i) => `${f} = $${i + 2}`).join(', ');
    const values = [cardId, ...fields.map(f => (updates as any)[f])];

    const result = await pool.query(
      `UPDATE vocab_cards SET ${setClause} WHERE id = $1 RETURNING *`,
      values
    );
    return result.rows[0];
  }

  async deleteCard(cardId: string): Promise<boolean> {
    const result = await pool.query('DELETE FROM vocab_cards WHERE id = $1', [cardId]);
    return result.rowCount !== null && result.rowCount > 0;
  }

  async toggleCardLearned(cardId: string): Promise<VocabCard | null> {
    const result = await pool.query(
      'UPDATE vocab_cards SET learned = NOT learned WHERE id = $1 RETURNING *',
      [cardId]
    );
    return result.rows[0];
  }

  async getAllCards(): Promise<VocabCard[]> {
    const result = await pool.query('SELECT * FROM vocab_cards');
    return result.rows;
  }

  // Video Sessions
  async getVideoSessions(): Promise<VideoSession[]> {
    const result = await pool.query('SELECT * FROM video_sessions');
    const sessions = result.rows;

    for (const s of sessions) {
      const wordRes = await pool.query('SELECT COUNT(*) FROM video_words WHERE session_id = $1', [s.id]);
      s.words_count = parseInt(wordRes.rows[0].count);
    }
    return sessions;
  }

  async getVideoSession(id: string): Promise<VideoSession | undefined> {
    const result = await pool.query('SELECT * FROM video_sessions WHERE id = $1 OR video_id = $1', [id]);
    return result.rows[0];
  }

  async addVideoSession(session: VideoSession): Promise<VideoSession> {
    const id = session.id || `session-${uuidv4()}`;
    await pool.query(
      'INSERT INTO video_sessions (id, youtube_url, video_id, title, duration_sec, language, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7) ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title',
      [id, session.youtube_url, session.video_id, session.title, session.duration_sec, session.language, session.created_at]
    );
    return { ...session, id };
  }

  async getVideoWords(sessionId: string): Promise<VideoWord[]> {
    const result = await pool.query('SELECT * FROM video_words WHERE session_id = $1 ORDER BY timestamp_sec ASC', [sessionId]);
    return result.rows;
  }

  async addVideoWords(words: VideoWord[]): Promise<void> {
    for (const word of words) {
      await pool.query(
        `INSERT INTO video_words (id, session_id, word, language, ipa_en, timestamp_sec, meaning_vi, context_sentence, difficulty)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         ON CONFLICT (id) DO UPDATE SET meaning_vi = EXCLUDED.meaning_vi`,
        [word.id, word.session_id, word.word, word.language, word.ipa_en, word.timestamp_sec, word.meaning_vi, word.context_sentence, word.difficulty]
      );
    }
  }

  async updateVideoSubtitles(sessionId: string, subtitles: any[]): Promise<VideoSession | null> {
    // Giả định subtitles được lưu trong cột JSONB hoặc bảng riêng.
    // Tạm thời cập nhật session để đánh dấu.
    const result = await pool.query('UPDATE video_sessions SET updated_at = NOW() WHERE id = $1 RETURNING *', [sessionId]);
    return result.rows[0];
  }

  async updateVideoWords(sessionId: string, words: VideoWord[]): Promise<VideoWord[]> {
    await pool.query('DELETE FROM video_words WHERE session_id = $1', [sessionId]);
    await this.addVideoWords(words);
    return words;
  }
}

export const db = new Database();
