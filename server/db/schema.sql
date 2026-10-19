-- ============================================================
-- SCHEMA POSTGRESQL CHO DỰ ÁN HỌC TIẾNG ANH (hoctienganh)
-- Hỗ trợ đa ngôn ngữ: Tiếng Anh, Tiếng Trung, Tiếng Nhật giải nghĩa Tiếng Việt
-- ============================================================

-- 0. TÀI KHOẢN NGƯỜI DÙNG
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(100) PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(100) NOT NULL DEFAULT '',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 1. BẢNG CHỦ ĐỀ TỪ VỰNG (topics)
CREATE TABLE IF NOT EXISTS topics (
    id VARCHAR(100) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    level VARCHAR(20) DEFAULT 'ALL',
    batch INTEGER DEFAULT 1,
    card_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. BẢNG THẺ TỪ VỰNG CHI TIẾT (vocab_cards)
CREATE TABLE IF NOT EXISTS vocab_cards (
    id VARCHAR(100) PRIMARY KEY,
    topic_id VARCHAR(100) REFERENCES topics(id) ON DELETE CASCADE,
    word_en VARCHAR(255) NOT NULL,
    ipa_en VARCHAR(255),
    word_zh VARCHAR(255) NOT NULL,
    pinyin VARCHAR(255),
    word_ja VARCHAR(255),
    reading_ja VARCHAR(255),
    meaning_vi TEXT NOT NULL,
    example_en TEXT,
    example_zh TEXT,
    example_ja TEXT,
    example_meaning_vi TEXT,
    difficulty VARCHAR(20),
    learned BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. BẢNG PHIÊN HỌC QUA VIDEO YOUTUBE (video_sessions)
CREATE TABLE IF NOT EXISTS video_sessions (
    id VARCHAR(100) PRIMARY KEY,
    youtube_url TEXT NOT NULL,
    video_id VARCHAR(100) NOT NULL,
    title TEXT,
    channel_title TEXT,
    duration_sec INTEGER DEFAULT 0,
    language VARCHAR(20) DEFAULT 'en',
    words_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. BẢNG PHỤ ĐỀ VIDEO THEO MỐC THỜI GIAN (subtitles)
CREATE TABLE IF NOT EXISTS subtitles (
    id VARCHAR(100) PRIMARY KEY,
    session_id VARCHAR(100) REFERENCES video_sessions(id) ON DELETE CASCADE,
    start FLOAT NOT NULL,
    duration FLOAT DEFAULT 0,
    text_original TEXT NOT NULL,
    text_vi TEXT NOT NULL,
    pinyin VARCHAR(255),
    reading_ja VARCHAR(255)
);

-- 5. BẢNG TỪ VỰNG TRÍCH XUẤT TỪ VIDEO (video_words)
CREATE TABLE IF NOT EXISTS video_words (
    id VARCHAR(100) PRIMARY KEY,
    session_id VARCHAR(100) REFERENCES video_sessions(id) ON DELETE CASCADE,
    word VARCHAR(255) NOT NULL,
    language VARCHAR(20) CHECK (language IN ('en', 'zh', 'ja', 'mixed')),
    ipa_en VARCHAR(255),
    pinyin VARCHAR(255),
    reading_ja VARCHAR(255),
    timestamp_sec FLOAT NOT NULL,
    meaning_vi TEXT NOT NULL,
    context_sentence TEXT,
    difficulty VARCHAR(20)
);

-- ============================================================
-- CÁC CHỈ MỤC (INDEXES) TỐI ƯU TỐC ĐỘ TRUY VẤN
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_vocab_cards_topic ON vocab_cards(topic_id);
CREATE INDEX IF NOT EXISTS idx_vocab_cards_learned ON vocab_cards(learned);
CREATE INDEX IF NOT EXISTS idx_subtitles_session ON subtitles(session_id);
CREATE INDEX IF NOT EXISTS idx_video_words_session ON video_words(session_id);
