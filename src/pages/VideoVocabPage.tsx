import React, { useState, useEffect } from 'react';
import { VideoSession, VideoWord, SubtitleItem } from '../types/index.ts';
import { extractVideoVocab, getVideoSessions, getVideoSession, updateVideoSubtitles } from '../services/api.ts';
import VideoInput from '../components/VideoInput/VideoInput.tsx';
import VideoPlayer from '../components/VideoPlayer/VideoPlayer.tsx';
import { Youtube, AlertCircle, Check, PlaySquare, Film, Sparkles, Loader2 } from 'lucide-react';

export default function VideoVocabPage() {
  const [sessions, setSessions] = useState<VideoSession[]>([]);
  const [currentSession, setCurrentSession] = useState<VideoSession | null>(null);
  const [words, setWords] = useState<VideoWord[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isReanalyzing, setIsReanalyzing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    loadSessions();
  }, []);

  const loadSessions = async () => {
    try {
      const fetched = await getVideoSessions();
      setSessions(fetched);
      if (fetched.length > 0 && !currentSession) {
        loadSessionDetails(fetched[0].id);
      }
    } catch (err: any) {
      console.error('Error loading video sessions:', err);
    }
  };

  const loadSessionDetails = async (sessionId: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await getVideoSession(sessionId);
      setCurrentSession(res.session);
      setWords(res.words);
    } catch (err: any) {
      setError(err.message || 'Lỗi khi tải dữ liệu video');
    } finally {
      setIsLoading(false);
    }
  };

  const handleExtract = async (url: string, title?: string, customTranscript?: string) => {
    setIsLoading(true);
    setError(null);
    setSuccessMsg(null);
    try {
      const res = await extractVideoVocab(url, title, customTranscript);
      setCurrentSession(res.session);
      setWords(res.words);
      setSessions((prev) => [res.session, ...prev.filter((s) => s.id !== res.session.id)]);
      setSuccessMsg(`Đã phân tích thành công ${res.session.subtitles?.length || 0} câu phụ đề song ngữ và ${res.words.length} từ vựng!`);
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      setError(err.message || 'Không thể trích xuất từ vựng từ video này. Vui lòng kiểm tra lại link.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReanalyze = async () => {
    if (!currentSession || isReanalyzing) return;
    setIsReanalyzing(true);
    setError(null);
    try {
      const res = await extractVideoVocab(currentSession.youtube_url, currentSession.title, undefined, true);
      setCurrentSession(res.session);
      setWords(res.words);
      setSessions((prev) => [res.session, ...prev.filter((s) => s.id !== res.session.id)]);
      setSuccessMsg(`Đã phân tích lại với độ chính xác cao: ${res.session.subtitles?.length || 0} câu phụ đề!`);
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      setError(err.message || 'Lỗi khi phân tích lại video.');
    } finally {
      setIsReanalyzing(false);
    }
  };

  const handleUpdateSubtitles = async (updatedSubtitles: SubtitleItem[]) => {
    if (!currentSession) return;
    try {
      const updated = await updateVideoSubtitles(currentSession.id, updatedSubtitles);
      setCurrentSession(updated);
      setSuccessMsg('Đã lưu thay đổi phụ đề thành công!');
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      setError(err.message || 'Lỗi khi lưu phụ đề.');
    }
  };

  return (
    <div className="space-y-8">
      {/* YouTube URL Input Form */}
      <VideoInput onExtract={handleExtract} isLoading={isLoading || isReanalyzing} />

      {/* Status Alerts */}
      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl flex items-center gap-3 text-sm">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl flex items-center gap-3 text-sm">
          <Check className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Sessions Horizontal Bar if multiple sessions exist */}
      {sessions.length > 0 && (
        <div className="bg-white rounded-2xl p-4 border border-[#E5E7EB] shadow-xs">
          <div className="flex items-center gap-2 text-xs font-bold text-[#111827] mb-2.5">
            <Film className="w-3.5 h-3.5 text-[#3B82F6]" />
            <span>Các video đã xử lý:</span>
          </div>
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            {sessions.map((sess) => {
              const isSelected = currentSession?.id === sess.id;
              return (
                <button
                  key={sess.id}
                  id={`btn-session-${sess.id}`}
                  onClick={() => loadSessionDetails(sess.id)}
                  className={`px-3.5 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-2 cursor-pointer border ${
                    isSelected
                      ? 'bg-[#EFF6FF] border-[#3B82F6] text-[#1E40AF] shadow-xs'
                      : 'bg-[#F9FAFB] hover:bg-[#F3F4F6] border-[#E5E7EB] text-[#4B5563]'
                  }`}
                >
                  <PlaySquare className="w-3.5 h-3.5 text-[#3B82F6]" />
                  <span className="max-w-[200px] truncate">{sess.title}</span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-white text-[#6B7280] border border-[#E5E7EB]">
                    {sess.subtitles?.length || sess.words_count || 0} câu
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Main Video Player & Synchronized Vocab View */}
      {currentSession && words.length > 0 ? (
        <VideoPlayer
          session={currentSession}
          words={words}
          onReanalyze={handleReanalyze}
          isReanalyzing={isReanalyzing}
          onUpdateSubtitles={handleUpdateSubtitles}
        />
      ) : (
        <div className="bg-white rounded-2xl p-12 border border-[#E5E7EB] text-center space-y-3 shadow-xs">
          <Youtube className="w-12 h-12 text-[#9CA3AF] mx-auto" />
          <h4 className="text-base font-semibold text-[#111827]">Chưa có video được chọn</h4>
          <p className="text-xs text-[#6B7280] max-w-sm mx-auto">
            Dán một link YouTube hoặc chọn một video mẫu ở trên để bắt đầu trích xuất từ vựng và đồng bộ thời gian phát.
          </p>
        </div>
      )}
    </div>
  );
};
