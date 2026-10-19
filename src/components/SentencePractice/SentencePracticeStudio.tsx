import React, { useState } from 'react';
import { VocabCard, LanguagePairMode, SentenceCheckResult } from '../../types/index.ts';
import SentencePracticeBox from './SentencePracticeBox.tsx';
import { ChevronLeft, ChevronRight, Sparkles, CheckCircle2, BookOpen } from 'lucide-react';

interface SentencePracticeStudioProps {
  cards: VocabCard[];
  langMode?: LanguagePairMode;
  onExit?: () => void;
}

export default function SentencePracticeStudio({
  cards,
  langMode = 'en-vi',
  onExit,
}: SentencePracticeStudioProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [practicedCards, setPracticedCards] = useState<Record<string, number>>({});

  if (!cards || cards.length === 0) {
    return (
      <div className="bg-white rounded-3xl p-8 border border-[#E5E7EB] text-center space-y-3">
        <p className="text-[#6B7280]">Chưa có từ vựng nào để thực hành đặt câu.</p>
      </div>
    );
  }

  const currentCard = cards[currentIndex] || cards[0];

  const handleSentenceChecked = (result: SentenceCheckResult) => {
    setPracticedCards((prev) => ({
      ...prev,
      [currentCard.id]: result.score,
    }));
  };

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + cards.length) % cards.length);
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % cards.length);
  };

  const practicedCount = Object.keys(practicedCards).length;

  return (
    <div className="space-y-6">
      {/* Top Bar with Word Navigation Carousel */}
      <div className="bg-white rounded-3xl p-5 border border-[#E5E7EB] shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base sm:text-lg font-bold text-[#111827]">
                Phòng Luyện Đặt Câu Với AI
              </h3>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-[#EFF6FF] text-[#1E40AF] border border-[#DBEAFE]">
                {cards.length} từ vựng
              </span>
            </div>
            <p className="text-xs text-[#6B7280] mt-0.5">
              Chọn từ bất kỳ, nhập câu của bạn để AI phát hiện lỗi ngữ pháp và hướng dẫn sửa chi tiết.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <span className="text-xs font-semibold text-[#059669] bg-[#ECFDF5] px-3 py-1 rounded-full border border-[#A7F3D0]">
              ✓ Đã luyện: {practicedCount}/{cards.length} từ
            </span>
            {onExit && (
              <button
                type="button"
                onClick={onExit}
                className="text-xs font-semibold text-[#4B5563] hover:text-[#111827] px-3 py-1 rounded-full bg-[#F3F4F6] hover:bg-[#E5E7EB] cursor-pointer"
              >
                Quay lại
              </button>
            )}
          </div>
        </div>

        {/* Quick Word Selector Pill Ribbon */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-1 no-scrollbar">
          {cards.map((card, idx) => {
            const isSelected = idx === currentIndex;
            const score = practicedCards[card.id];
            const isPracticed = typeof score === 'number';

            return (
              <button
                key={card.id}
                type="button"
                onClick={() => setCurrentIndex(idx)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-all cursor-pointer flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-[#2563EB] text-white shadow-xs'
                    : isPracticed
                    ? 'bg-[#ECFDF5] text-[#065F46] border border-[#A7F3D0]'
                    : 'bg-[#F9FAFB] text-[#4B5563] hover:bg-[#F3F4F6] border border-[#E5E7EB]'
                }`}
              >
                <span>#{idx + 1}</span>
                <span>{card.word_en || card.word_zh || card.word_ja}</span>
                {isPracticed && (
                  <span className={`text-[9px] px-1 rounded-full ${isSelected ? 'bg-white/20' : 'bg-[#D1FAE5]'}`}>
                    {score}đ
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Practice Workspace */}
      <SentencePracticeBox
        key={currentCard.id}
        card={currentCard}
        langMode={langMode}
        onSentenceChecked={handleSentenceChecked}
      />

      {/* Bottom Navigation */}
      <div className="max-w-xl mx-auto flex items-center justify-between gap-4 bg-white p-3.5 rounded-full border border-[#E5E7EB] shadow-xs">
        <button
          type="button"
          onClick={handlePrev}
          className="flex items-center gap-1.5 px-4 py-2 bg-[#F3F4F6] hover:bg-[#E5E7EB] text-[#111827] rounded-full text-xs font-semibold transition-colors cursor-pointer"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Từ trước</span>
        </button>

        <span className="text-xs font-bold text-[#111827]">
          {currentIndex + 1} / {cards.length}
        </span>

        <button
          type="button"
          onClick={handleNext}
          className="flex items-center gap-1.5 px-4 py-2 bg-[#3B82F6] hover:bg-[#2563EB] text-white rounded-full text-xs font-semibold transition-colors cursor-pointer shadow-xs"
        >
          <span>Từ tiếp theo</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
