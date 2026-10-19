import React, { useState } from 'react';
import { VocabCard, LanguagePairMode } from '../../types/index.ts';
import SpeechButton from '../common/SpeechButton.tsx';
import { RotateCw, CheckCircle2, Copy, Check, Sparkles, PenLine } from 'lucide-react';

interface FlashcardProps {
  card: VocabCard;
  index?: number;
  total?: number;
  isLearned?: boolean;
  langMode?: LanguagePairMode;
  onToggleLearned?: (cardId: string) => void;
  onPracticeSentence?: (card: VocabCard) => void;
}

const getDifficultyColor = (diff?: string) => {
  switch (diff?.toUpperCase()) {
    case 'A1':
    case 'N5':
    case 'HSK1':
      return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    case 'A2':
    case 'N4':
    case 'HSK2':
      return 'bg-teal-50 text-teal-700 border-teal-200';
    case 'B1':
    case 'N3':
    case 'HSK3':
      return 'bg-blue-50 text-blue-700 border-blue-200';
    case 'B2':
    case 'N2':
    case 'HSK4':
      return 'bg-indigo-50 text-indigo-700 border-indigo-200';
    case 'C1':
    case 'N1':
    case 'HSK5':
      return 'bg-purple-50 text-purple-700 border-purple-200';
    case 'C2':
    case 'HSK6':
      return 'bg-rose-50 text-rose-700 border-rose-200';
    default:
      return 'bg-gray-50 text-gray-700 border-gray-200';
  }
};

export default function Flashcard({
  card,
  index,
  total,
  isLearned = false,
  langMode = 'all',
  onToggleLearned,
  onPracticeSentence,
}: FlashcardProps) {
  const [isFlipped, setIsFlipped] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleFlip = () => {
    setIsFlipped(!isFlipped);
  };

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    let textToCopy = '';
    if (langMode === 'en-vi') {
      textToCopy = `${card.word_en} ${card.ipa_en || ''}: ${card.meaning_vi}`;
    } else if (langMode === 'zh-vi') {
      textToCopy = `${card.word_zh} (${card.pinyin}): ${card.meaning_vi}`;
    } else if (langMode === 'ja-vi') {
      textToCopy = `${card.word_ja || card.word_en} (${card.reading_ja || ''}): ${card.meaning_vi}`;
    } else {
      textToCopy = `${card.word_en} / ${card.word_zh} (${card.pinyin}) / ${card.word_ja || ''}: ${card.meaning_vi}`;
    }
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Determine what languages to render based on mode
  const showEn = langMode === 'all' || langMode === 'en-vi';
  const showZh = langMode === 'all' || langMode === 'zh-vi';
  const showJa = langMode === 'all' || langMode === 'ja-vi';

  const singleMode = langMode !== 'all';

  return (
    <div className="w-full max-w-xl mx-auto select-none" style={{ perspective: '1200px' }}>
      <div
        id={`flashcard-${card.id}`}
        onClick={handleFlip}
        className="relative w-full min-h-[400px] sm:min-h-[430px] cursor-pointer transition-transform duration-500 rounded-3xl shadow-sm hover:shadow-md border border-[#E5E7EB]"
        style={{
          transformStyle: 'preserve-3d',
          transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
        }}
      >
        {/* ================= FRONT SIDE ================= */}
        <div
          className="absolute inset-0 w-full h-full bg-white rounded-3xl p-6 sm:p-7 flex flex-col justify-between"
          style={{
            backfaceVisibility: 'hidden',
            WebkitBackfaceVisibility: 'hidden',
          }}
        >
          {/* Card Header Top */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {typeof index === 'number' && typeof total === 'number' && (
                <span className="px-2.5 py-0.5 text-[10px] font-bold rounded-full bg-[#EFF6FF] text-[#1E40AF] border border-[#DBEAFE]">
                  Thẻ {index + 1} / {total}
                </span>
              )}
              {card.difficulty && (
                <span className={`px-2 py-0.5 text-[10px] font-extrabold rounded-full border ${getDifficultyColor(card.difficulty)}`}>
                  {card.difficulty}
                </span>
              )}
              {singleMode && (
                <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-[#F3F4F6] text-[#374151]">
                  {langMode === 'en-vi' ? '🇬🇧 Tiếng Anh' : langMode === 'zh-vi' ? '🇨🇳 Tiếng Trung' : '🇯🇵 Tiếng Nhật'}
                </span>
              )}
            </div>

            <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
              {onPracticeSentence && (
                <button
                  type="button"
                  id={`btn-practice-sentence-${card.id}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    onPracticeSentence(card);
                  }}
                  title="Thực hành đặt câu với AI"
                  className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold text-[#1E40AF] bg-[#EFF6FF] hover:bg-[#DBEAFE] border border-[#BFDBFE] rounded-full transition-colors cursor-pointer shadow-2xs"
                >
                  <Sparkles className="w-3.5 h-3.5 text-[#3B82F6]" />
                  <span>Đặt câu</span>
                </button>
              )}

              <button
                type="button"
                id={`btn-copy-${card.id}`}
                onClick={handleCopy}
                title="Sao chép từ vựng"
                className="p-2 text-[#9CA3AF] hover:text-[#111827] hover:bg-[#F3F4F6] rounded-full transition-colors cursor-pointer"
              >
                {copied ? <Check className="w-4 h-4 text-[#059669]" /> : <Copy className="w-4 h-4" />}
              </button>

              {onToggleLearned && (
                <button
                  type="button"
                  id={`btn-learned-${card.id}`}
                  onClick={() => onToggleLearned(card.id)}
                  title={isLearned ? 'Đánh dấu chưa thuộc' : 'Đánh dấu đã thuộc'}
                  className={`p-2 rounded-full transition-colors cursor-pointer ${
                    isLearned
                      ? 'text-[#059669] bg-[#D1FAE5] hover:bg-[#A7F3D0]'
                      : 'text-[#D1D5DB] hover:text-[#6B7280] hover:bg-[#F3F4F6]'
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Card Body - Dual / Tri-Language Vocabulary */}
          <div className="my-auto space-y-3.5 text-center py-2">
            {/* English Section */}
            {showEn && (
              <div className={`space-y-1 rounded-2xl bg-[#EFF6FF]/70 border border-[#DBEAFE] transition-all ${
                singleMode ? 'p-6 sm:p-8' : 'p-3'
              }`}>
                <div className="text-[10px] font-bold text-[#1E40AF] uppercase tracking-widest flex items-center justify-center gap-1">
                  <span>🇬🇧 English</span>
                </div>
                <div className="flex items-center justify-center gap-3">
                  <span className={`font-extrabold text-[#111827] tracking-tight ${
                    singleMode ? 'text-3xl sm:text-4xl' : 'text-xl sm:text-2xl'
                  }`}>
                    {card.word_en}
                  </span>
                  <SpeechButton text={card.word_en} lang="en" size={singleMode ? 'lg' : 'md'} />
                </div>
                {card.ipa_en && (
                  <p className={`font-semibold font-mono text-[#2563EB] tracking-wide ${
                    singleMode ? 'text-sm' : 'text-xs'
                  }`}>
                    {card.ipa_en.startsWith('/') ? card.ipa_en : `/${card.ipa_en}/`}
                  </p>
                )}
              </div>
            )}

            {/* Chinese Section */}
            {showZh && (
              <div className={`space-y-1 rounded-2xl bg-[#FEF2F2]/80 border border-[#FEE2E2] transition-all ${
                singleMode ? 'p-6 sm:p-8' : 'p-3'
              }`}>
                <div className="text-[10px] font-bold text-[#DC2626] uppercase tracking-widest flex items-center justify-center gap-1">
                  <span>🇨🇳 中文 · Tiếng Trung</span>
                </div>
                <div className="flex items-center justify-center gap-3">
                  <span className={`font-bold text-[#111827] font-serif ${
                    singleMode ? 'text-4xl sm:text-5xl' : 'text-2xl sm:text-3xl'
                  }`}>
                    {card.word_zh}
                  </span>
                  <SpeechButton text={card.word_zh} lang="zh" size={singleMode ? 'lg' : 'md'} />
                </div>
                {card.pinyin && (
                  <p className={`font-semibold text-[#DC2626] tracking-wide ${
                    singleMode ? 'text-sm' : 'text-xs'
                  }`}>
                    [{card.pinyin}]
                  </p>
                )}
              </div>
            )}

            {/* Japanese Section */}
            {showJa && (
              <div className={`space-y-1 rounded-2xl bg-[#FAF5FF]/80 border border-[#F3E8FF] transition-all ${
                singleMode ? 'p-6 sm:p-8' : 'p-3'
              }`}>
                <div className="text-[10px] font-bold text-[#9333EA] uppercase tracking-widest flex items-center justify-center gap-1">
                  <span>🇯🇵 日本語 · Tiếng Nhật</span>
                </div>
                <div className="flex items-center justify-center gap-3">
                  <span className={`font-bold text-[#111827] font-sans ${
                    singleMode ? 'text-4xl sm:text-5xl' : 'text-2xl sm:text-3xl'
                  }`}>
                    {card.word_ja || card.word_en}
                  </span>
                  <SpeechButton text={card.word_ja || card.word_en} lang="ja" size={singleMode ? 'lg' : 'md'} />
                </div>
                {card.reading_ja && (
                  <p className={`font-semibold text-[#9333EA] tracking-wide ${
                    singleMode ? 'text-sm' : 'text-xs'
                  }`}>
                    [{card.reading_ja}]
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Card Footer Prompt */}
          <div className="pt-3 border-t border-[#E5E7EB] flex items-center justify-between text-xs text-[#9CA3AF]">
            <span className="inline-flex items-center gap-1.5 font-medium text-[#3B82F6] hover:text-[#2563EB]">
              <RotateCw className="w-3.5 h-3.5" />
              Nhấp vào thẻ để lật xem nghĩa & ví dụ
            </span>
            <span className="hidden sm:inline font-mono text-[10px]">Space / Enter</span>
          </div>
        </div>

        {/* ================= BACK SIDE ================= */}
        <div
          className="absolute inset-0 w-full h-full bg-white rounded-3xl p-6 sm:p-7 flex flex-col justify-between border border-[#DBEAFE] overflow-y-auto"
          style={{
            backfaceVisibility: 'hidden',
            WebkitBackfaceVisibility: 'hidden',
            transform: 'rotateY(180deg)',
          }}
        >
          {/* Card Header Back */}
          <div className="flex items-center justify-between border-b border-[#E5E7EB] pb-2.5">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 text-[10px] font-bold rounded-full bg-[#ECFDF5] text-[#065F46] border border-[#A7F3D0]">
                Giải nghĩa & Ví dụ
              </span>
              {card.difficulty && (
                <span className={`px-2 py-0.5 text-[10px] font-extrabold rounded-full border ${getDifficultyColor(card.difficulty)}`}>
                  {card.difficulty}
                </span>
              )}
            </div>
            <div className="flex items-center gap-1.5">
              {onPracticeSentence && (
                <button
                  type="button"
                  id={`btn-practice-sentence-back-${card.id}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    onPracticeSentence(card);
                  }}
                  title="Thực hành đặt câu với AI"
                  className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold text-[#1E40AF] bg-[#EFF6FF] hover:bg-[#DBEAFE] border border-[#BFDBFE] rounded-full transition-colors cursor-pointer shadow-2xs"
                >
                  <Sparkles className="w-3.5 h-3.5 text-[#3B82F6]" />
                  <span>Đặt câu</span>
                </button>
              )}
              <button
                type="button"
                onClick={handleFlip}
                className="inline-flex items-center gap-1 text-xs text-[#6B7280] hover:text-[#111827] px-2 py-1 rounded-full hover:bg-[#F3F4F6] cursor-pointer"
              >
                <RotateCw className="w-3.5 h-3.5" />
                <span>Lật lại</span>
              </button>
            </div>
          </div>

          {/* Vietnamese Meaning Banner */}
          <div className="my-2 p-3.5 bg-[#ECFDF5]/90 border border-[#A7F3D0] rounded-2xl">
            <div className="text-[10px] font-bold text-[#065F46] uppercase tracking-wider mb-0.5">
              🇻🇳 Nghĩa tiếng Việt
            </div>
            <div className="text-base sm:text-lg font-bold text-[#111827]">
              {card.meaning_vi}
            </div>
          </div>

          {/* Examples per Mode */}
          <div className="space-y-2.5 my-auto text-left text-xs">
            {/* English Example */}
            {showEn && card.example_en && (
              <div className="p-2.5 rounded-xl bg-[#EFF6FF]/60 border border-[#DBEAFE]">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="font-bold text-[#2563EB] text-[10px] block mb-0.5 uppercase">🇬🇧 Ví dụ EN:</span>
                    <p className="text-[#111827] italic font-medium leading-snug">"{card.example_en}"</p>
                  </div>
                  <SpeechButton text={card.example_en} lang="en" size="sm" />
                </div>
              </div>
            )}

            {/* Chinese Example */}
            {showZh && card.example_zh && (
              <div className="p-2.5 rounded-xl bg-[#FEF2F2]/60 border border-[#FEE2E2]">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="font-bold text-[#EF4444] text-[10px] block mb-0.5 uppercase">🇨🇳 Ví dụ ZH:</span>
                    <p className="text-[#111827] font-serif font-medium leading-snug">"{card.example_zh}"</p>
                  </div>
                  <SpeechButton text={card.example_zh} lang="zh" size="sm" />
                </div>
              </div>
            )}

            {/* Japanese Example */}
            {showJa && (card.example_ja || card.example_en) && (
              <div className="p-2.5 rounded-xl bg-[#FAF5FF]/60 border border-[#F3E8FF]">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="font-bold text-[#9333EA] text-[10px] block mb-0.5 uppercase">🇯🇵 Ví dụ JA:</span>
                    <p className="text-[#111827] font-sans font-medium leading-snug">"{card.example_ja || card.example_en}"</p>
                  </div>
                  <SpeechButton text={card.example_ja || card.example_en} lang="ja" size="sm" />
                </div>
              </div>
            )}

            {/* Vietnamese Translation of Example */}
            {card.example_meaning_vi && (
              <div className="p-2 rounded-xl bg-[#FFFBEB] border border-[#FDE68A]">
                <span className="font-bold text-[#92400E] text-[10px] block mb-0.5 uppercase">🇻🇳 Dịch câu ví dụ:</span>
                <p className="text-[#78350F] leading-snug font-medium">"{card.example_meaning_vi}"</p>
              </div>
            )}
          </div>

          {/* Card Footer Back */}
          <div className="pt-2.5 border-t border-[#E5E7EB] flex items-center justify-between text-xs text-[#9CA3AF]">
            <span>Nhấp thẻ để quay lại</span>
            <div className="flex items-center gap-1.5 flex-wrap">
              {showEn && <SpeechButton text={card.word_en} lang="en" size="sm" label="Đọc EN" />}
              {showZh && <SpeechButton text={card.word_zh} lang="zh" size="sm" label="Đọc ZH" />}
              {showJa && <SpeechButton text={card.word_ja || card.word_en} lang="ja" size="sm" label="Đọc JA" />}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
