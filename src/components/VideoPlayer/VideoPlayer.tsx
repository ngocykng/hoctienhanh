import React, { useState, useEffect, useRef } from 'react';
import { VideoSession, VideoWord, SubtitleItem } from '../../types/index.ts';
import SpeechButton from '../common/SpeechButton.tsx';
import { createCustomCard } from '../../services/api.ts';
import {
  Play,
  Pause,
  ExternalLink,
  Search,
  Sparkles,
  Subtitles,
  BookOpen,
  RotateCcw,
  SkipBack,
  SkipForward,
  Type,
  Edit3,
  Check,
  X,
  Plus,
  Trash2,
  Loader2,
  RefreshCw,
  Gauge,
  Bookmark,
  BookmarkCheck,
} from 'lucide-react';

interface VideoPlayerProps {
  session: VideoSession;
  words: VideoWord[];
  onReanalyze?: () => void;
  isReanalyzing?: boolean;
  onUpdateSubtitles?: (updated: SubtitleItem[]) => void;
}

declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: () => void;
  }
}

type SubtitleMode = 'both' | 'original' | 'vi';
type SubtitleFontSize = 'sm' | 'base' | 'lg' | 'xl';

export default function VideoPlayer({
  session,
  words,
  onReanalyze,
  isReanalyzing = false,
  onUpdateSubtitles,
}: VideoPlayerProps) {
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [selectedWord, setSelectedWord] = useState<VideoWord | null>(null);
  const [activeTab, setActiveTab] = useState<'subtitles' | 'words'>('subtitles');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [languageFilter, setLanguageFilter] = useState<'all' | 'en' | 'zh'>('all');
  const [playbackRate, setPlaybackRate] = useState<number>(1);
  const [subtitleMode, setSubtitleMode] = useState<SubtitleMode>('both');
  const [subtitleFontSize, setSubtitleFontSize] = useState<SubtitleFontSize>('lg');
  const [autoScroll, setAutoScroll] = useState<boolean>(true);
  const [savedWordIds, setSavedWordIds] = useState<Set<string>>(new Set());
  const [savingWordId, setSavingWordId] = useState<string | null>(null);

  // Subtitle Edit Modal State
  const [editingSub, setEditingSub] = useState<SubtitleItem | null>(null);
  const [editOriginal, setEditOriginal] = useState<string>('');
  const [editVi, setEditVi] = useState<string>('');
  const [editPinyin, setEditPinyin] = useState<string>('');
  const [editStart, setEditStart] = useState<number>(0);

  const playerRef = useRef<any>(null);
  const subtitleListRef = useRef<HTMLDivElement>(null);
  const activeSubItemRef = useRef<HTMLDivElement>(null);
  const activeWordItemRef = useRef<HTMLDivElement>(null);

  // Normalize subtitles from session, or synthesize from words if none available
  const subtitles: SubtitleItem[] = React.useMemo(() => {
    if (session.subtitles && session.subtitles.length > 0) {
      return session.subtitles;
    }
    return words.map((w) => ({
      id: `sub-fallback-${w.id}`,
      start: w.timestamp_sec,
      duration: 6.0,
      text_original: w.context_sentence || w.word,
      text_vi: w.meaning_vi,
      pinyin: w.pinyin,
    }));
  }, [session.subtitles, words]);

  // Load YouTube IFrame API
  useEffect(() => {
    let timer: NodeJS.Timeout;

    const initPlayer = () => {
      if (window.YT && window.YT.Player) {
        playerRef.current = new window.YT.Player(`yt-player-${session.video_id}`, {
          videoId: session.video_id,
          playerVars: {
            playsinline: 1,
            enablejsapi: 1,
            origin: window.location.origin,
            rel: 0,
          },
          events: {
            onStateChange: (event: any) => {
              if (event.data === window.YT.PlayerState.PLAYING) {
                setIsPlaying(true);
              } else {
                setIsPlaying(false);
              }
            },
          },
        });
      }
    };

    if (!window.YT) {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag?.parentNode?.insertBefore(tag, firstScriptTag);
      window.onYouTubeIframeAPIReady = initPlayer;
    } else {
      initPlayer();
    }

    // Polling loop to update currentTime accurately (200ms)
    timer = setInterval(() => {
      if (playerRef.current && typeof playerRef.current.getCurrentTime === 'function') {
        try {
          const time = playerRef.current.getCurrentTime();
          if (typeof time === 'number') {
            setCurrentTime(time);
          }
        } catch (e) {
          // player might still be loading
        }
      }
    }, 200);

    return () => {
      clearInterval(timer);
      if (playerRef.current && typeof playerRef.current.destroy === 'function') {
        try {
          playerRef.current.destroy();
        } catch (e) {}
      }
    };
  }, [session.video_id]);

  // Find active subtitle item based on currentTime
  const activeSubtitle = React.useMemo(() => {
    if (subtitles.length === 0) return null;

    // 1. Direct window match: start <= currentTime <= start + duration
    const exact = subtitles.find((s) => {
      const dur = s.duration || 6.0;
      return currentTime >= s.start - 0.2 && currentTime <= s.start + dur;
    });
    if (exact) return exact;

    // 2. Or closest preceding subtitle within 12 seconds
    const past = subtitles.filter((s) => s.start <= currentTime);
    if (past.length > 0) {
      const lastPast = past[past.length - 1];
      if (currentTime - lastPast.start < 12.0) {
        return lastPast;
      }
    }

    return subtitles[0] || null;
  }, [subtitles, currentTime]);

  // Auto-scroll subtitle in right list when active changes
  useEffect(() => {
    if (autoScroll && activeSubItemRef.current && subtitleListRef.current) {
      activeSubItemRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
      });
    }
  }, [activeSubtitle, autoScroll]);

  // Find active vocabulary item based on currentTime
  const activeWord = React.useMemo(() => {
    if (words.length === 0) return null;

    const directMatch = words.find(
      (w) => currentTime >= w.timestamp_sec - 1.0 && currentTime <= w.timestamp_sec + 8.0
    );
    if (directMatch) return directMatch;

    const pastWords = words.filter((w) => w.timestamp_sec <= currentTime);
    if (pastWords.length > 0) {
      const lastPast = pastWords[pastWords.length - 1];
      if (currentTime - lastPast.timestamp_sec < 15) {
        return lastPast;
      }
    }

    return selectedWord || words[0] || null;
  }, [words, currentTime, selectedWord]);

  const seekToTimestamp = (timestampSec: number, wordObj?: VideoWord) => {
    if (playerRef.current && typeof playerRef.current.seekTo === 'function') {
      playerRef.current.seekTo(timestampSec, true);
      playerRef.current.playVideo();
      setIsPlaying(true);
    }
    if (wordObj) {
      setSelectedWord(wordObj);
    }
  };

  const handlePrevSubtitle = () => {
    if (!activeSubtitle) return;
    const currentIndex = subtitles.findIndex((s) => s.id === activeSubtitle.id);
    if (currentIndex > 0) {
      seekToTimestamp(subtitles[currentIndex - 1].start);
    }
  };

  const handleNextSubtitle = () => {
    if (!activeSubtitle) return;
    const currentIndex = subtitles.findIndex((s) => s.id === activeSubtitle.id);
    if (currentIndex >= 0 && currentIndex < subtitles.length - 1) {
      seekToTimestamp(subtitles[currentIndex + 1].start);
    }
  };

  const handleReplayCurrentSubtitle = () => {
    if (activeSubtitle) {
      seekToTimestamp(activeSubtitle.start);
    }
  };

  const handleSpeedChange = (rate: number) => {
    setPlaybackRate(rate);
    if (playerRef.current && typeof playerRef.current.setPlaybackRate === 'function') {
      playerRef.current.setPlaybackRate(rate);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSaveWordToNotebook = async (wordObj: VideoWord, e: React.MouseEvent) => {
    e.stopPropagation();
    if (savedWordIds.has(wordObj.id) || savingWordId === wordObj.id) return;
    setSavingWordId(wordObj.id);

    try {
      await createCustomCard({
        word_en: wordObj.language === 'en' ? wordObj.word : '',
        ipa_en: wordObj.language === 'en' ? wordObj.ipa_en : '',
        word_zh: wordObj.language === 'zh' ? wordObj.word : '',
        pinyin: wordObj.pinyin || '',
        meaning_vi: wordObj.meaning_vi,
        example_en: wordObj.language === 'en' ? wordObj.context_sentence : '',
        example_zh: wordObj.language === 'zh' ? wordObj.context_sentence : '',
        example_meaning_vi: wordObj.meaning_vi,
        difficulty: wordObj.difficulty || 'B1',
        topicName: `Từ vựng từ video: ${session.title.substring(0, 30)}...`,
      });

      setSavedWordIds((prev) => new Set(prev).add(wordObj.id));
    } catch (err) {
      console.error('Error saving word to notebook:', err);
    } finally {
      setSavingWordId(null);
    }
  };


  // Subtitle Edit Handlers
  const handleStartEdit = (sub: SubtitleItem, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setEditingSub(sub);
    setEditOriginal(sub.text_original);
    setEditVi(sub.text_vi);
    setEditPinyin(sub.pinyin || '');
    setEditStart(sub.start);
  };

  const handleSaveEdit = () => {
    if (!editingSub || !onUpdateSubtitles) return;
    const updated = subtitles.map((s) => {
      if (s.id === editingSub.id) {
        return {
          ...s,
          text_original: editOriginal.trim(),
          text_vi: editVi.trim(),
          pinyin: editPinyin.trim() || undefined,
          start: editStart,
        };
      }
      return s;
    });
    onUpdateSubtitles(updated);
    setEditingSub(null);
  };

  const handleDeleteSub = (subId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!onUpdateSubtitles) return;
    const updated = subtitles.filter((s) => s.id !== subId);
    onUpdateSubtitles(updated);
    if (editingSub?.id === subId) {
      setEditingSub(null);
    }
  };

  // Filter subtitles
  const filteredSubtitles = subtitles.filter((sub) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      sub.text_original.toLowerCase().includes(q) ||
      sub.text_vi.toLowerCase().includes(q) ||
      (sub.pinyin && sub.pinyin.toLowerCase().includes(q))
    );
  });

  // Filter words
  const filteredWords = words.filter((w) => {
    const matchesLang =
      languageFilter === 'all' ||
      (languageFilter === 'en' && w.language === 'en') ||
      (languageFilter === 'zh' && w.language === 'zh');

    const matchesSearch =
      !searchQuery.trim() ||
      w.word.toLowerCase().includes(searchQuery.toLowerCase()) ||
      w.meaning_vi.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (w.pinyin && w.pinyin.toLowerCase().includes(searchQuery.toLowerCase()));

    return matchesLang && matchesSearch;
  });

  // Helper to get text size classes
  const getOriginalFontSizeClass = () => {
    switch (subtitleFontSize) {
      case 'sm':
        return 'text-base sm:text-lg';
      case 'base':
        return 'text-lg sm:text-xl';
      case 'lg':
        return 'text-xl sm:text-2xl';
      case 'xl':
        return 'text-2xl sm:text-3xl';
      default:
        return 'text-xl sm:text-2xl';
    }
  };

  const getViFontSizeClass = () => {
    switch (subtitleFontSize) {
      case 'sm':
        return 'text-xs sm:text-sm';
      case 'base':
        return 'text-sm sm:text-base';
      case 'lg':
        return 'text-base sm:text-lg';
      case 'xl':
        return 'text-lg sm:text-xl';
      default:
        return 'text-base sm:text-lg';
    }
  };

  return (
    <div className="space-y-6">
      {/* Session Title & Metadata Header */}
      <div className="bg-white rounded-2xl p-5 border border-[#E5E7EB] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#EFF6FF] text-[#1E40AF] border border-[#DBEAFE] flex items-center gap-1">
              <Subtitles className="w-3 h-3 text-[#3B82F6]" />
              Phụ đề song ngữ Anh - Việt / Trung - Việt
            </span>
            <span className="text-xs text-[#6B7280] font-semibold">
              {subtitles.length} câu phụ đề · {words.length} từ vựng
            </span>
          </div>
          <h3 className="text-lg sm:text-xl font-bold text-[#111827] tracking-tight">
            {session.title || 'Video Học Ngoại Ngữ Song Ngữ'}
          </h3>
        </div>

        {/* Speed Controls, Re-analyze AI button & External Link */}
        <div className="flex flex-wrap items-center gap-2.5">
          {onReanalyze && (
            <button
              onClick={onReanalyze}
              disabled={isReanalyzing}
              title="Phân tích lại phụ đề bằng AI với độ chính xác cao"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-[#EFF6FF] hover:bg-[#DBEAFE] text-[#1D4ED8] font-bold rounded-full text-xs transition-all border border-[#BFDBFE] cursor-pointer disabled:opacity-60 shadow-xs"
            >
              {isReanalyzing ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-[#2563EB]" />
                  <span>Đang phân tích lại...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5 text-[#2563EB]" />
                  <span>Phân tích lại bằng AI</span>
                </>
              )}
            </button>
          )}

          <div className="flex items-center gap-1 bg-[#F3F4F6] p-1 rounded-full border border-[#E5E7EB]">
            <span className="text-[11px] font-bold text-[#6B7280] px-2 flex items-center gap-1">
              <Gauge className="w-3 h-3 text-[#3B82F6]" /> Tốc độ:
            </span>
            {[0.75, 1.0, 1.25].map((rate) => (
              <button
                key={rate}
                onClick={() => handleSpeedChange(rate)}
                className={`px-2.5 py-0.5 rounded-full text-xs font-semibold transition-colors cursor-pointer ${
                  playbackRate === rate
                    ? 'bg-white text-[#3B82F6] shadow-xs'
                    : 'text-[#4B5563] hover:text-[#111827]'
                }`}
              >
                {rate}x
              </button>
            ))}
          </div>

          <a
            href={session.youtube_url}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-[#4B5563] hover:text-[#111827] bg-[#F3F4F6] hover:bg-[#E5E7EB] rounded-full transition-colors border border-[#E5E7EB]"
          >
            <span>Mở YouTube</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>

      {/* Main Grid: Video Player + Bilingual Subtitle Running Box on Left, Tabs on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Video & Synchronized Dual-Language Subtitle Display */}
        <div className="lg:col-span-7 space-y-4">
          {/* Video IFrame Container */}
          <div className="relative w-full aspect-video rounded-2xl overflow-hidden bg-black shadow-sm border border-[#E5E7EB]">
            <div id={`yt-player-${session.video_id}`} className="w-full h-full" />
          </div>

          {/* =========================================================================
              KHU VỰC PHỤ ĐỀ CHẠY DƯỚI VIDEO (BILINGUAL RUNNING SUBTITLES PLAYER)
             ========================================================================= */}
          <div className="bg-[#0F172A] text-white rounded-2xl p-5 shadow-lg border border-[#334155] relative overflow-hidden space-y-4">
            {/* Top Control Bar of Subtitle Display */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-700/80 pb-3">
              {/* Live Subtitle Indicator */}
              <div className="flex items-center gap-2">
                <span className="flex h-2.5 w-2.5 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-400"></span>
                </span>
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                  Phụ đề trực tiếp: {formatTime(currentTime)}
                </span>
              </div>

              {/* Subtitle Mode Controls & Font Adjuster */}
              <div className="flex items-center gap-2">
                {/* Subtitle Language Modes */}
                <div className="flex items-center bg-slate-800/90 rounded-lg p-0.5 border border-slate-700 text-[11px] font-semibold">
                  <button
                    onClick={() => setSubtitleMode('both')}
                    className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                      subtitleMode === 'both'
                        ? 'bg-[#3B82F6] text-white shadow-xs'
                        : 'text-slate-300 hover:text-white'
                    }`}
                  >
                    Song ngữ
                  </button>
                  <button
                    onClick={() => setSubtitleMode('original')}
                    className={`px-2 py-1 rounded-md transition-colors cursor-pointer ${
                      subtitleMode === 'original'
                        ? 'bg-[#3B82F6] text-white shadow-xs'
                        : 'text-slate-300 hover:text-white'
                    }`}
                  >
                    Tiếng gốc
                  </button>
                  <button
                    onClick={() => setSubtitleMode('vi')}
                    className={`px-2 py-1 rounded-md transition-colors cursor-pointer ${
                      subtitleMode === 'vi'
                        ? 'bg-[#3B82F6] text-white shadow-xs'
                        : 'text-slate-300 hover:text-white'
                    }`}
                  >
                    Tiếng Việt
                  </button>
                </div>

                {/* Font Size Toggle */}
                <div className="flex items-center bg-slate-800/90 rounded-lg p-0.5 border border-slate-700 text-[11px]">
                  <button
                    onClick={() => {
                      const sizes: SubtitleFontSize[] = ['sm', 'base', 'lg', 'xl'];
                      const nextIdx = (sizes.indexOf(subtitleFontSize) + 1) % sizes.length;
                      setSubtitleFontSize(sizes[nextIdx]);
                    }}
                    title="Đổi cỡ chữ phụ đề"
                    className="px-2 py-1 text-slate-300 hover:text-white font-mono font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <Type className="w-3.5 h-3.5 text-[#60A5FA]" />
                    <span className="uppercase text-[10px]">{subtitleFontSize}</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Subtitle Content Box */}
            {activeSubtitle ? (
              <div className="py-2 px-1 space-y-3 min-h-[90px] flex flex-col justify-center relative group">
                {/* 1. DÒNG PHỤ ĐỀ TIẾNG GỐC */}
                {(subtitleMode === 'both' || subtitleMode === 'original') && (
                  <div className="space-y-1">
                    <p
                      className={`font-extrabold text-white tracking-tight leading-relaxed ${getOriginalFontSizeClass()}`}
                    >
                      {activeSubtitle.text_original}
                    </p>
                    {/* Pinyin if Chinese */}
                    {activeSubtitle.pinyin && (
                      <p className="text-xs sm:text-sm font-mono text-[#FDE047] font-medium tracking-wide">
                        [{activeSubtitle.pinyin}]
                      </p>
                    )}
                  </div>
                )}

                {/* 2. DÒNG PHỤ ĐỀ TIẾNG VIỆT */}
                {(subtitleMode === 'both' || subtitleMode === 'vi') && (
                  <div className="flex items-start gap-2 pt-0.5">
                    <span className="text-[#38BDF8] font-bold select-none text-sm leading-snug">➔</span>
                    <p
                      className={`font-semibold text-[#38BDF8] leading-relaxed ${getViFontSizeClass()}`}
                    >
                      {activeSubtitle.text_vi}
                    </p>
                  </div>
                )}

                {/* Quick Edit icon for active subtitle */}
                <button
                  onClick={(e) => handleStartEdit(activeSubtitle, e)}
                  title="Chỉnh sửa câu phụ đề này"
                  className="absolute top-0 right-0 p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition-all opacity-0 group-hover:opacity-100 cursor-pointer"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <div className="py-6 text-center text-xs text-slate-400 italic">
                Đang sẵn sàng... Phụ đề song ngữ Anh - Việt / Trung - Việt sẽ chạy theo thời gian thực khi video phát.
              </div>
            )}

            {/* Bottom Actions of Subtitle Box: Sentence Navigation & Repeat Loop */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-700/60 text-xs text-slate-400">
              <div className="flex items-center gap-1.5">
                <button
                  onClick={handlePrevSubtitle}
                  className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors flex items-center gap-1 cursor-pointer font-medium"
                >
                  <SkipBack className="w-3.5 h-3.5" />
                  <span>Câu trước</span>
                </button>
                <button
                  onClick={handleReplayCurrentSubtitle}
                  className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-300 hover:text-amber-200 transition-colors flex items-center gap-1 cursor-pointer font-medium"
                  title="Xem lại câu hiện tại"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Lặp lại câu này</span>
                </button>
                <button
                  onClick={handleNextSubtitle}
                  className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors flex items-center gap-1 cursor-pointer font-medium"
                >
                  <span>Câu sau</span>
                  <SkipForward className="w-3.5 h-3.5" />
                </button>
              </div>

              {activeSubtitle && (
                <div className="flex items-center gap-2">
                  <SpeechButton
                    text={activeSubtitle.text_original}
                    lang={session.language === 'zh' ? 'zh' : 'en'}
                    size="sm"
                    className="bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-600"
                  />
                  <span className="text-[11px] font-mono text-slate-400 font-medium">
                    Mốc: {formatTime(activeSubtitle.start)}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* ================= BAR TỪ VỰNG TRỌNG TÂM ĐỒNG BỘ ================= */}
          {activeWord && (
            <div className="bg-gradient-to-br from-[#1E40AF] via-[#2563EB] to-[#3B82F6] text-white rounded-2xl p-5 shadow-sm border border-[#3B82F6]/40 relative overflow-hidden">
              <div className="flex items-center justify-between border-b border-white/20 pb-2 mb-3">
                <div className="flex items-center gap-2">
                  <BookOpen className="w-3.5 h-3.5 text-white" />
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#DBEAFE]">
                    Từ vựng trọng tâm tại mốc: {formatTime(activeWord.timestamp_sec)}
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  {activeWord.difficulty && (
                    <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-white/20 text-white border border-white/30">
                      {activeWord.difficulty}
                    </span>
                  )}
                  <SpeechButton
                    text={activeWord.word}
                    lang={activeWord.language}
                    size="sm"
                    className="bg-white/20 hover:bg-white/30 text-white border-white/30"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex flex-wrap items-baseline gap-2.5">
                  <span className="text-xl sm:text-2xl font-extrabold tracking-tight">
                    {activeWord.word}
                  </span>
                  {activeWord.language === 'en' && activeWord.ipa_en && (
                    <span className="text-sm font-mono text-[#DBEAFE] font-medium">
                      {activeWord.ipa_en.startsWith('/') ? activeWord.ipa_en : `/${activeWord.ipa_en}/`}
                    </span>
                  )}
                  {activeWord.pinyin && (
                    <span className="text-sm font-mono text-[#FDE047] font-semibold">
                      [{activeWord.pinyin}]
                    </span>
                  )}
                </div>

                <div className="text-sm font-bold text-white pl-0.5">
                  ➔ {activeWord.meaning_vi}
                </div>
                {activeWord.context_sentence && (
                  <p className="text-xs text-[#DBEAFE] italic pt-0.5 opacity-90">
                    "{activeWord.context_sentence}"
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Tabbed View (Phụ Đề Song Ngữ Toàn Bộ & Danh Sách Từ Vựng) */}
        <div className="lg:col-span-5 space-y-4">
          {/* Tabs Selector & Search */}
          <div className="bg-white rounded-2xl p-4 border border-[#E5E7EB] shadow-xs space-y-3">
            {/* Tab buttons */}
            <div className="flex items-center gap-2 border-b border-[#E5E7EB] pb-3">
              <button
                onClick={() => setActiveTab('subtitles')}
                className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  activeTab === 'subtitles'
                    ? 'bg-[#3B82F6] text-white shadow-xs'
                    : 'bg-[#F3F4F6] text-[#4B5563] hover:text-[#111827]'
                }`}
              >
                <Subtitles className="w-3.5 h-3.5" />
                <span>Phụ đề song ngữ ({subtitles.length})</span>
              </button>

              <button
                onClick={() => setActiveTab('words')}
                className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  activeTab === 'words'
                    ? 'bg-[#3B82F6] text-white shadow-xs'
                    : 'bg-[#F3F4F6] text-[#4B5563] hover:text-[#111827]'
                }`}
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>Từ vựng ({words.length})</span>
              </button>
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9CA3AF]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={
                  activeTab === 'subtitles'
                    ? 'Tìm câu tiếng Anh, tiếng Trung hoặc tiếng Việt...'
                    : 'Tìm từ vựng hoặc nghĩa tiếng Việt...'
                }
                className="w-full pl-9 pr-4 py-2 bg-[#F3F4F6] border border-[#E5E7EB] rounded-full text-xs text-[#111827] placeholder:text-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#3B82F6] focus:bg-white"
              />
            </div>

            {/* Additional filters / toggles */}
            {activeTab === 'subtitles' ? (
              <div className="flex items-center justify-between text-xs text-[#6B7280] px-1 pt-1">
                <span>Nhấp câu để nhảy video · Bấm nút sửa để chỉnh chữ</span>
                <label className="flex items-center gap-1.5 text-[11px] cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={autoScroll}
                    onChange={(e) => setAutoScroll(e.target.checked)}
                    className="rounded text-[#3B82F6] focus:ring-[#3B82F6]"
                  />
                  <span>Tự cuộn theo video</span>
                </label>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 pt-1">
                <button
                  onClick={() => setLanguageFilter('all')}
                  className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors cursor-pointer ${
                    languageFilter === 'all'
                      ? 'bg-[#3B82F6] text-white shadow-xs'
                      : 'bg-[#F3F4F6] text-[#4B5563] hover:text-[#111827]'
                  }`}
                >
                  Tất cả ({words.length})
                </button>
                <button
                  onClick={() => setLanguageFilter('en')}
                  className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors cursor-pointer ${
                    languageFilter === 'en'
                      ? 'bg-[#3B82F6] text-white shadow-xs'
                      : 'bg-[#F3F4F6] text-[#4B5563] hover:text-[#111827]'
                  }`}
                >
                  Tiếng Anh
                </button>
                <button
                  onClick={() => setLanguageFilter('zh')}
                  className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors cursor-pointer ${
                    languageFilter === 'zh'
                      ? 'bg-[#3B82F6] text-white shadow-xs'
                      : 'bg-[#F3F4F6] text-[#4B5563] hover:text-[#111827]'
                  }`}
                >
                  Tiếng Trung
                </button>
              </div>
            )}
          </div>

          {/* ================= SCROLL LIST AREA ================= */}
          {activeTab === 'subtitles' ? (
            /* SUBTITLES TAB LIST */
            <div
              ref={subtitleListRef}
              className="space-y-2.5 max-h-[540px] overflow-y-auto pr-1 select-none"
            >
              {filteredSubtitles.map((subItem) => {
                const isActive = activeSubtitle?.id === subItem.id;
                return (
                  <div
                    key={subItem.id}
                    id={`sub-item-${subItem.id}`}
                    ref={isActive ? activeSubItemRef : null}
                    onClick={() => seekToTimestamp(subItem.start)}
                    className={`p-3.5 rounded-2xl border transition-all duration-200 cursor-pointer flex flex-col gap-1.5 shadow-2xs group relative ${
                      isActive
                        ? 'bg-[#EFF6FF] border-[#3B82F6] ring-2 ring-[#3B82F6]/50'
                        : 'bg-white hover:bg-[#F9FAFB] border-[#E5E7EB]'
                    }`}
                  >
                    {/* Timestamp badge, speech button, and edit button */}
                    <div className="flex items-center justify-between gap-2">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold border ${
                          isActive
                            ? 'bg-[#3B82F6] text-white border-[#3B82F6]'
                            : 'bg-[#F3F4F6] text-[#111827] border-[#E5E7EB]'
                        }`}
                      >
                        <Play className={`w-2.5 h-2.5 ${isActive ? 'fill-white text-white' : 'text-[#EF4444] fill-[#EF4444]'}`} />
                        {formatTime(subItem.start)}
                      </span>

                      <div className="flex items-center gap-1.5">
                        {isActive && (
                          <span className="text-[10px] font-bold text-[#2563EB] bg-blue-100 px-2 py-0.5 rounded-full">
                            Đang phát
                          </span>
                        )}
                        <SpeechButton
                          text={subItem.text_original}
                          lang={session.language === 'zh' ? 'zh' : 'en'}
                          size="sm"
                        />
                        <button
                          onClick={(e) => handleStartEdit(subItem, e)}
                          title="Chỉnh sửa câu phụ đề"
                          className="p-1 rounded-lg text-[#9CA3AF] hover:text-[#111827] hover:bg-[#F3F4F6] transition-colors cursor-pointer"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Original sentence */}
                    <div className="text-xs sm:text-sm font-bold text-[#111827] leading-snug">
                      {subItem.text_original}
                    </div>

                    {/* Pinyin if Chinese */}
                    {subItem.pinyin && (
                      <div className="text-[11px] font-mono text-[#DC2626] font-semibold">
                        [{subItem.pinyin}]
                      </div>
                    )}

                    {/* Vietnamese translation */}
                    <div className="text-xs font-semibold text-[#2563EB] pt-0.5 border-t border-[#E5E7EB]/60">
                      {subItem.text_vi}
                    </div>
                  </div>
                );
              })}

              {filteredSubtitles.length === 0 && (
                <div className="p-8 text-center bg-white rounded-2xl border border-[#E5E7EB]">
                  <p className="text-xs text-[#6B7280]">Không tìm thấy câu phụ đề khớp với tìm kiếm.</p>
                </div>
              )}
            </div>
          ) : (
            /* VOCABULARY TAB LIST */
            <div className="space-y-2.5 max-h-[540px] overflow-y-auto pr-1 select-none">
              {filteredWords.map((wordItem) => {
                const isActive = activeWord?.id === wordItem.id;
                return (
                  <div
                    key={wordItem.id}
                    id={`video-word-${wordItem.id}`}
                    ref={isActive ? activeWordItemRef : null}
                    onClick={() => seekToTimestamp(wordItem.timestamp_sec, wordItem)}
                    className={`p-3.5 rounded-2xl border transition-all duration-200 cursor-pointer flex flex-col gap-2 shadow-2xs ${
                      isActive
                        ? 'bg-[#EFF6FF] border-[#3B82F6] ring-1 ring-[#3B82F6]'
                        : 'bg-white hover:bg-[#F9FAFB] border-[#E5E7EB]'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#F3F4F6] text-[#111827] border border-[#E5E7EB]">
                          <Play className="w-2.5 h-2.5 text-[#EF4444] fill-[#EF4444]" />
                          {formatTime(wordItem.timestamp_sec)}
                        </span>

                        <div className="flex flex-wrap items-baseline gap-1.5">
                          <span
                            className={`text-sm font-bold ${
                              wordItem.language === 'zh'
                                ? 'font-serif text-[#EF4444] text-base'
                                : 'text-[#111827]'
                            }`}
                          >
                            {wordItem.word}
                          </span>
                          {wordItem.language === 'en' && wordItem.ipa_en && (
                            <span className="text-xs font-mono font-medium text-[#2563EB]">
                              {wordItem.ipa_en.startsWith('/') ? wordItem.ipa_en : `/${wordItem.ipa_en}/`}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5">
                        {wordItem.difficulty && (
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#F3F4F6] text-[#6B7280]">
                            {wordItem.difficulty}
                          </span>
                        )}
                        <SpeechButton text={wordItem.word} lang={wordItem.language} size="sm" />
                        <button
                          type="button"
                          onClick={(e) => handleSaveWordToNotebook(wordItem, e)}
                          title={savedWordIds.has(wordItem.id) ? 'Đã lưu vào Sổ từ vựng' : 'Lưu từ này vào Sổ từ vựng'}
                          className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                            savedWordIds.has(wordItem.id)
                              ? 'bg-[#EFF6FF] text-[#2563EB]'
                              : 'text-[#9CA3AF] hover:text-[#2563EB] hover:bg-[#F3F4F6]'
                          }`}
                        >
                          {savedWordIds.has(wordItem.id) ? (
                            <BookmarkCheck className="w-3.5 h-3.5 text-[#2563EB]" />
                          ) : (
                            <Bookmark className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </div>

                    {wordItem.pinyin && (
                      <div className="text-xs text-[#DC2626] font-semibold pl-1">
                        [{wordItem.pinyin}]
                      </div>
                    )}

                    <div className="text-xs font-semibold text-[#111827] pl-1 border-l-2 border-[#3B82F6]">
                      {wordItem.meaning_vi}
                    </div>
                  </div>
                );
              })}

              {filteredWords.length === 0 && (
                <div className="p-8 text-center bg-white rounded-2xl border border-[#E5E7EB]">
                  <p className="text-xs text-[#6B7280]">Không tìm thấy từ vựng khớp với bộ lọc.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ================= MODAL CHỈNH SỬA PHỤ ĐỀ TRỰC TIẾP ================= */}
      {editingSub && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-[#E5E7EB] space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-[#E5E7EB] pb-3">
              <div className="flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-[#3B82F6]" />
                <h4 className="text-base font-bold text-[#111827]">Chỉnh sửa câu phụ đề</h4>
              </div>
              <button
                onClick={() => setEditingSub(null)}
                className="p-1 rounded-lg text-[#9CA3AF] hover:text-[#111827] hover:bg-[#F3F4F6] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-[#374151] mb-1">
                  Câu gốc (Tiếng Anh / Tiếng Trung):
                </label>
                <textarea
                  rows={2}
                  value={editOriginal}
                  onChange={(e) => setEditOriginal(e.target.value)}
                  className="w-full p-2.5 text-xs bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl focus:ring-2 focus:ring-[#3B82F6] focus:bg-white text-[#111827] font-medium"
                />
              </div>

              {session.language === 'zh' && (
                <div>
                  <label className="block text-xs font-bold text-[#374151] mb-1">
                    Phiên âm Pinyin có dấu:
                  </label>
                  <input
                    type="text"
                    value={editPinyin}
                    onChange={(e) => setEditPinyin(e.target.value)}
                    placeholder="ví dụ: nǐ hǎo"
                    className="w-full p-2.5 text-xs bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl focus:ring-2 focus:ring-[#3B82F6] focus:bg-white text-[#111827]"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-[#374151] mb-1">
                  Bản dịch tiếng Việt chuẩn:
                </label>
                <textarea
                  rows={2}
                  value={editVi}
                  onChange={(e) => setEditVi(e.target.value)}
                  className="w-full p-2.5 text-xs bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl focus:ring-2 focus:ring-[#3B82F6] focus:bg-white text-[#111827]"
                />
              </div>

              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <label className="block text-xs font-bold text-[#374151] mb-1">
                    Mốc bắt đầu (giây):
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={editStart}
                    onChange={(e) => setEditStart(parseFloat(e.target.value) || 0)}
                    className="w-full p-2.5 text-xs bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl focus:ring-2 focus:ring-[#3B82F6] focus:bg-white text-[#111827] font-mono"
                  />
                </div>
                <div className="pt-5">
                  <button
                    type="button"
                    onClick={() => handleDeleteSub(editingSub.id)}
                    className="px-3 py-2.5 text-xs font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Xóa câu</span>
                  </button>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#E5E7EB]">
              <button
                type="button"
                onClick={() => setEditingSub(null)}
                className="px-4 py-2 text-xs font-semibold text-[#4B5563] hover:bg-[#F3F4F6] rounded-full cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={handleSaveEdit}
                className="px-5 py-2 text-xs font-bold text-white bg-[#3B82F6] hover:bg-[#2563EB] rounded-full shadow-xs flex items-center gap-1.5 cursor-pointer"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Lưu thay đổi</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
