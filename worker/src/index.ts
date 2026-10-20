import { Hono } from 'hono';
import { cors } from 'hono/cors';
import bcrypt from 'bcryptjs';

type Bindings = {
  DB: D1Database;
  GEMINI_API_KEY: string;
  JWT_SECRET: string;
  APP_URL?: string;
};

const app = new Hono<{ Bindings: Bindings }>();
app.use('*', cors({
  origin: (origin, c) => origin === c.env.APP_URL ? origin : '',
  allowHeaders: ['Content-Type', 'Authorization'],
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
}));

const json = (c: any, body: unknown, status = 200) => c.json(body, status);
const id = (prefix: string) => `${prefix}-${crypto.randomUUID()}`;
const errorMessage = (error: unknown) => error instanceof Error ? error.message : 'Lỗi máy chủ.';

async function gemini(c: any, prompt: string): Promise<unknown> {
  if (!c.env.GEMINI_API_KEY) throw new Error('GEMINI_API_KEY chưa được cấu hình.');
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${c.env.GEMINI_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { responseMimeType: 'application/json' },
      }),
    },
  );
  if (!response.ok) throw new Error(`Gemini trả về HTTP ${response.status}.`);
  const body = await response.json() as { candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }> };
  const text = body.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error('Gemini không trả về dữ liệu.');
  return JSON.parse(text.replace(/^```json\s*|\s*```$/g, ''));
}

function tokenPayload(id: string, email: string, role: string) {
  return btoa(JSON.stringify({ userId: id, email, role, exp: Date.now() + 7 * 86400000 }));
}

app.get('/api/health', async (c) => {
  try {
    await c.env.DB.prepare('SELECT 1').first();
    return json(c, { status: 'ok', database: { connected: true } });
  } catch (error) {
    return json(c, { status: 'error', database: { connected: false }, message: errorMessage(error) }, 500);
  }
});

app.post('/api/auth/register', async (c) => {
  try {
    const body = await c.req.json<{ email?: string; password?: string; full_name?: string }>();
    const email = body.email?.trim().toLowerCase() || '';
    const password = body.password || '';
    if (!email || !password) return json(c, { error: 'Vui lòng nhập email và mật khẩu.' }, 400);
    if (password.length < 6) return json(c, { error: 'Mật khẩu phải có ít nhất 6 ký tự.' }, 400);
    const existing = await c.env.DB.prepare('SELECT id FROM users WHERE email = ?').bind(email).first();
    if (existing) return json(c, { error: 'Email này đã được đăng ký.' }, 409);
    const userId = id('user');
    await c.env.DB.prepare(
      'INSERT INTO users (id,email,password_hash,full_name) VALUES (?,?,?,?)',
    ).bind(userId, email, await bcrypt.hash(password, 10), body.full_name?.trim() || '').run();
    const user = { id: userId, email, full_name: body.full_name?.trim() || '', role: 'user' };
    return json(c, { success: true, token: tokenPayload(userId, email, 'user'), user }, 201);
  } catch (error) {
    return json(c, { error: errorMessage(error) }, 500);
  }
});

app.post('/api/auth/login', async (c) => {
  try {
    const body = await c.req.json<{ email?: string; password?: string }>();
    const user = await c.env.DB.prepare(
      'SELECT id,email,password_hash,full_name,role,status FROM users WHERE email = ?',
    ).bind(body.email?.trim().toLowerCase() || '').first<{
      id: string; email: string; password_hash: string; full_name: string; role: string; status: string;
    }>();
    if (!user || !(await bcrypt.compare(body.password || '', user.password_hash))) {
      return json(c, { error: 'Email hoặc mật khẩu không chính xác.' }, 401);
    }
    if (user.status !== 'active') return json(c, { error: 'Tài khoản đã bị khóa.' }, 403);
    return json(c, {
      success: true,
      token: tokenPayload(user.id, user.email, user.role),
      user: { id: user.id, email: user.email, full_name: user.full_name, role: user.role },
    });
  } catch (error) {
    return json(c, { error: errorMessage(error) }, 500);
  }
});

app.get('/api/vocab/topics', async (c) => {
  try {
    const result = await c.env.DB.prepare(`
      SELECT t.*, COUNT(v.id) AS card_count
      FROM topics t LEFT JOIN vocab_cards v ON v.topic_id = t.id
      GROUP BY t.id ORDER BY t.created_at DESC
    `).all();
    return json(c, { success: true, topics: result.results });
  } catch (error) {
    return json(c, { error: errorMessage(error) }, 500);
  }
});

app.post('/api/vocab/topics', async (c) => {
  try {
    const body = await c.req.json<{ name?: string; level?: string }>();
    if (!body.name?.trim()) return json(c, { error: 'Vui lòng nhập tên sổ tay / chủ đề.' }, 400);
    const topic = { id: id('topic'), name: body.name.trim(), level: body.level || 'ALL', created_at: new Date().toISOString(), card_count: 0 };
    await c.env.DB.prepare('INSERT INTO topics (id,name,level,created_at) VALUES (?,?,?,?)')
      .bind(topic.id, topic.name, topic.level, topic.created_at).run();
    return json(c, { success: true, topic }, 201);
  } catch (error) {
    return json(c, { error: errorMessage(error) }, 500);
  }
});

app.get('/api/vocab/notebook/all', async (c) => {
  const [cards, topics] = await Promise.all([
    c.env.DB.prepare('SELECT * FROM vocab_cards ORDER BY created_at DESC').all(),
    c.env.DB.prepare('SELECT t.*, COUNT(v.id) AS card_count FROM topics t LEFT JOIN vocab_cards v ON v.topic_id=t.id GROUP BY t.id ORDER BY t.created_at DESC').all(),
  ]);
  return json(c, { success: true, cards: cards.results, topics: topics.results });
});

app.get('/api/vocab/:topicId', async (c) => {
  const topicId = c.req.param('topicId');
  const topic = await c.env.DB.prepare('SELECT * FROM topics WHERE id = ?').bind(topicId).first();
  if (!topic) return json(c, { error: 'Không tìm thấy chủ đề.' }, 404);
  const cards = await c.env.DB.prepare('SELECT * FROM vocab_cards WHERE topic_id = ? ORDER BY created_at').bind(topicId).all();
  return json(c, { success: true, topic, cards: cards.results });
});

app.delete('/api/vocab/:topicId', async (c) => {
  await c.env.DB.prepare('DELETE FROM vocab_cards WHERE topic_id = ?').bind(c.req.param('topicId')).run();
  await c.env.DB.prepare('DELETE FROM topics WHERE id = ?').bind(c.req.param('topicId')).run();
  return json(c, { success: true });
});

const cardColumns = ['word_en', 'ipa_en', 'word_zh', 'pinyin', 'word_ja', 'reading_ja', 'meaning_vi', 'example_en', 'example_zh', 'example_ja', 'example_meaning_vi', 'difficulty', 'learned'];

app.post('/api/vocab/cards', async (c) => {
  try {
    const body = await c.req.json<Record<string, string | boolean | undefined> & { topicName?: string; topic_id?: string }>();
    if (!body.word_en && !body.word_zh && !body.word_ja && !body.meaning_vi) return json(c, { error: 'Cần ít nhất một trường từ vựng.' }, 400);
    let topicId = body.topic_id;
    if (!topicId || !(await c.env.DB.prepare('SELECT id FROM topics WHERE id=?').bind(topicId).first())) {
      const name = body.topicName?.trim() || 'Sổ tay từ vựng của tôi';
      const existing = await c.env.DB.prepare('SELECT id FROM topics WHERE lower(name)=lower(?)').bind(name).first<{ id: string }>();
      topicId = existing?.id || id('topic');
      if (!existing) await c.env.DB.prepare('INSERT INTO topics (id,name,level) VALUES (?,?,?)').bind(topicId, name, body.difficulty || 'ALL').run();
    }
    const cardId = id('card');
    const values = cardColumns.map((column) => body[column] ?? (column === 'learned' ? 0 : ''));
    await c.env.DB.prepare(`INSERT INTO vocab_cards (id,topic_id,${cardColumns.join(',')}) VALUES (?,?${',?'.repeat(cardColumns.length)})`)
      .bind(cardId, topicId, ...values).run();
    const card = await c.env.DB.prepare('SELECT * FROM vocab_cards WHERE id=?').bind(cardId).first();
    const topic = await c.env.DB.prepare('SELECT * FROM topics WHERE id=?').bind(topicId).first();
    return json(c, { success: true, card, topic }, 201);
  } catch (error) {
    return json(c, { error: errorMessage(error) }, 500);
  }
});

app.put('/api/vocab/cards/:cardId', async (c) => {
  const body = await c.req.json<Record<string, unknown>>();
  const entries = Object.entries(body).filter(([key]) => cardColumns.includes(key));
  if (!entries.length) return json(c, { error: 'Không có trường cần cập nhật.' }, 400);
  const set = entries.map(([key]) => `${key}=?`).join(',');
  const result = await c.env.DB.prepare(`UPDATE vocab_cards SET ${set} WHERE id=?`)
    .bind(...entries.map(([, value]) => value), c.req.param('cardId')).run();
  if (!result.meta.changes) return json(c, { error: 'Không tìm thấy thẻ từ vựng.' }, 404);
  return json(c, { success: true, card: await c.env.DB.prepare('SELECT * FROM vocab_cards WHERE id=?').bind(c.req.param('cardId')).first() });
});

app.delete('/api/vocab/cards/:cardId', async (c) => {
  const result = await c.env.DB.prepare('DELETE FROM vocab_cards WHERE id=?').bind(c.req.param('cardId')).run();
  return result.meta.changes ? json(c, { success: true }) : json(c, { error: 'Không tìm thấy thẻ từ vựng.' }, 404);
});

app.post('/api/vocab/cards/:cardId/toggle-learned', async (c) => {
  await c.env.DB.prepare('UPDATE vocab_cards SET learned=CASE learned WHEN 0 THEN 1 ELSE 0 END WHERE id=?').bind(c.req.param('cardId')).run();
  const card = await c.env.DB.prepare('SELECT * FROM vocab_cards WHERE id=?').bind(c.req.param('cardId')).first();
  return card ? json(c, { success: true, card }) : json(c, { error: 'Không tìm thấy thẻ từ vựng.' }, 404);
});

app.post('/api/vocab/autofill', async (c) => {
  try {
    const body = await c.req.json<{ inputWord?: string; existingFields?: unknown }>();
    if (!body.inputWord?.trim()) return json(c, { error: 'Vui lòng nhập từ cần điền.' }, 400);
    return json(c, { success: true, data: await gemini(c, `Trả về JSON thông tin từ vựng đa ngôn ngữ cho "${body.inputWord}". Các trường: word_en, ipa_en, word_zh, pinyin, word_ja, reading_ja, meaning_vi, example_en, example_zh, example_ja, example_meaning_vi, difficulty.`) });
  } catch (error) { return json(c, { error: errorMessage(error) }, 500); }
});

app.post('/api/translate/lookup', async (c) => {
  try {
    const body = await c.req.json<{ text?: string; sourceLang?: string }>();
    if (!body.text) return json(c, { error: 'Text required' }, 400);
    return json(c, { success: true, data: await gemini(c, `Phân tích "${body.text}" (${body.sourceLang || 'auto'}). Trả về JSON với word_en, word_zh, pinyin, meaning_vi, example_sentence.`) });
  } catch (error) { return json(c, { error: errorMessage(error) }, 500); }
});

app.post('/api/vocab/check-sentence', async (c) => {
  try {
    const body = await c.req.json();
    if (!body.targetWord || !body.userSentence) return json(c, { error: 'Thiếu từ mục tiêu hoặc câu cần kiểm tra.' }, 400);
    return json(c, { success: true, result: await gemini(c, `Đánh giá câu "${body.userSentence}" dùng từ "${body.targetWord}". Trả JSON gồm isCorrect, score, wordUsedCorrectly, overallFeedback, errors, improvedSentence, vietnameseMeaning, betterAlternatives.`) });
  } catch (error) { return json(c, { error: errorMessage(error) }, 500); }
});

app.post('/api/vocab/generate', async (c) => {
  try {
    const body = await c.req.json<{ topic?: string; level?: string; excludeWords?: string[] }>();
    if (!body.topic?.trim()) return json(c, { error: 'Vui lòng cung cấp chủ đề hợp lệ.' }, 400);
    const items = await gemini(c, `Tạo mảng JSON 15 từ vựng cho chủ đề "${body.topic}" trình độ ${body.level || 'ALL'}. Mỗi item có word_en, ipa_en, word_zh, pinyin, word_ja, reading_ja, meaning_vi, example_en, example_zh, example_ja, example_meaning_vi, difficulty. Không lặp các từ: ${(body.excludeWords || []).slice(0, 50).join(', ')}.`) as Array<Record<string, string>>;
    const topic = { id: id('topic'), name: body.topic.trim(), level: body.level || 'ALL', batch: 1, created_at: new Date().toISOString(), card_count: items.length };
    await c.env.DB.prepare('INSERT INTO topics (id,name,level,batch,card_count,created_at) VALUES (?,?,?,?,?,?)').bind(topic.id, topic.name, topic.level, topic.batch, topic.card_count, topic.created_at).run();
    for (const item of items) {
      const cardId = id('card');
      await c.env.DB.prepare(`INSERT INTO vocab_cards (id,topic_id,word_en,ipa_en,word_zh,pinyin,word_ja,reading_ja,meaning_vi,example_en,example_zh,example_ja,example_meaning_vi,difficulty) VALUES (${Array(14).fill('?').join(',')})`).bind(cardId, topic.id, item.word_en || '', item.ipa_en || '', item.word_zh || '', item.pinyin || '', item.word_ja || '', item.reading_ja || '', item.meaning_vi || '', item.example_en || '', item.example_zh || '', item.example_ja || '', item.example_meaning_vi || '', item.difficulty || body.level || 'B1').run();
    }
    const cards = await c.env.DB.prepare('SELECT * FROM vocab_cards WHERE topic_id=?').bind(topic.id).all();
    return json(c, { success: true, topic, cards: cards.results });
  } catch (error) { return json(c, { error: errorMessage(error) }, 500); }
});

app.all('/api/video/*', (c) => json(c, { error: 'Video API chưa được chuyển sang Cloudflare Worker. Hãy dùng custom transcript sau khi migration video hoàn tất.' }, 501));

export default app;
