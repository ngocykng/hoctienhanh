import React, { useState, useEffect, useCallback } from 'react';
import { VocabCard, Topic, LanguagePairMode } from '../../types/index.ts';
import Flashcard from './Flashcard.tsx';
import QuizMode from './QuizMode.tsx';
import AddWordModal from '../Notebook/AddWordModal.tsx';
import LanguageModeSelector from '../common/LanguageModeSelector.tsx';
import {
  ChevronLeft,
  ChevronRight,
  Shuffle,
  LayoutGrid,
  CreditCard,
  HelpCircle,
  Trash2,
  Dices,
  Loader2,
  Plus,
  Sparkles,
} from 'lucide-react';
import SpeechButton from '../common/SpeechButton.tsx';
import SentencePracticeModal from '../SentencePractice/SentencePracticeModal.tsx';
import SentencePracticeStudio from '../SentencePractice/SentencePracticeStudio.tsx';
import SentencePracticeBox from '../SentencePractice/SentencePracticeBox.tsx';

interface FlashcardDeckProps {
  topic: Topic;
  cards: VocabCard[];
  onDeleteTopic?: (topicId: string) => void;
  onRegenerateRandom?: (topicName: string, level?: string) => Promise<void>;
  isRegenerating?: boolean;
}

export default function FlashcardDeck({
  topic,
  cards: initialCards,
  onDeleteTopic,
  onRegenerateRandom,
  isRegenerating = false,
}: FlashcardDeckProps) {
  const [cards, setCards] = useState<VocabCard[]>(initialCards);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [viewMode, setViewMode] = useState<'flashcard' | 'list' | 'quiz' | 'practice'>('flashcard');
  const [langMode, setLangMode] = useState<LanguagePairMode>('all');
  const [learnedSet, setLearnedSet] = useState<Set<string>>(new Set());
  const [isAddWordModalOpen, setIsAddWordModalOpen] = useState(false);
  const [practiceModalCard, setPracticeModalCard] = useState<VocabCard | null>(null);
  const [showInlinePractice, setShowInlinePractice] = useState<boolean>(false);

  useEffect(() => {
    setCards(initialCards);
    setCurrentIndex(0);
  }, [initialCards, topic.id]);

  const handleNext = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % cards.length);
  }, [cards.length]);

  const handlePrev = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + cards.length) % cards.length);
  }, [cards.length]);

  const handleShuffle = () => {
    const shuffled = [...cards].sort(() => 0.5 - Math.random());
    setCards(shuffled);
    setCurrentIndex(0);
  };

  const handleToggleLearned = (cardId: string) => {
    setLearnedSet((prev) => {
      const next = new Set(prev);
      if (next.has(cardId)) {
        next.delete(cardId);
      } else {
        next.add(cardId);
      }
      return next;
    });
  };

  // Keyboard navigation
  useEffect(() => {
    if (viewMode !== 'flashcard') return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') {
        handleNext();
      } else if (e.key === 'ArrowLeft') {
        handlePrev();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleNext, handlePrev, viewMode]);

  if (!cards || cards.length === 0) {
    return (
      <div className="text-center p-8 bg-white rounded-2xl border border-[#E5E7EB] shadow-xs">
        <p className="text-[#6B7280]">Chưa có thẻ từ vựng nào trong chủ đề này.</p>
      </div>
    );
  }

  const currentCard = cards[currentIndex] || cards[0];
  const learnedCount = cards.filter((c) => learnedSet.has(c.id)).length;

  const getDifficultyColor = (diff?: string) => {
    switch (diff?.toUpperCase()) {
      case 'A1': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'A2': return 'bg-teal-50 text-teal-700 border-teal-200';
      case 'B1': return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'B2': return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      case 'C1': return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'C2': return 'bg-rose-50 text-rose-700 border-rose-200';
      default: return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  const showEn = langMode === 'all' || langMode === 'en-vi';
  const showZh = langMode === 'all' || langMode === 'zh-vi';
  const showJa = langMode === 'all' || langMode === 'ja-vi';

  return (
    <div className="space-y-6">
      {/* Deck Header & Mode Switcher */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-[#E5E7EB] shadow-xs space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-lg sm:text-xl font-bold text-[#111827]">{topic.name}</h3>
              {topic.batch && topic.batch > 1 && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-50 text-amber-800 border border-amber-200">
                  Đợt #{topic.batch}
                </span>
              )}
              {topic.level && topic.level !== 'ALL' && (
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold border ${getDifficultyColor(topic.level)}`}>
                  Cấp độ {topic.level}
                </span>
              )}
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#EFF6FF] text-[#1E40AF] border border-[#DBEAFE]">
                {cards.length} từ vựng
              </span>
            </div>
            <p className="text-xs text-[#6B7280] mt-1 font-medium">
              Đã thuộc: <span className="font-bold text-[#059669]">{learnedCount}</span> / {cards.length} thẻ
            </p>
          </div>

          {/* Action & View Switcher Controls */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              id="btn-deck-add-custom-card"
              onClick={() => setIsAddWordModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-[#EFF6FF] hover:bg-[#DBEAFE] text-[#1E40AF] border border-[#BFDBFE] rounded-full text-xs font-semibold transition-all cursor-pointer shadow-2xs"
              title="Thêm từ mới vào chủ đề này"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Thêm từ</span>
            </button>

            {onRegenerateRandom && (
              <button
                id="btn-regenerate-random-batch"
                disabled={isRegenerating}
                onClick={() => onRegenerateRandom(topic.name, topic.level)}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 rounded-full text-xs font-semibold transition-all cursor-pointer disabled:opacity-50 shadow-2xs"
                title="Tạo 15 từ vựng ngẫu nhiên mới khác cho chủ đề này"
              >
                {isRegenerating ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-700" />
                    <span>Đang đổi bộ...</span>
                  </>
                ) : (
                  <>
                    <Dices className="w-3.5 h-3.5 text-amber-700" />
                    <span>Đổi 15 từ khác</span>
                  </>
                )}
              </button>
            )}

            <div className="bg-[#F3F4F6] p-1 rounded-full flex items-center border border-[#E5E7EB]">
              <button
                id="view-mode-flashcard"
                onClick={() => setViewMode('flashcard')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                  viewMode === 'flashcard'
                    ? 'bg-white text-[#3B82F6] shadow-xs'
                    : 'text-[#4B5563] hover:text-[#111827]'
                }`}
              >
                <CreditCard className="w-3.5 h-3.5" />
                <span>Flashcard</span>
              </button>

              <button
                id="view-mode-list"
                onClick={() => setViewMode('list')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                  viewMode === 'list'
                    ? 'bg-white text-[#3B82F6] shadow-xs'
                    : 'text-[#4B5563] hover:text-[#111827]'
                }`}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span>Danh sách</span>
              </button>

              <button
                id="view-mode-quiz"
                onClick={() => setViewMode('quiz')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                  viewMode === 'quiz'
                    ? 'bg-white text-[#3B82F6] shadow-xs'
                    : 'text-[#4B5563] hover:text-[#111827]'
                }`}
              >
                <HelpCircle className="w-3.5 h-3.5" />
                <span>Trắc nghiệm</span>
              </button>

              <button
                id="view-mode-practice"
                onClick={() => setViewMode('practice')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                  viewMode === 'practice'
                    ? 'bg-white text-[#3B82F6] shadow-xs'
                    : 'text-[#4B5563] hover:text-[#111827]'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>Luyện đặt câu</span>
              </button>
            </div>

            {onDeleteTopic && (
              <button
                onClick={() => onDeleteTopic(topic.id)}
                title="Xóa chủ đề này"
                className="p-2 text-[#9CA3AF] hover:text-[#EF4444] hover:bg-[#FEE2E2] rounded-full transition-colors cursor-pointer border border-transparent"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Language Display Selector */}
        <div className="pt-3 border-t border-[#E5E7EB]">
          <LanguageModeSelector currentMode={langMode} onChange={setLangMode} />
        </div>
      </div>

      {/* Mode 1: 3D Flashcard Carousel */}
      {viewMode === 'flashcard' && (
        <div className="space-y-6">
          {/* Active Card */}
          <Flashcard
            key={currentCard.id}
            card={currentCard}
            index={currentIndex}
            total={cards.length}
            isLearned={learnedSet.has(currentCard.id)}
            onToggleLearned={handleToggleLearned}
            onPracticeSentence={(c) => setPracticeModalCard(c)}
            langMode={langMode}
          />

          {/* Navigation Controls */}
          <div className="max-w-xl mx-auto flex items-center justify-between gap-4 bg-white p-3.5 rounded-full border border-[#E5E7EB] shadow-xs">
            <button
              id="btn-prev-card"
              onClick={handlePrev}
              className="flex items-center gap-1.5 px-4 py-2 bg-[#F3F4F6] hover:bg-[#E5E7EB] text-[#111827] rounded-full text-xs font-semibold transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Thẻ trước</span>
            </button>

            {/* Progress Counter & Shuffle */}
            <div className="flex items-center gap-2.5">
              <span className="text-xs font-bold text-[#111827]">
                {currentIndex + 1} / {cards.length}
              </span>
              <button
                id="btn-shuffle-cards"
                onClick={handleShuffle}
                title="Xáo trộn ngẫu nhiên thứ tự thẻ"
                className="p-1.5 text-[#6B7280] hover:text-[#3B82F6] hover:bg-[#EFF6FF] rounded-full transition-colors cursor-pointer"
              >
                <Shuffle className="w-3.5 h-3.5" />
              </button>
            </div>

            <button
              id="btn-next-card"
              onClick={handleNext}
              className="flex items-center gap-1.5 px-4 py-2 bg-[#3B82F6] hover:bg-[#2563EB] text-white rounded-full text-xs font-semibold transition-colors cursor-pointer shadow-xs"
            >
              <span className="hidden sm:inline">Thẻ sau</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Inline Sentence Practice Section */}
          <div className="max-w-xl mx-auto">
            <button
              type="button"
              id="btn-toggle-inline-practice"
              onClick={() => setShowInlinePractice(!showInlinePractice)}
              className="w-full py-2.5 px-4 bg-gradient-to-r from-[#EFF6FF] to-white hover:from-[#DBEAFE] hover:to-[#EFF6FF] border border-[#BFDBFE] rounded-2xl text-xs font-bold text-[#1E40AF] flex items-center justify-between shadow-2xs transition-all cursor-pointer"
            >
              <span className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#3B82F6]" />
                <span>
                  Thực hành đặt câu với "{currentCard.word_en || currentCard.word_zh || currentCard.word_ja}"
                </span>
              </span>
              <span className="text-[11px] text-[#2563EB] bg-white px-2 py-0.5 rounded-md font-bold shadow-2xs border border-[#BFDBFE]">
                {showInlinePractice ? 'Thu gọn ▲' : 'Mở rộng luyện viết ▼'}
              </span>
            </button>

            {showInlinePractice && (
              <div className="mt-3">
                <SentencePracticeBox
                  key={currentCard.id}
                  card={currentCard}
                  langMode={langMode}
                  compact
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Mode 2: Full List Grid */}
      {viewMode === 'list' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {cards.map((card, idx) => {
            const isLearned = learnedSet.has(card.id);
            return (
              <div
                key={card.id}
                className={`bg-white rounded-2xl p-5 border transition-all duration-200 flex flex-col justify-between space-y-4 shadow-sm hover:shadow-md ${
                  isLearned ? 'border-[#A7F3D0] bg-[#F0FDF4]/30' : 'border-[#E5E7EB]'
                }`}
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      <div className="w-8 h-8 rounded-xl bg-[#EFF6FF] text-[#3B82F6] font-bold flex items-center justify-center text-xs">
                        #{idx + 1}
                      </div>
                      {card.difficulty && (
                        <span className={`px-2 py-0.5 text-[10px] font-extrabold rounded-md border ${getDifficultyColor(card.difficulty)}`}>
                          {card.difficulty}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        id={`btn-list-practice-${card.id}`}
                        onClick={() => setPracticeModalCard(card)}
                        title="Thực hành đặt câu với AI"
                        className="text-[10px] px-2.5 py-1 rounded-full font-bold bg-[#EFF6FF] hover:bg-[#DBEAFE] text-[#1E40AF] border border-[#BFDBFE] transition-colors cursor-pointer flex items-center gap-1 shadow-2xs"
                      >
                        <Sparkles className="w-3 h-3 text-[#3B82F6]" />
                        <span>Đặt câu</span>
                      </button>

                      <button
                        onClick={() => handleToggleLearned(card.id)}
                        className={`text-[10px] px-2.5 py-1 rounded-full font-bold transition-colors cursor-pointer ${
                          isLearned
                            ? 'bg-[#D1FAE5] text-[#065F46]'
                            : 'bg-[#F3F4F6] text-[#6B7280] hover:bg-[#E5E7EB]'
                        }`}
                      >
                        {isLearned ? '✓ Đã thuộc' : 'Chưa thuộc'}
                      </button>
                    </div>
                  </div>

                  {/* Words based on langMode */}
                  <div className="space-y-2">
                    {/* EN */}
                    {showEn && (
                      <div className="flex items-center justify-between">
                        <div className="flex flex-wrap items-baseline gap-1.5">
                          <span className="font-bold text-base text-[#111827]">{card.word_en}</span>
                          {card.ipa_en && (
                            <span className="text-xs font-mono font-medium text-[#2563EB]">
                              {card.ipa_en.startsWith('/') ? card.ipa_en : `/${card.ipa_en}/`}
                            </span>
                          )}
                        </div>
                        <SpeechButton text={card.word_en} lang="en" size="sm" />
                      </div>
                    )}

                    {/* ZH */}
                    {showZh && (
                      <div className="flex items-center justify-between text-[#EF4444]">
                        <div className="flex items-baseline gap-2">
                          <span className="font-serif font-bold text-lg">{card.word_zh}</span>
                          {card.pinyin && <span className="text-xs text-[#DC2626]">[{card.pinyin}]</span>}
                        </div>
                        <SpeechButton text={card.word_zh} lang="zh" size="sm" />
                      </div>
                    )}

                    {/* JA */}
                    {showJa && (
                      <div className="flex items-center justify-between text-[#9333EA]">
                        <div className="flex items-baseline gap-2">
                          <span className="font-sans font-bold text-lg">{card.word_ja || card.word_en}</span>
                          {card.reading_ja && <span className="text-xs text-[#9333EA]">[{card.reading_ja}]</span>}
                        </div>
                        <SpeechButton text={card.word_ja || card.word_en} lang="ja" size="sm" />
                      </div>
                    )}
                  </div>

                  {/* Meaning VI */}
                  <div className="p-2.5 bg-[#F9FAFB] rounded-xl border border-[#E5E7EB] text-xs font-semibold text-[#111827]">
                    🇻🇳 {card.meaning_vi}
                  </div>

                  {/* Examples */}
                  <div className="text-xs space-y-1 text-[#4B5563]">
                    {showEn && card.example_en && <p className="italic text-[#111827]">"{card.example_en}"</p>}
                    {showZh && card.example_zh && <p className="font-serif text-[#111827]">"{card.example_zh}"</p>}
                    {showJa && card.example_ja && <p className="font-sans text-[#111827]">"{card.example_ja}"</p>}
                    {card.example_meaning_vi && <p className="text-[#6B7280]">➔ {card.example_meaning_vi}</p>}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Mode 3: Quiz Review */}
      {viewMode === 'quiz' && (
        <QuizMode
          cards={cards}
          langMode={langMode}
          onExit={() => setViewMode('flashcard')}
          onPracticeSentence={(c) => setPracticeModalCard(c)}
        />
      )}

      {/* Mode 4: Sentence Practice Studio */}
      {viewMode === 'practice' && (
        <SentencePracticeStudio
          cards={cards}
          langMode={langMode}
          onExit={() => setViewMode('flashcard')}
        />
      )}

      {/* Sentence Practice Modal */}
      <SentencePracticeModal
        isOpen={practiceModalCard !== null}
        onClose={() => setPracticeModalCard(null)}
        card={practiceModalCard}
        langMode={langMode}
      />

      {/* Add Custom Word to Deck Modal */}
      <AddWordModal
        isOpen={isAddWordModalOpen}
        onClose={() => setIsAddWordModalOpen(false)}
        topics={[topic]}
        defaultTopicId={topic.id}
        onSuccess={(newCard) => {
          setCards((prev) => [newCard, ...prev]);
        }}
      />
    </div>
  );
};
