import { YoutubeTranscript } from 'youtube-transcript';
import { VideoTranscriptItem } from '../../../src/types/index.ts';

export function extractYouTubeVideoId(urlOrId: string): string | null {
  if (!urlOrId) return null;
  const trimmed = urlOrId.trim();

  // If it's already an 11-character video ID
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) {
    return trimmed;
  }

  // Regex matches standard youtube, youtu.be, shorts, embeds
  const regExp = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/;
  const match = trimmed.match(regExp);
  return match ? match[1] : null;
}

export interface VideoMetadata {
  title?: string;
  author_name?: string;
  transcript: VideoTranscriptItem[];
  hasCaptions: boolean;
}

/**
 * Decode common HTML entities and strip sound effect annotations
 */
export function cleanTranscriptText(raw: string): string {
  if (!raw) return '';
  return raw
    .replace(/&amp;#39;/g, "'")
    .replace(/&#39;/g, "'")
    .replace(/&amp;quot;/g, '"')
    .replace(/&quot;/g, '"')
    .replace(/&amp;amp;/g, '&')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&apos;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/\[(?:Music|Applause|Laughter|Cheering|Sound|Foreign|Singing|Audio|Silence|Transcript)\]/gi, '')
    .replace(/\((?:music|applause|laughter|cheering|sound|foreign|singing)\)/gi, '')
    .replace(/>>/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Intelligently merge fragmented YouTube captions (often 1-3 words per row)
 * into coherent, natural sentences with exact start timestamps and durations.
 */
export function mergeTranscriptFragments(items: VideoTranscriptItem[]): VideoTranscriptItem[] {
  if (!items || items.length === 0) return [];

  const merged: VideoTranscriptItem[] = [];
  let currentText = '';
  let currentStart = 0;
  let currentEndTime = 0;
  let wordCount = 0;

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const cleaned = cleanTranscriptText(item.text);
    if (!cleaned) continue;

    const itemStart = item.start;
    const itemDuration = item.duration || 1.5;
    const itemEnd = itemStart + itemDuration;

    if (!currentText) {
      currentText = cleaned;
      currentStart = itemStart;
      currentEndTime = itemEnd;
      wordCount = cleaned.split(/\s+/).length;
    } else {
      const timeGap = itemStart - currentEndTime;
      const endsWithPunctuation = /[.?!。！？]$/.test(currentText.trim());
      const hasSpeakerPrefix = /^[A-Z][a-zA-Z\s]+:/.test(cleaned);
      const isLongEnough = wordCount >= 14 || (itemEnd - currentStart) >= 7.0;

      // Check if we should close the current sentence and start a new one
      if (endsWithPunctuation || hasSpeakerPrefix || timeGap > 1.8 || (isLongEnough && timeGap > 0.4)) {
        merged.push({
          text: currentText.trim(),
          start: Number(currentStart.toFixed(1)),
          duration: Number(Math.max(2.0, currentEndTime - currentStart).toFixed(1)),
        });

        currentText = cleaned;
        currentStart = itemStart;
        currentEndTime = itemEnd;
        wordCount = cleaned.split(/\s+/).length;
      } else {
        // Continue current sentence
        currentText += ' ' + cleaned;
        currentEndTime = Math.max(currentEndTime, itemEnd);
        wordCount += cleaned.split(/\s+/).length;
      }
    }
  }

  // Push remainder
  if (currentText.trim()) {
    merged.push({
      text: currentText.trim(),
      start: Number(currentStart.toFixed(1)),
      duration: Number(Math.max(2.0, currentEndTime - currentStart).toFixed(1)),
    });
  }

  return merged;
}

/**
 * Fetch video metadata from YouTube oEmbed API
 */
export async function fetchYouTubeOEmbed(videoId: string): Promise<{ title?: string; author?: string }> {
  try {
    const oembedUrl = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`;
    const res = await fetch(oembedUrl, { signal: AbortSignal.timeout(4000) });
    if (res.ok) {
      const data: any = await res.json();
      return {
        title: data.title,
        author: data.author_name,
      };
    }
  } catch (e) {
    // Non-critical, ignore timeout or network error
  }
  return {};
}

/**
 * Fetch YouTube transcript with graceful fallback for disabled captions
 */
export async function fetchYouTubeTranscript(videoId: string): Promise<VideoMetadata> {
  const oembed = await fetchYouTubeOEmbed(videoId);

  const langPreferences = ['en', 'zh', 'zh-Hans', 'zh-Hant', 'vi'];
  let rawTranscript: any = null;

  // Try preferred languages first, then default
  for (const lang of langPreferences) {
    try {
      rawTranscript = await YoutubeTranscript.fetchTranscript(videoId, { lang });
      if (rawTranscript && rawTranscript.length > 0) {
        break;
      }
    } catch {
      // Continue trying next language preference
    }
  }

  if (!rawTranscript || rawTranscript.length === 0) {
    try {
      rawTranscript = await YoutubeTranscript.fetchTranscript(videoId);
    } catch {
      // Captions are disabled or unavailable for this video on YouTube
    }
  }

  if (rawTranscript && Array.isArray(rawTranscript) && rawTranscript.length > 0) {
    const rawItems: VideoTranscriptItem[] = rawTranscript.map((item: any) => ({
      text: item.text || '',
      start: (item.offset || 0) / 1000,
      duration: (item.duration || 0) / 1000,
    }));

    // Clean and merge fragmented captions into coherent, grammatically whole sentences
    const mergedTranscript = mergeTranscriptFragments(rawItems);

    return {
      title: oembed.title,
      author_name: oembed.author,
      transcript: mergedTranscript,
      hasCaptions: true,
    };
  }

  // Captions disabled/not available on YouTube
  return {
    title: oembed.title,
    author_name: oembed.author,
    transcript: [],
    hasCaptions: false,
  };
}
