import { Request, Response } from 'express';
import { extractYouTubeVideoId, fetchYouTubeTranscript, cleanTranscriptText, mergeTranscriptFragments } from './transcript.service.ts';
import { extractVocabFromTranscript } from './word-extractor.service.ts';
import { db } from '../../db/store.ts';
import { VideoSession, VideoWord, SubtitleItem, VideoTranscriptItem } from '../../../src/types/index.ts';

export async function handleExtractVideoVocab(req: Request, res: Response) {
  try {
    const { youtube_url, custom_transcript, title, force_refresh } = req.body;
    if (!youtube_url) {
      return res.status(400).json({ error: 'Vui lòng cung cấp link video YouTube.' });
    }

    const videoId = extractYouTubeVideoId(youtube_url);
    if (!videoId) {
      return res.status(400).json({ error: 'Link YouTube không hợp lệ. Vui lòng kiểm tra lại URL.' });
    }

    // Check if session already exists in DB (unless force_refresh requested)
    const existingSession = db.getVideoSession(videoId);

    if (!force_refresh && existingSession && !custom_transcript && existingSession.subtitles && existingSession.subtitles.length > 0) {
      const existingWords = db.getVideoWords(existingSession.id);
      if (existingWords && existingWords.length > 0) {
        return res.json({
          success: true,
          session: existingSession,
          words: existingWords,
          cached: true,
        });
      }
    }

    let transcriptItems: VideoTranscriptItem[] = [];
    let fetchedTitle: string | undefined = title;
    let authorName: string | undefined;

    if (custom_transcript && typeof custom_transcript === 'string') {
      // Split user custom transcript by lines or sentences
      const lines = custom_transcript
        .split('\n')
        .map((l) => l.trim())
        .filter(Boolean);

      const parsedItems: VideoTranscriptItem[] = lines.map((line, idx) => ({
        text: cleanTranscriptText(line),
        start: idx * 6.0,
        duration: 5.5,
      }));

      transcriptItems = mergeTranscriptFragments(parsedItems);
    } else {
      const meta = await fetchYouTubeTranscript(videoId);
      transcriptItems = meta.transcript;
      if (!fetchedTitle && meta.title) {
        fetchedTitle = meta.title;
      }
      authorName = meta.author_name;
    }

    const videoTitle = fetchedTitle || `YouTube Video (${videoId})`;
    const extractionResult = await extractVocabFromTranscript(transcriptItems, {
      title: videoTitle,
      videoId,
      author: authorName,
    });

    const sessionId = existingSession ? existingSession.id : `session-${videoId}-${Date.now()}`;
    const newSession: VideoSession = {
      id: sessionId,
      youtube_url,
      video_id: videoId,
      title: videoTitle,
      duration_sec:
        transcriptItems.length > 0
          ? Math.ceil(transcriptItems[transcriptItems.length - 1].start + 15)
          : 300,
      language: extractionResult.detectedLanguage,
      created_at: new Date().toISOString(),
      words_count: extractionResult.words.length,
      subtitles: extractionResult.subtitles,
    };

    const words: VideoWord[] = extractionResult.words.map((item, idx) => ({
      id: `vw-${sessionId}-${idx + 1}`,
      session_id: sessionId,
      word: item.word,
      language: item.language,
      ipa_en: item.ipa_en,
      pinyin: item.pinyin,
      timestamp_sec: item.timestamp_sec,
      meaning_vi: item.meaning_vi,
      context_sentence: item.context_sentence,
      difficulty: item.difficulty,
    }));

    db.addVideoSession(newSession);
    db.addVideoWords(words);

    return res.json({
      success: true,
      session: newSession,
      words,
      transcript_count: transcriptItems.length,
    });
  } catch (error: any) {
    console.error('handleExtractVideoVocab error:', error);
    return res.status(500).json({
      error: error.message || 'Không thể trích xuất từ vựng từ video này lúc này. Vui lòng thử lại.',
    });
  }
}

export function handleGetVideoSessions(req: Request, res: Response) {
  try {
    const sessions = db.getVideoSessions();
    return res.json({ success: true, sessions });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}

export function handleGetVideoSessionById(req: Request, res: Response) {
  try {
    const { sessionId } = req.params;
    const session = db.getVideoSession(sessionId);
    if (!session) {
      return res.status(404).json({ error: 'Không tìm thấy phiên học video.' });
    }
    const words = db.getVideoWords(sessionId);
    return res.json({ success: true, session, words });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}

export function handleUpdateSubtitles(req: Request, res: Response) {
  try {
    const { sessionId } = req.params;
    const { subtitles } = req.body;
    if (!Array.isArray(subtitles)) {
      return res.status(400).json({ error: 'Danh sách phụ đề không hợp lệ.' });
    }

    const updatedSession = db.updateVideoSubtitles(sessionId, subtitles);
    if (!updatedSession) {
      return res.status(404).json({ error: 'Không tìm thấy video session.' });
    }

    return res.json({ success: true, session: updatedSession });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}
