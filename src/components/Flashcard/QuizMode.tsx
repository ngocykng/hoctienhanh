import React, { useState, useEffect } from 'react';
import { VocabCard, LanguagePairMode } from '../../types/index.ts';
import SpeechButton from '../common/SpeechButton.tsx';
import confetti from 'canvas-confetti';
import { CheckCircle2, XCircle, RotateCcw, ArrowRight, Trophy, Sparkles } from 'lucide-react';
import SentencePracticeModal from '../SentencePractice/SentencePracticeModal.tsx';

interface QuizModeProps {
  cards: VocabCard[];
  langMode?: LanguagePairMode;
  onExit: () => void;
  onPracticeSentence?: (card: VocabCard) => void;
}

interface Question {
  card: VocabCard;
  type: 'word_to_vi' | 'vi_to_word';
  options: string[];
  correctIndex: number;
}

export default function QuizMode({
  cards,
  langMode = 'all',
  onExit,
  onPracticeSentence,
}: QuizModeProps) {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const [practiceModalCard, setPracticeModalCard] = useState<VocabCard | null>(null);

  useEffect(() => {
    buildQuiz();
  }, [cards, langMode]);

  const getWordRepresentation = (c: VocabCard) => {
    if (langMode === 'en-vi') {
      return `${c.word_en} ${c.ipa_en ? `[${c.ipa_en}]` : ''}`;
    }
    if (langMode === 'zh-vi') {
      return `${c.word_zh} ${c.pinyin ? `[${c.pinyin}]` : ''}`;
    }
    if (langMode === 'ja-vi') {
      return `${c.word_ja || c.word_en} ${c.reading_ja ? `[${c.reading_ja}]` : ''}`;
    }
    // all mode
    return `${c.word_en} / ${c.word_zh} / ${c.word_ja || c.word_en}`;
  };

  const buildQuiz = () => {
    if (!cards || cards.length === 0) return;

    // Pick up to 10 cards
    const shuffledCards = [...cards].sort(() => 0.5 - Math.random());
    const selectedCards = shuffledCards.slice(0, Math.min(10, cards.length));

    const generatedQuestions: Question[] = selectedCards.map((card) => {
      const isWordToVi = Math.random() > 0.4;
      const otherCards = cards.filter((c) => c.id !== card.id);
      const randomOthers = otherCards.sort(() => 0.5 - Math.random()).slice(0, 3);

      if (isWordToVi) {
        const wrongAnswers = randomOthers.map((c) => c.meaning_vi);
        const allOptions = Array.from(new Set([card.meaning_vi, ...wrongAnswers])).sort(() => 0.5 - Math.random());
        return {
          card,
          type: 'word_to_vi',
          options: allOptions,
          correctIndex: allOptions.indexOf(card.meaning_vi),
        };
      } else {
        const correctStr = getWordRepresentation(card);
        const wrongAnswers = randomOthers.map((c) => getWordRepresentation(c));
        const allOptions = Array.from(new Set([correctStr, ...wrongAnswers])).sort(() => 0.5 - Math.random());
        return {
          card,
          type: 'vi_to_word',
          options: allOptions,
          correctIndex: allOptions.indexOf(correctStr),
        };
      }
    });

    setQuestions(generatedQuestions);
    setCurrentIndex(0);
    setSelectedOption(null);
    setScore(0);
    setIsFinished(false);
  };

  const handleSelectOption = (index: number) => {
    if (selectedOption !== null) return; // already answered
    setSelectedOption(index);

    const currentQ = questions[currentIndex];
    if (index === currentQ.correctIndex) {
      setScore((prev) => prev + 1);
    }
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      setSelectedOption(null);
    } else {
      setIsFinished(true);
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
      });
    }
  };

  if (questions.length === 0) {
    return (
      <div className="p-8 text-center bg-white rounded-2xl border border-[#E5E7EB] shadow-xs">
        <p className="text-[#6B7280]">Cần ít nhất 4 từ vựng để tạo bài trắc nghiệm.</p>
        <button
          onClick={onExit}
          className="mt-4 px-5 py-2.5 bg-[#3B82F6] text-white rounded-full text-xs font-semibold cursor-pointer"
        >
          Quay lại
        </button>
      </div>
    );
  }

  if (isFinished) {
    const percentage = Math.round((score / questions.length) * 100);
    return (
      <div className="max-w-md mx-auto p-8 bg-white rounded-3xl border border-[#E5E7EB] text-center space-y-6 shadow-sm">
        <div className="w-16 h-16 mx-auto bg-[#EFF6FF] border border-[#DBEAFE] text-[#3B82F6] rounded-full flex items-center justify-center">
          <Trophy className="w-8 h-8" />
        </div>

        <div>
          <h3 className="text-2xl font-bold text-[#111827]">Hoàn thành bài ôn tập!</h3>
          <p className="text-[#4B5563] text-sm mt-1">
            Bạn đã trả lời đúng <span className="font-bold text-[#3B82F6]">{score}</span> / {questions.length} câu hỏi ({percentage}%)
          </p>
        </div>

        <div className="w-full bg-[#F3F4F6] h-2 rounded-full overflow-hidden">
          <div
            className="bg-[#3B82F6] h-full transition-all duration-500 rounded-full"
            style={{ width: `${percentage}%` }}
          />
        </div>

        <div className="flex gap-3 pt-2">
          <button
            onClick={buildQuiz}
            className="flex-1 inline-flex items-center justify-center gap-2 py-2.5 px-4 bg-[#F3F4F6] hover:bg-[#E5E7EB] text-[#111827] rounded-xl text-xs font-semibold transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Làm lại</span>
          </button>
          <button
            onClick={onExit}
            className="flex-1 inline-flex items-center justify-center gap-2 py-2.5 px-4 bg-[#3B82F6] hover:bg-[#2563EB] text-white rounded-xl text-xs font-semibold transition-colors cursor-pointer shadow-xs"
          >
            <span>Trở về thẻ học</span>
          </button>
        </div>
      </div>
    );
  }

  const currentQ = questions[currentIndex];
  const isAnswered = selectedOption !== null;

  return (
    <div className="max-w-xl mx-auto bg-white rounded-3xl border border-[#E5E7EB] p-6 sm:p-8 shadow-sm space-y-6">
      {/* Header Progress */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-[#EFF6FF] text-[#1E40AF] border border-[#DBEAFE]">
            Câu {currentIndex + 1} / {questions.length}
          </span>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#F3F4F6] text-[#475569]">
            {langMode === 'en-vi' ? '🇬🇧 Anh - Việt' : langMode === 'zh-vi' ? '🇨🇳 Trung - Việt' : langMode === 'ja-vi' ? '🇯🇵 Nhật - Việt' : '🌐 Đa ngữ'}
          </span>
        </div>
        <span className="text-xs font-semibold text-[#6B7280]">
          Điểm số: <span className="font-bold text-[#059669]">{score}</span>
        </span>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-[#F3F4F6] h-1.5 rounded-full overflow-hidden">
        <div
          className="bg-[#3B82F6] h-full transition-all duration-300 rounded-full"
          style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
        />
      </div>

      {/* Question Prompt */}
      <div className="p-5 bg-[#F9FAFB] rounded-2xl border border-[#E5E7EB] text-center space-y-3">
        <div className="text-[10px] font-bold text-[#6B7280] uppercase tracking-wider">
          {currentQ.type === 'word_to_vi'
            ? 'Chọn nghĩa tiếng Việt chính xác'
            : 'Chọn từ vựng phù hợp với nghĩa sau'}
        </div>

        {currentQ.type === 'word_to_vi' ? (
          <div className="space-y-2.5">
            {/* EN */}
            {(langMode === 'all' || langMode === 'en-vi') && (
              <div className="flex items-center justify-center gap-2">
                <span className="text-xl sm:text-2xl font-extrabold text-[#111827]">
                  {currentQ.card.word_en}
                </span>
                {currentQ.card.ipa_en && (
                  <span className="text-xs font-mono text-[#2563EB]">
                    {currentQ.card.ipa_en.startsWith('/') ? currentQ.card.ipa_en : `/${currentQ.card.ipa_en}/`}
                  </span>
                )}
                <SpeechButton text={currentQ.card.word_en} lang="en" size="sm" />
              </div>
            )}

            {/* ZH */}
            {(langMode === 'all' || langMode === 'zh-vi') && (
              <div className="flex items-center justify-center gap-2">
                <span className="text-xl sm:text-2xl font-semibold text-[#EF4444] font-serif">
                  {currentQ.card.word_zh}
                </span>
                {currentQ.card.pinyin && (
                  <span className="text-xs text-[#DC2626]">[{currentQ.card.pinyin}]</span>
                )}
                <SpeechButton text={currentQ.card.word_zh} lang="zh" size="sm" />
              </div>
            )}

            {/* JA */}
            {(langMode === 'all' || langMode === 'ja-vi') && (
              <div className="flex items-center justify-center gap-2">
                <span className="text-xl sm:text-2xl font-semibold text-[#9333EA] font-sans">
                  {currentQ.card.word_ja || currentQ.card.word_en}
                </span>
                {currentQ.card.reading_ja && (
                  <span className="text-xs text-[#9333EA]">[{currentQ.card.reading_ja}]</span>
                )}
                <SpeechButton text={currentQ.card.word_ja || currentQ.card.word_en} lang="ja" size="sm" />
              </div>
            )}
          </div>
        ) : (
          <div className="text-lg font-bold text-[#111827]">{currentQ.card.meaning_vi}</div>
        )}
      </div>

      {/* Options */}
      <div className="space-y-2.5">
        {currentQ.options.map((opt, idx) => {
          let btnStyle = 'border-[#E5E7EB] bg-white hover:bg-[#F9FAFB] text-[#111827]';

          if (isAnswered) {
            if (idx === currentQ.correctIndex) {
              btnStyle = 'border-[#A7F3D0] bg-[#ECFDF5] text-[#065F46] font-bold ring-1 ring-[#059669]';
            } else if (idx === selectedOption) {
              btnStyle = 'border-[#FECACA] bg-[#FEF2F2] text-[#991B1B] font-bold';
            } else {
              btnStyle = 'border-[#E5E7EB] bg-[#F9FAFB] text-[#9CA3AF] opacity-50';
            }
          }

          return (
            <button
              key={idx}
              id={`quiz-option-${idx}`}
              onClick={() => handleSelectOption(idx)}
              disabled={isAnswered}
              className={`w-full p-3.5 rounded-2xl border text-left text-xs sm:text-sm font-semibold flex items-center justify-between transition-all duration-150 cursor-pointer disabled:cursor-default ${btnStyle}`}
            >
              <span>{opt}</span>
              {isAnswered && idx === currentQ.correctIndex && (
                <CheckCircle2 className="w-4 h-4 text-[#059669] shrink-0" />
              )}
              {isAnswered && idx === selectedOption && idx !== currentQ.correctIndex && (
                <XCircle className="w-4 h-4 text-[#EF4444] shrink-0" />
              )}
            </button>
          );
        })}
      </div>

      {/* Footer / Next */}
      {isAnswered && (
        <div className="pt-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-[#E5E7EB]">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`text-xs font-semibold ${selectedOption === currentQ.correctIndex ? 'text-[#059669]' : 'text-[#EF4444]'}`}>
              {selectedOption === currentQ.correctIndex ? '✓ Chính xác!' : 'Chưa chính xác.'}
            </span>
            <button
              type="button"
              id="btn-quiz-practice-sentence"
              onClick={() => {
                if (onPracticeSentence) {
                  onPracticeSentence(currentQ.card);
                } else {
                  setPracticeModalCard(currentQ.card);
                }
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#EFF6FF] hover:bg-[#DBEAFE] text-[#1E40AF] border border-[#BFDBFE] rounded-xl text-xs font-bold transition-all cursor-pointer shadow-2xs"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#3B82F6]" />
              <span>Thực hành đặt câu</span>
            </button>
          </div>

          <button
            id="btn-quiz-next"
            onClick={handleNext}
            className="inline-flex items-center justify-center gap-1.5 px-5 py-2.5 bg-[#3B82F6] hover:bg-[#2563EB] text-white rounded-xl text-xs font-semibold transition-colors cursor-pointer shadow-xs"
          >
            <span>{currentIndex < questions.length - 1 ? 'Câu tiếp theo' : 'Xem kết quả'}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Sentence Practice Modal */}
      <SentencePracticeModal
        isOpen={practiceModalCard !== null}
        onClose={() => setPracticeModalCard(null)}
        card={practiceModalCard}
        langMode={langMode}
      />
    </div>
  );
};

