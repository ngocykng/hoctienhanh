import React from 'react';
import { X, BookOpen, Youtube, Sparkles, Database, Layers, CheckCircle2 } from 'lucide-react';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function HelpModal({ isOpen, onClose }: HelpModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-[#E5E7EB] shadow-2xl p-6 sm:p-8 space-y-6">
        <div className="flex items-center justify-between border-b border-[#E5E7EB] pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-[#EFF6FF] text-[#3B82F6] border border-[#DBEAFE] flex items-center justify-center font-bold text-xs">
              AI
            </div>
            <div>
              <h3 className="font-bold text-lg text-[#111827]">
                Ứng dụng học tiếng Anh & tiếng Trung (Song ngữ)
              </h3>
              <p className="text-xs text-[#6B7280]">Đầu vào: Anh / Trung — Đầu ra giải nghĩa: Tiếng Việt</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-[#9CA3AF] hover:text-[#111827] hover:bg-[#F3F4F6] rounded-full transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Feature 1 */}
        <div className="p-4 rounded-xl bg-[#EFF6FF] border border-[#DBEAFE] space-y-2">
          <div className="flex items-center gap-2 text-[#1E40AF] font-bold text-sm">
            <BookOpen className="w-4 h-4 text-[#3B82F6]" />
            <span>Chức năng 1 — Học từ vựng theo chủ đề</span>
          </div>
          <p className="text-xs text-[#4B5563] leading-relaxed">
            Người dùng nhập chủ đề bất kỳ (ví dụ: "life", "technology", "travel"). Hệ thống sinh 15 thẻ từ vựng flashcard song song tiếng Anh và tiếng Trung (Hán tự + Pinyin), kèm câu ví dụ cùng nghĩa và giải nghĩa tiếng Việt. Hỗ trợ lật thẻ 3D, đọc phát âm chuẩn và trắc nghiệm ôn tập.
          </p>
        </div>

        {/* Feature 2 */}
        <div className="p-4 rounded-xl bg-[#EFF6FF] border border-[#DBEAFE] space-y-2">
          <div className="flex items-center gap-2 text-[#1E40AF] font-bold text-sm">
            <Youtube className="w-4 h-4 text-[#EF4444]" />
            <span>Chức năng 2 — Trích từ vựng từ video YouTube</span>
          </div>
          <p className="text-xs text-[#4B5563] leading-relaxed">
            Người dùng dán link video YouTube. Hệ thống trích xuất các từ vựng xuất hiện trong video theo từng mốc thời gian timestamp, hiển thị thanh từ vựng chạy dưới video theo thời gian thực và cho phép nhấp vào từ để chuyển đến đúng thời điểm phát.
          </p>
        </div>

        {/* Technical stack notes */}
        <div className="space-y-2">
          <h4 className="text-xs font-bold uppercase tracking-wider text-[#9CA3AF] flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5" />
            <span>Công nghệ & Mô hình</span>
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            <div className="p-3 bg-[#F9FAFB] rounded-xl border border-[#E5E7EB]">
              <span className="font-semibold text-[#111827] block mb-0.5">AI Engine</span>
              <span className="text-[#6B7280]">Google Gemini 2.5 Flash / Flash Lite</span>
            </div>
            <div className="p-3 bg-[#F9FAFB] rounded-xl border border-[#E5E7EB]">
              <span className="font-semibold text-[#111827] block mb-0.5">Backend & API</span>
              <span className="text-[#6B7280]">Express + TypeScript + REST endpoints</span>
            </div>
            <div className="p-3 bg-[#F9FAFB] rounded-xl border border-[#E5E7EB]">
              <span className="font-semibold text-[#111827] block mb-0.5">Lưu trữ</span>
              <span className="text-[#6B7280]">Lưu Topic, VocabCards, VideoSessions, Words</span>
            </div>
            <div className="p-3 bg-[#F9FAFB] rounded-xl border border-[#E5E7EB]">
              <span className="font-semibold text-[#111827] block mb-0.5">Phát âm & Player</span>
              <span className="text-[#6B7280]">Web Speech API (EN/ZH) + YouTube IFrame API</span>
            </div>
          </div>
        </div>

        <div className="pt-2">
          <button
            onClick={onClose}
            className="w-full py-3 bg-[#3B82F6] hover:bg-[#2563EB] text-white rounded-full text-xs font-semibold transition-colors cursor-pointer shadow-xs"
          >
            Đã hiểu & Bắt đầu học
          </button>
        </div>
      </div>
    </div>
  );
};
