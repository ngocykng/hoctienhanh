import { Hono } from 'hono';
import { cors } from 'hono/cors';
import bcrypt from 'bcryptjs';
import pg from 'pg';

const { Client } = pg;

type Bindings = {
  HYPERDRIVE: { connectionString: string };
  GEMINI_API_KEY: string;
  JWT_SECRET: string;
  APP_URL?: string;
};

const app = new Hono<{ Bindings: Bindings }>();
app.use('*', cors({
  origin: (origin, c) => {
    if (!origin) return '*';
    if (origin === c.env.APP_URL || origin.endsWith('.pages.dev')) return origin;
    return c.env.APP_URL || origin;
  },
  allowHeaders: ['Content-Type', 'Authorization'],
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
}));

const json = (c: any, body: unknown, status = 200) => c.json(body, status);
const id = (prefix: string) => `${prefix}-${crypto.randomUUID()}`;
const errorMessage = (error: unknown) => error instanceof Error ? error.message : 'Lỗi máy chủ.';

// Helper to get DB client
async function getDbClient(c: any) {
  const connectionString = c.env.HYPERDRIVE?.connectionString || process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error('Database connection string not found. Please configure HYPERDRIVE binding or DATABASE_URL environment variable.');
  }

  const client = new Client({
    connectionString: connectionString,
  });
  await client.connect();
  return client;
}

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

app.get('/', (c) => json(c, {
  name: 'DUOVOCAB.AI API',
  status: 'ok',
  health: '/api/health',
}));

app.get('/api/health', async (c) => {
  let client;
  try {
    client = await getDbClient(c);
    await client.query('SELECT 1');
    return json(c, { status: 'ok', database: { connected: true } });
  } catch (error) {
    return json(c, { status: 'error', database: { connected: false }, message: errorMessage(error) }, 500);
  } finally {
    if (client) await client.end();
  }
});

app.post('/api/auth/register', async (c) => {
  let client;
  try {
    const body = await c.req.json<{ email?: string; password?: string; full_name?: string }>();
    const email = body.email?.trim().toLowerCase() || '';
    const password = body.password || '';
    if (!email || !password) return json(c, { error: 'Vui lòng nhập email và mật khẩu.' }, 400);
    if (password.length < 6) return json(c, { error: 'Mật khẩu phải có ít nhất 6 ký tự.' }, 400);

    client = await getDbClient(c);
    const existing = await client.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existing.rows.length > 0) return json(c, { error: 'Email này đã được đăng ký.' }, 409);

    const userId = id('user');
    await client.query(
      'INSERT INTO users (id,email,password_hash,full_name) VALUES ($1,$2,$3,$4)',
      [userId, email, await bcrypt.hash(password, 10), body.full_name?.trim() || ''],
    );

    const user = { id: userId, email, full_name: body.full_name?.trim() || '', role: 'user' };
    return json(c, { success: true, token: tokenPayload(userId, email, 'user'), user }, 201);
  } catch (error) {
    return json(c, { error: errorMessage(error) }, 500);
  } finally {
    if (client) await client.end();
  }
});

app.post('/api/auth/login', async (c) => {
  let client;
  try {
    const body = await c.req.json<{ email?: string; password?: string }>();
    client = await getDbClient(c);
    const result = await client.query(
      'SELECT id,email,password_hash,full_name,role,status FROM users WHERE email = $1',
      [body.email?.trim().toLowerCase() || ''],
    );
    const user = result.rows[0];

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
  } finally {
    if (client) await client.end();
  }
});

app.get('/api/vocab/topics', async (c) => {
  let client;
  try {
    client = await getDbClient(c);
    const result = await client.query(`
      SELECT t.*, COUNT(v.id) AS card_count
      FROM topics t LEFT JOIN vocab_cards v ON v.topic_id = t.id
      GROUP BY t.id ORDER BY t.created_at DESC
    `);
    return json(c, { success: true, topics: result.rows });
  } catch (error) {
    return json(c, { error: errorMessage(error) }, 500);
  } finally {
    if (client) await client.end();
  }
});

app.post('/api/vocab/topics', async (c) => {
  let client;
  try {
    const body = await c.req.json<{ name?: string; level?: string }>();
    if (!body.name?.trim()) return json(c, { error: 'Vui lòng nhập tên sổ tay / chủ đề.' }, 400);
    const topic = { id: id('topic'), name: body.name.trim(), level: body.level || 'ALL', created_at: new Date().toISOString(), card_count: 0 };

    client = await getDbClient(c);
    await client.query('INSERT INTO topics (id,name,level,created_at) VALUES ($1,$2,$3,$4)',
      [topic.id, topic.name, topic.level, topic.created_at]);

    return json(c, { success: true, topic }, 201);
  } catch (error) {
    return json(c, { error: errorMessage(error) }, 500);
  } finally {
    if (client) await client.end();
  }
});

app.get('/api/vocab/notebook/all', async (c) => {
  let client;
  try {
    client = await getDbClient(c);
    const [cardsResult, topicsResult] = await Promise.all([
      client.query('SELECT * FROM vocab_cards ORDER BY created_at DESC'),
      client.query('SELECT t.*, COUNT(v.id) AS card_count FROM topics t LEFT JOIN vocab_cards v ON v.topic_id=t.id GROUP BY t.id ORDER BY t.created_at DESC'),
    ]);
    return json(c, { success: true, cards: cardsResult.rows, topics: topicsResult.rows });
  } catch (error) {
    return json(c, { error: errorMessage(error) }, 500);
  } finally {
    if (client) await client.end();
  }
});

app.get('/api/vocab/:topicId', async (c) => {
  let client;
  try {
    const topicId = c.req.param('topicId');
    client = await getDbClient(c);
    const topicRes = await client.query('SELECT * FROM topics WHERE id = $1', [topicId]);
    const topic = topicRes.rows[0];
    if (!topic) return json(c, { error: 'Không tìm thấy chủ đề.' }, 404);

    const cardsRes = await client.query('SELECT * FROM vocab_cards WHERE topic_id = $1 ORDER BY created_at', [topicId]);
    return json(c, { success: true, topic, cards: cardsRes.rows });
  } catch (error) {
    return json(c, { error: errorMessage(error) }, 500);
  } finally {
    if (client) await client.end();
  }
});

app.delete('/api/vocab/:topicId', async (c) => {
  let client;
  try {
    const topicId = c.req.param('topicId');
    client = await getDbClient(c);
    await client.query('DELETE FROM vocab_cards WHERE topic_id = $1', [topicId]);
    await client.query('DELETE FROM topics WHERE id = $1', [topicId]);
    return json(c, { success: true });
  } catch (error) {
    return json(c, { error: errorMessage(error) }, 500);
  } finally {
    if (client) await client.end();
  }
});

const cardColumns = ['word_en', 'ipa_en', 'word_zh', 'pinyin', 'word_ja', 'reading_ja', 'meaning_vi', 'example_en', 'example_zh', 'example_ja', 'example_meaning_vi', 'difficulty', 'learned'];

app.post('/api/vocab/cards', async (c) => {
  let client;
  try {
    const body = await c.req.json<Record<string, string | boolean | undefined> & { topicName?: string; topic_id?: string }>();
    if (!body.word_en && !body.word_zh && !body.word_ja && !body.meaning_vi) return json(c, { error: 'Cần ít nhất một trường từ vựng.' }, 400);

    let topicId = body.topic_id;
    client = await getDbClient(c);

    if (!topicId || !(await client.query('SELECT id FROM topics WHERE id=$1', [topicId])).rows.length) {
      const name = body.topicName?.trim() || 'Sổ tay từ vựng của tôi';
      const existingRes = await client.query('SELECT id FROM topics WHERE lower(name)=lower($1)', [name]);
      topicId = existingRes.rows[0]?.id || id('topic');
      if (!existingRes.rows.length) {
        await client.query('INSERT INTO topics (id,name,level) VALUES ($1,$2,$3)', [topicId, name, body.difficulty || 'ALL']);
      }
    }

    const cardId = id('card');
    const values = cardColumns.map((column) => body[column] ?? (column === 'learned' ? 0 : ''));
    const placeholders = cardColumns.map((_, i) => `$${i + 3}`).join(',');
    await client.query(`INSERT INTO vocab_cards (id,topic_id,${cardColumns.join(',')}) VALUES ($1,$2,${placeholders})`,
      [cardId, topicId, ...values]);

    const cardRes = await client.query('SELECT * FROM vocab_cards WHERE id=$1', [cardId]);
    const topicRes = await client.query('SELECT * FROM topics WHERE id=$1', [topicId]);

    return json(c, { success: true, card: cardRes.rows[0], topic: topicRes.rows[0] }, 201);
  } catch (error) {
    return json(c, { error: errorMessage(error) }, 500);
  } finally {
    if (client) await client.end();
  }
});

app.put('/api/vocab/cards/:cardId', async (c) => {
  let client;
  try {
    const body = await c.req.json<Record<string, unknown>>();
    const entries = Object.entries(body).filter(([key]) => cardColumns.includes(key));
    if (!entries.length) return json(c, { error: 'Không có trường cần cập nhật.' }, 400);

    const setClause = entries.map(([key], i) => `${key}=$${i + 1}`).join(',');
    const values = entries.map(([, value]) => value);

    client = await getDbClient(c);
    const result = await client.query(`UPDATE vocab_cards SET ${setClause} WHERE id=$${values.length + 1}`,
      [...values, c.req.param('cardId')]);

    if (result.rowCount === 0) return json(c, { error: 'Không tìm thấy thẻ từ vựng.' }, 404);

    const cardRes = await client.query('SELECT * FROM vocab_cards WHERE id=$1', [c.req.param('cardId')]);
    return json(c, { success: true, card: cardRes.rows[0] });
  } catch (error) {
    return json(c, { error: errorMessage(error) }, 500);
  } finally {
    if (client) await client.end();
  }
});

app.delete('/api/vocab/cards/:cardId', async (c) => {
  let client;
  try {
    client = await getDbClient(c);
    const result = await client.query('DELETE FROM vocab_cards WHERE id=$1', [c.req.param('cardId')]);
    return result.rowCount ? json(c, { success: true }) : json(c, { error: 'Không tìm thấy thẻ từ vựng.' }, 404);
  } catch (error) {
    return json(c, { error: errorMessage(error) }, 500);
  } finally {
    if (client) await client.end();
  }
});

app.post('/api/vocab/cards/:cardId/toggle-learned', async (c) => {
  let client;
  try {
    client = await getDbClient(c);
    await client.query('UPDATE vocab_cards SET learned=CASE learned WHEN 0 THEN 1 ELSE 0 END WHERE id=$1', [c.req.param('cardId')]);
    const cardRes = await client.query('SELECT * FROM vocab_cards WHERE id=$1', [c.req.param('cardId')]);
    const card = cardRes.rows[0];
    return card ? json(c, { success: true, card }) : json(c, { error: 'Không tìm thấy thẻ từ vựng.' }, 404);
  } catch (error) {
    return json(c, { error: errorMessage(error) }, 500);
  } finally {
    if (client) await client.end();
  }
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
  let client;
  try {
    const body = await c.req.json<{ topic?: string; level?: string; excludeWords?: string[] }>();
    if (!body.topic?.trim()) return json(c, { error: 'Vui lòng cung cấp chủ đề hợp lệ.' }, 400);

    const items = await gemini(c, `Tạo mảng JSON 15 từ vựng cho chủ đề "${body.topic}" trình độ ${body.level || 'ALL'}. Mỗi item có word_en, ipa_en, word_zh, pinyin, word_ja, reading_ja, meaning_vi, example_en, example_zh, example_ja, example_meaning_vi, difficulty. Không lặp các từ: ${(body.excludeWords || []).slice(0, 50).join(', ')}.`) as Array<Record<string, string>>;

    const topic = { id: id('topic'), name: body.topic.trim(), level: body.level || 'ALL', batch: 1, created_at: new Date().toISOString(), card_count: items.length };

    client = await getDbClient(c);
    await client.query('INSERT INTO topics (id,name,level,batch,card_count,created_at) VALUES ($1,$2,$3,$4,$5,$6)',
      [topic.id, topic.name, topic.level, topic.batch, topic.card_count, topic.created_at]);

    for (const item of items) {
      const cardId = id('card');
      await client.query(`INSERT INTO vocab_cards (id,topic_id,word_en,ipa_en,word_zh,pinyin,word_ja,reading_ja,meaning_vi,example_en,example_zh,example_ja,example_meaning_vi,difficulty) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)`,
        [cardId, topic.id, item.word_en || '', item.ipa_en || '', item.word_zh || '', item.pinyin || '', item.word_ja || '', item.reading_ja || '', item.meaning_vi || '', item.example_en || '', item.example_zh || '', item.example_ja || '', item.example_meaning_vi || '', item.difficulty || body.level || 'B1']);
    }

    const cardsRes = await client.query('SELECT * FROM vocab_cards WHERE topic_id=$1', [topic.id]);
    return json(c, { success: true, topic, cards: cardsRes.rows });
  } catch (error) { return json(c, { error: errorMessage(error) }, 500); } finally {
    if (client) await client.end();
  }
});

app.all('/api/video/*', (c) => json(c, { error: 'Video API chưa được chuyển sang Cloudflare Worker. Hãy dùng custom transcript sau khi migration video hoàn tất.' }, 501));

app.notFound((c) => json(c, { error: 'API route không tồn tại.' }, 404));

export default app;
