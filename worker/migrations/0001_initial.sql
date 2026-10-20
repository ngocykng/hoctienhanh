CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  full_name TEXT NOT NULL DEFAULT '',
  role TEXT NOT NULL DEFAULT 'user',
  status TEXT NOT NULL DEFAULT 'active',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS topics (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  level TEXT NOT NULL DEFAULT 'ALL',
  batch INTEGER NOT NULL DEFAULT 1,
  card_count INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS vocab_cards (
  id TEXT PRIMARY KEY,
  topic_id TEXT NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
  word_en TEXT NOT NULL DEFAULT '',
  ipa_en TEXT,
  word_zh TEXT NOT NULL DEFAULT '',
  pinyin TEXT,
  word_ja TEXT,
  reading_ja TEXT,
  meaning_vi TEXT NOT NULL DEFAULT '',
  example_en TEXT,
  example_zh TEXT,
  example_ja TEXT,
  example_meaning_vi TEXT,
  difficulty TEXT,
  learned INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS video_sessions (
  id TEXT PRIMARY KEY,
  youtube_url TEXT NOT NULL,
  video_id TEXT NOT NULL,
  title TEXT,
  channel_title TEXT,
  duration_sec INTEGER NOT NULL DEFAULT 0,
  language TEXT NOT NULL DEFAULT 'en',
  words_count INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS subtitles (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL REFERENCES video_sessions(id) ON DELETE CASCADE,
  start REAL NOT NULL,
  duration REAL NOT NULL DEFAULT 0,
  text_original TEXT NOT NULL,
  text_vi TEXT NOT NULL,
  pinyin TEXT,
  reading_ja TEXT
);

CREATE TABLE IF NOT EXISTS video_words (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL REFERENCES video_sessions(id) ON DELETE CASCADE,
  word TEXT NOT NULL,
  language TEXT NOT NULL,
  ipa_en TEXT,
  pinyin TEXT,
  reading_ja TEXT,
  timestamp_sec REAL NOT NULL,
  meaning_vi TEXT NOT NULL,
  context_sentence TEXT,
  difficulty TEXT
);

CREATE INDEX IF NOT EXISTS idx_cards_topic ON vocab_cards(topic_id);
CREATE INDEX IF NOT EXISTS idx_subtitles_session ON subtitles(session_id);
CREATE INDEX IF NOT EXISTS idx_video_words_session ON video_words(session_id);
