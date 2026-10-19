import React, { useState } from 'react';
import { Sparkles, ArrowRight, Loader2, Lightbulb, GraduationCap, Check, Dices } from 'lucide-react';
import { CEFRLevel } from '../../types/index.ts';

interface TopicInputProps {
  onGenerate: (topic: string, level?: string) => Promise<void>;
  isLoading: boolean;
}

interface LevelOption {
  id: CEFRLevel;
  code: string;
  name: string;
  hsk: string;
  desc: string;
  colorClass: string;
  activeBg: string;
  borderClass: string;
}

const CEFR_LEVELS: LevelOption[] = [
  {
    id: 'ALL',
    code: 'Tất cả',
    name: 'Đa cấp độ',
    hsk: 'Tự động',
    desc: 'Phân bổ tự nhiên từ căn bản đến nâng cao',
    colorClass: 'text-[#4B5563]',
    activeBg: 'bg-[#111827] text-white border-[#111827]',
    borderClass: 'border-[#E5E7EB]',
  },
  {
    id: 'A1',
    code: 'A1',
    name: 'Sơ cấp 1',
    hsk: 'HSK 1',
    desc: 'Từ vựng nền tảng, đồ vật, số đếm, chào hỏi cơ bản',
    colorClass: 'text-emerald-700',
    activeBg: 'bg-emerald-600 text-white border-emerald-600 shadow-xs',
    borderClass: 'border-emerald-200 hover:border-emerald-400',
  },
  {
    id: 'A2',
    code: 'A2',
    name: 'Sơ cấp 2',
    hsk: 'HSK 2',
    desc: 'Giao tiếp sinh hoạt hàng ngày, mua sắm, miêu tả đơn giản',
    colorClass: 'text-teal-700',
    activeBg: 'bg-teal-600 text-white border-teal-600 shadow-xs',
    borderClass: 'border-teal-200 hover:border-teal-400',
  },
  {
    id: 'B1',
    code: 'B1',
    name: 'Trung cấp 1',
    hsk: 'HSK 3',
    desc: 'Giao tiếp độc lập, du lịch, thói quen, biểu đạt quan điểm',
    colorClass: 'text-blue-700',
    activeBg: 'bg-blue-600 text-white border-blue-600 shadow-xs',
    borderClass: 'border-blue-200 hover:border-blue-400',
  },
  {
    id: 'B2',
    code: 'B2',
    name: 'Trung cấp 2',
    hsk: 'HSK 4',
    desc: 'Đàm thoại lưu loát, thảo luận công sở, thành ngữ thông dụng',
    colorClass: 'text-indigo-700',
    activeBg: 'bg-indigo-600 text-white border-indigo-600 shadow-xs',
    borderClass: 'border-indigo-200 hover:border-indigo-400',
  },
  {
    id: 'C1',
    code: 'C1',
    name: 'Cao cấp 1',
    hsk: 'HSK 5',
    desc: 'Từ vựng học thuật, chuyên ngành, idioms và văn phong trang trọng',
    colorClass: 'text-purple-700',
    activeBg: 'bg-purple-600 text-white border-purple-600 shadow-xs',
    borderClass: 'border-purple-200 hover:border-purple-400',
  },
  {
    id: 'C2',
    code: 'C2',
    name: 'Cao cấp 2 (Mastery)',
    hsk: 'HSK 6+',
    desc: 'Bậc thầy ngôn ngữ, sắc thái biểu cảm tinh tế, học thuật đỉnh cao',
    colorClass: 'text-rose-700',
    activeBg: 'bg-rose-600 text-white border-rose-600 shadow-xs',
    borderClass: 'border-rose-200 hover:border-rose-400',
  },
];

const POPULAR_TOPICS = [
  { id: 'life', label: 'Life (Đời sống)', query: 'Life, habits and daily routine' },
  { id: 'tech', label: 'AI & Công nghệ', query: 'Artificial Intelligence & modern technology' },
  { id: 'career', label: 'Công việc & Phỏng vấn', query: 'Job interview & workplace communication' },
  { id: 'travel', label: 'Du lịch & Khách sạn', query: 'Travel, airport and hotel check-in' },
  { id: 'food', label: 'Ẩm thực & Nhà hàng', query: 'Culinary culture and dining at restaurants' },
  { id: 'emotions', label: 'Cảm xúc & Tâm lý', query: 'Human emotions and mental well-being' },
  { id: 'finance', label: 'Tài chính & Đầu tư', query: 'Personal finance, banking and investment' },
  { id: 'health', label: 'Y tế & Sức khỏe', query: 'Health, wellness and medical care' },
  { id: 'climate', label: 'Môi trường & Tự nhiên', query: 'Environment, nature and climate change' },
];

const RANDOM_TOPIC_POOL = [
  { topic: 'Life, daily habits & morning routine', level: 'A2' as CEFRLevel },
  { topic: 'Artificial Intelligence, robotics & future tech', level: 'B2' as CEFRLevel },
  { topic: 'Job interviews, salary negotiation & resume', level: 'B1' as CEFRLevel },
  { topic: 'Airport navigation, flight boarding & hotel stays', level: 'A2' as CEFRLevel },
  { topic: 'Traditional culinary, street food & fine dining', level: 'B1' as CEFRLevel },
  { topic: 'Psychological resilience & mindfulness meditation', level: 'C1' as CEFRLevel },
  { topic: 'Macroeconomics, stock market & cryptocurrency', level: 'B2' as CEFRLevel },
  { topic: 'Environmental sustainability & renewable energy', level: 'B2' as CEFRLevel },
  { topic: 'Literature, philosophical idioms & poetry', level: 'C2' as CEFRLevel },
  { topic: 'Shopping, grocery discounts & bargaining', level: 'A1' as CEFRLevel },
];

export default function TopicInput({ onGenerate, isLoading }: TopicInputProps) {
  const [topic, setTopic] = useState('');
  const [selectedLevel, setSelectedLevel] = useState<CEFRLevel>('ALL');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim() || isLoading) return;
    onGenerate(topic.trim(), selectedLevel !== 'ALL' ? selectedLevel : undefined);
  };

  const handleSelectSuggestion = (suggestedQuery: string) => {
    setTopic(suggestedQuery);
    onGenerate(suggestedQuery, selectedLevel !== 'ALL' ? selectedLevel : undefined);
  };

  const handleRandomSurprise = () => {
    const randomIndex = Math.floor(Math.random() * RANDOM_TOPIC_POOL.length);
    const chosen = RANDOM_TOPIC_POOL[randomIndex];
    setTopic(chosen.topic);
    setSelectedLevel(chosen.level);
    onGenerate(chosen.topic, chosen.level);
  };

  const activeLevelObj = CEFR_LEVELS.find((l) => l.id === selectedLevel) || CEFR_LEVELS[0];

  return (
    <div className="w-full bg-white rounded-2xl p-6 sm:p-8 border border-[#E5E7EB] shadow-xs">
      <div className="max-w-3xl mx-auto text-center space-y-3 mb-6">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#EFF6FF] border border-[#DBEAFE] text-[#1E40AF] text-xs font-semibold">
          <Sparkles className="w-3.5 h-3.5 text-[#3B82F6]" />
          <span>Chức năng 1 — Học từ vựng theo chủ đề & Cấp độ CEFR (Tạo ngẫu nhiên không giới hạn)</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#111827]">
          Nhập chủ đề & Chọn trình độ (A1 – C2)
        </h2>
        <p className="text-[#4B5563] text-sm sm:text-base leading-relaxed">
          Hệ thống sinh 15 thẻ từ vựng song song <span className="font-semibold text-[#3B82F6]">tiếng Anh</span> và{' '}
          <span className="font-semibold text-[#EF4444]">tiếng Trung (Hán tự + Pinyin)</span> theo chuẩn cấp độ bạn chọn, giải nghĩa chi tiết bằng{' '}
          <span className="font-semibold text-[#059669]">tiếng Việt</span>. Bạn có thể{' '}
          <span className="font-semibold text-[#111827] bg-yellow-100 px-1.5 py-0.5 rounded">tạo ngẫu nhiên nhiều lần</span> cho cùng một chủ đề để mở rộng vốn từ không giới hạn!
        </p>
      </div>

      <form onSubmit={handleSubmit} className="max-w-2xl mx-auto space-y-5">
        {/* ================= CEFR LEVEL SELECTOR ================= */}
        <div className="space-y-2.5 bg-[#F9FAFB] p-3.5 sm:p-4 rounded-2xl border border-[#E5E7EB]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-bold text-[#374151]">
              <GraduationCap className="w-4 h-4 text-[#3B82F6]" />
              <span>Chọn trình độ CEFR / HSK mục tiêu:</span>
            </div>
            {selectedLevel !== 'ALL' && (
              <span className="text-[11px] font-semibold text-[#3B82F6] bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-100">
                Đang chọn: {activeLevelObj.code} · {activeLevelObj.name} ({activeLevelObj.hsk})
              </span>
            )}
          </div>

          {/* Level Tabs / Buttons Grid */}
          <div className="grid grid-cols-3 sm:grid-cols-7 gap-1.5">
            {CEFR_LEVELS.map((lvl) => {
              const isSelected = selectedLevel === lvl.id;
              return (
                <button
                  key={lvl.id}
                  type="button"
                  id={`btn-level-${lvl.id.toLowerCase()}`}
                  disabled={isLoading}
                  onClick={() => setSelectedLevel(lvl.id)}
                  className={`py-2 px-1.5 rounded-xl border text-center transition-all duration-150 cursor-pointer flex flex-col items-center justify-center gap-0.5 disabled:opacity-50 ${
                    isSelected
                      ? lvl.activeBg
                      : `bg-white ${lvl.borderClass} ${lvl.colorClass} hover:bg-slate-50`
                  }`}
                >
                  <span className="text-xs font-extrabold tracking-tight flex items-center gap-1">
                    {lvl.code}
                    {isSelected && <Check className="w-3 h-3 shrink-0" />}
                  </span>
                  <span className={`text-[10px] truncate max-w-full font-medium ${isSelected ? 'text-white/90' : 'text-[#6B7280]'}`}>
                    {lvl.hsk}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Active Level Description Subtitle */}
          <div className="text-[11px] text-[#6B7280] italic px-1 pt-0.5 flex items-center justify-between">
            <span>💡 {activeLevelObj.desc}</span>
          </div>
        </div>

        {/* ================= SEARCH / TOPIC INPUT ================= */}
        <div className="space-y-2">
          <div className="relative flex items-center">
            <input
              id="input-topic"
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              disabled={isLoading}
              placeholder="Tìm kiếm hoặc nhập chủ đề (ví dụ: 'Life', 'Du lịch', 'AI technology', 'Kinh doanh')..."
              className="w-full pl-5 pr-40 py-3.5 bg-[#F3F4F6] border border-[#E5E7EB] rounded-full text-[#111827] placeholder:text-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#3B82F6] focus:bg-white text-sm transition-all disabled:opacity-60"
            />
            <div className="absolute right-1.5 flex items-center gap-1">
              <button
                id="btn-generate-topic"
                type="submit"
                disabled={!topic.trim() || isLoading}
                className="px-4 sm:px-5 py-2.5 bg-[#3B82F6] hover:bg-[#2563EB] disabled:bg-[#E5E7EB] disabled:text-[#9CA3AF] text-white font-semibold rounded-full text-xs transition-all duration-150 flex items-center gap-1.5 cursor-pointer shadow-xs disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Đang tạo...</span>
                  </>
                ) : (
                  <>
                    <span>Tạo 15 thẻ từ</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Quick Random Trigger & Instructions */}
          <div className="flex flex-wrap items-center justify-between gap-2 px-2 text-xs">
            <button
              type="button"
              id="btn-random-topic-surprise"
              disabled={isLoading}
              onClick={handleRandomSurprise}
              className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 rounded-full font-semibold transition-all cursor-pointer disabled:opacity-50"
            >
              <Dices className="w-3.5 h-3.5 text-amber-600 animate-pulse" />
              <span>Gợi ý & Tạo ngẫu nhiên 1 chủ đề bất kỳ</span>
            </button>
            <span className="text-[11px] text-[#6B7280]">
              ✨ Có thể bấm tạo nhiều lần để nhận các bộ từ vựng ngẫu nhiên mới
            </span>
          </div>
        </div>

        {/* Suggestion Chips */}
        <div className="pt-1">
          <div className="flex items-center gap-1.5 text-xs text-[#6B7280] mb-2 font-medium">
            <Lightbulb className="w-3.5 h-3.5 text-[#F59E0B]" />
            <span>Gợi ý chủ đề phổ biến (nhấn để tạo hoặc tạo lại bộ mới):</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {POPULAR_TOPICS.map((item) => (
              <button
                key={item.id}
                type="button"
                id={`btn-topic-tag-${item.id}`}
                disabled={isLoading}
                onClick={() => handleSelectSuggestion(item.query)}
                className="px-3.5 py-1.5 bg-[#F3F4F6] hover:bg-[#EFF6FF] hover:text-[#1E40AF] hover:border-[#DBEAFE] border border-transparent rounded-full text-xs font-medium text-[#4B5563] transition-all cursor-pointer disabled:opacity-50"
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      </form>
    </div>
  );
};
