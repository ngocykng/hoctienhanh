 CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      full_name TEXT,
      role TEXT DEFAULT 'user',
      status TEXT DEFAULT 'active',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS topics (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      level TEXT DEFAULT 'ALL',
      batch INTEGER DEFAULT 1,
      card_count INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS vocab_cards (
      id TEXT PRIMARY KEY,
      topic_id TEXT,
      word_en TEXT,
      ipa_en TEXT,
      word_zh TEXT,
      pinyin TEXT,
      word_ja TEXT,
      reading_ja TEXT,
      meaning_vi TEXT,
      example_en TEXT,
      example_zh TEXT,
      example_ja TEXT,
      example_meaning_vi TEXT,
      difficulty TEXT,
      learned INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (topic_id) REFERENCES topics(id)
  );