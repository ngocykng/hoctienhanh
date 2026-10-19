import React, { useState } from 'react';
import { Youtube, ArrowRight, Loader2, PlayCircle, FileText, ChevronDown, ChevronUp } from 'lucide-react';

interface VideoInputProps {
  onExtract: (url: string, title?: string, customTranscript?: string) => Promise<void>;
  isLoading: boolean;
}

const SAMPLE_VIDEOS = [
  {
    id: 'kXxD8H-5m6M',
    title: 'TED-Ed: How to master any new skill',
    url: 'https://www.youtube.com/watch?v=kXxD8H-5m6M',
    lang: 'en',
    badge: 'Tiếng Anh (B2-C1)',
  },
  {
    id: '5qap5aO4i9A',
    title: 'Daily Life Chinese & English Conversations',
    url: 'https://www.youtube.com/watch?v=5qap5aO4i9A',
    lang: 'zh',
    badge: 'Tiếng Trung (HSK4-5)',
  },
  {
    id: 'jNQXAC9IVRw',
    title: 'Me at the zoo - First Video on YouTube',
    url: 'https://www.youtube.com/watch?v=jNQXAC9IVRw',
    lang: 'en',
    badge: 'Tiếng Anh (A2-B1)',
  },
  {
    id: 'M7lc1UVf-VE',
    title: 'YouTube Developers: Introduction to Web Video',
    url: 'https://www.youtube.com/watch?v=M7lc1UVf-VE',
    lang: 'en',
    badge: 'Công nghệ',
  },
];

export default function VideoInput({ onExtract, isLoading }: VideoInputProps) {
  const [url, setUrl] = useState('');
  const [showCustomTranscript, setShowCustomTranscript] = useState(false);
  const [customTranscript, setCustomTranscript] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim() || isLoading) return;
    onExtract(url.trim(), undefined, customTranscript.trim() || undefined);
  };

  const handleSelectSample = (sample: typeof SAMPLE_VIDEOS[0]) => {
    setUrl(sample.url);
    onExtract(sample.url, sample.title);
  };

  return (
    <div className="w-full bg-white rounded-2xl p-6 sm:p-8 border border-[#E5E7EB] shadow-xs">
      <div className="max-w-3xl mx-auto text-center space-y-3 mb-6">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#EFF6FF] border border-[#DBEAFE] text-[#1E40AF] text-xs font-semibold">
          <Youtube className="w-3.5 h-3.5 text-[#EF4444]" />
          <span>Chức năng 2 — Trích từ vựng từ Video YouTube</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#111827]">
          Dán link YouTube để trích xuất từ vựng theo thời gian phát
        </h2>
        <p className="text-[#4B5563] text-sm sm:text-base leading-relaxed">
          Hệ thống phân tích phụ đề video (tiếng Anh hoặc tiếng Trung), lọc ra các từ vựng đáng học và đồng bộ theo thời gian phát <span className="font-semibold text-[#3B82F6]">(timestamp sync)</span> với phần giải nghĩa <span className="font-semibold text-[#059669]">tiếng Việt</span>.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="max-w-2xl mx-auto space-y-4">
        <div className="relative flex items-center">
          <input
            id="input-youtube-url"
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            disabled={isLoading}
            placeholder="Dán link YouTube (ví dụ: https://www.youtube.com/watch?v=...)"
            className="w-full pl-5 pr-36 py-3.5 bg-[#F3F4F6] border border-[#E5E7EB] rounded-full text-[#111827] placeholder:text-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#3B82F6] focus:bg-white text-sm transition-all disabled:opacity-60"
          />
          <button
            id="btn-extract-video"
            type="submit"
            disabled={!url.trim() || isLoading}
            className="absolute right-1.5 px-5 py-2.5 bg-[#3B82F6] hover:bg-[#2563EB] disabled:bg-[#E5E7EB] disabled:text-[#9CA3AF] text-white font-semibold rounded-full text-xs transition-all duration-150 flex items-center gap-2 cursor-pointer shadow-xs disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Đang trích từ...</span>
              </>
            ) : (
              <>
                <span>Trích từ vựng</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </div>

        {/* Custom transcript accordion (optional) */}
        <div className="pt-1">
          <button
            type="button"
            onClick={() => setShowCustomTranscript(!showCustomTranscript)}
            className="inline-flex items-center gap-1.5 text-xs text-[#6B7280] hover:text-[#111827] cursor-pointer font-medium"
          >
            <FileText className="w-3.5 h-3.5 text-[#9CA3AF]" />
            <span>Tự nhập phụ đề / đoạn văn bản (tùy chọn)</span>
            {showCustomTranscript ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>

          {showCustomTranscript && (
            <div className="mt-2">
              <textarea
                value={customTranscript}
                onChange={(e) => setCustomTranscript(e.target.value)}
                placeholder="Dán phụ đề hoặc đoạn hội thoại tiếng Anh / tiếng Trung của video tại đây nếu video chưa có phụ đề tự động..."
                rows={3}
                className="w-full p-3 text-xs bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl focus:ring-2 focus:ring-[#3B82F6] focus:bg-white text-[#111827]"
              />
            </div>
          )}
        </div>

        {/* Curated Sample Videos */}
        <div className="pt-2">
          <div className="flex items-center gap-1.5 text-xs text-[#6B7280] mb-2.5 font-medium">
            <PlayCircle className="w-3.5 h-3.5 text-[#EF4444]" />
            <span>Video mẫu để thử nghiệm nhanh:</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {SAMPLE_VIDEOS.map((sample) => (
              <button
                key={sample.id}
                type="button"
                id={`btn-sample-video-${sample.id}`}
                disabled={isLoading}
                onClick={() => handleSelectSample(sample)}
                className="p-3 bg-[#F9FAFB] hover:bg-[#EFF6FF] border border-[#E5E7EB] hover:border-[#DBEAFE] rounded-xl text-left transition-all cursor-pointer flex items-center justify-between group disabled:opacity-50"
              >
                <div className="overflow-hidden pr-2">
                  <div className="text-xs font-semibold text-[#111827] truncate group-hover:text-[#3B82F6]">
                    {sample.title}
                  </div>
                  <span className="text-[10px] text-[#6B7280]">{sample.badge}</span>
                </div>
                <PlayCircle className="w-4 h-4 text-[#9CA3AF] group-hover:text-[#3B82F6] shrink-0" />
              </button>
            ))}
          </div>
        </div>
      </form>
    </div>
  );
};

