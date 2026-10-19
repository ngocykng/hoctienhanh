import React, { useState, useEffect, useMemo } from 'react';
import { VocabCard, Topic, LanguagePairMode } from '../types/index.ts';
import {
  getAllNotebookCards,
  deleteCard,
  toggleCardLearned,
  createTopic,
} from '../services/api.ts';
import Flashcard from '../components/Flashcard/Flashcard.tsx';
import QuizMode from '../components/Flashcard/QuizMode.tsx';
import SpeechButton from '../components/common/SpeechButton.tsx';
import LanguageModeSelector from '../components/common/LanguageModeSelector.tsx';
import AddWordModal from '../components/Notebook/AddWordModal.tsx';
import EditWordModal from '../components/Notebook/EditWordModal.tsx';
import SentencePracticeModal from '../components/SentencePractice/SentencePracticeModal.tsx';
import SentencePracticeStudio from '../components/SentencePractice/SentencePracticeStudio.tsx';
import SentencePracticeBox from '../components/SentencePractice/SentencePracticeBox.tsx';
import {
  BookMarked,
  Plus,
  Search,
  CheckCircle2,
  Clock,
  Sparkles,
  CreditCard,
  LayoutGrid,
  HelpCircle,
  Edit3,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Shuffle,
  AlertCircle,
  FolderPlus,
  BookOpen,
  Check,
  Loader2,
} from 'lucide-react';

interface MyNotebookPageProps {
  initialOpenAddModal?: boolean;
  onModalClosed?: () => void;
}

export default function MyNotebookPage({
  initialOpenAddModal = false,
  onModalClosed,
}: MyNotebookPageProps) {
  const [cards, setCards] = useState<VocabCard[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedTopicFilter, setSelectedTopicFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'LEARNED' | 'LEARNING'>('ALL');
  const [levelFilter, setLevelFilter] = useState<string>('ALL');
  const [langMode, setLangMode] = useState<LanguagePairMode>('all');

  // Study View Mode
  const [viewMode, setViewMode] = useState<'flashcard' | 'list' | 'quiz' | 'practice'>('flashcard');
  const [currentDeckIndex, setCurrentDeckIndex] = useState<number>(0);
  const [practiceModalCard, setPracticeModalCard] = useState<VocabCard | null>(null);
  const [showInlinePractice, setShowInlinePractice] = useState<boolean>(false);

  // Modal States
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(initialOpenAddModal);
  const [editingCard, setEditingCard] = useState<VocabCard | null>(null);
  const [deleteTargetCard, setDeleteTargetCard] = useState<{ id: string; name: string } | null>(null);
  const [isDeletingCard, setIsDeletingCard] = useState<boolean>(false);

  // Quick Topic Creation state
  const [isCreatingTopic, setIsCreatingTopic] = useState<boolean>(false);
  const [newTopicName, setNewTopicName] = useState<string>('');

  useEffect(() => {
    loadAllData();
  }, []);

  useEffect(() => {
    if (initialOpenAddModal) {
      setIsAddModalOpen(true);
    }
  }, [initialOpenAddModal]);

  const loadAllData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await getAllNotebookCards();
      setCards(res.cards);
      setTopics(res.topics);
    } catch (err: any) {
      setError(err.message || 'Lỗi khi tải danh sách từ vựng');
    } finally {
      setIsLoading(false);
    }
  };

  // Filtered Cards
  const filteredCards = useMemo(() => {
    return cards.filter((c) => {
      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchEn = c.word_en?.toLowerCase().includes(q);
        const matchIpa = c.ipa_en?.toLowerCase().includes(q);
        const matchZh = c.word_zh?.toLowerCase().includes(q);
        const matchPinyin = c.pinyin?.toLowerCase().includes(q);
        const matchJa = c.word_ja?.toLowerCase().includes(q);
        const matchReadingJa = c.reading_ja?.toLowerCase().includes(q);
        const matchVi = c.meaning_vi?.toLowerCase().includes(q);
        const matchExEn = c.example_en?.toLowerCase().includes(q);
        const matchExZh = c.example_zh?.toLowerCase().includes(q);
        const matchExJa = c.example_ja?.toLowerCase().includes(q);
        const matchExVi = c.example_meaning_vi?.toLowerCase().includes(q);

        if (
          !matchEn &&
          !matchIpa &&
          !matchZh &&
          !matchPinyin &&
          !matchJa &&
          !matchReadingJa &&
          !matchVi &&
          !matchExEn &&
          !matchExZh &&
          !matchExJa &&
          !matchExVi
        ) {
          return false;
        }
      }

      // Topic filter
      if (selectedTopicFilter !== 'ALL' && c.topic_id !== selectedTopicFilter) {
        return false;
      }

      // Status filter
      if (statusFilter === 'LEARNED' && !c.learned) return false;
      if (statusFilter === 'LEARNING' && c.learned) return false;

      // Level filter
      if (levelFilter !== 'ALL' && c.difficulty !== levelFilter) {
        return false;
      }

      return true;
    });
  }, [cards, searchQuery, selectedTopicFilter, statusFilter, levelFilter]);

  // Statistics
  const totalCount = cards.length;
  const learnedCount = cards.filter((c) => c.learned).length;
  const learningCount = totalCount - learnedCount;
  const masteryPercentage = totalCount > 0 ? Math.round((learnedCount / totalCount) * 100) : 0;

  // Deck handlers
  const handleNextCard = () => {
    if (filteredCards.length === 0) return;
    setCurrentDeckIndex((prev) => (prev + 1) % filteredCards.length);
  };

  const handlePrevCard = () => {
    if (filteredCards.length === 0) return;
    setCurrentDeckIndex((prev) => (prev - 1 + filteredCards.length) % filteredCards.length);
  };

  const handleShuffleDeck = () => {
    const shuffled = [...cards].sort(() => 0.5 - Math.random());
    setCards(shuffled);
    setCurrentDeckIndex(0);
  };

  const handleToggleLearnedStatus = async (cardId: string) => {
    try {
      const updated = await toggleCardLearned(cardId);
      setCards((prev) => prev.map((c) => (c.id === cardId ? updated : c)));
    } catch (err: any) {
      // Local fallback
      setCards((prev) =>
        prev.map((c) => (c.id === cardId ? { ...c, learned: !c.learned } : c))
      );
    }
  };

  const handleDeleteCard = (cardId: string, wordEn: string) => {
    setDeleteTargetCard({ id: cardId, name: wordEn || 'từ vựng này' });
  };

  const handleConfirmDeleteFromDialog = async () => {
    if (!deleteTargetCard) return;
    setIsDeletingCard(true);
    setError(null);
    try {
      await deleteCard(deleteTargetCard.id);
      setCards((prev) => prev.filter((c) => c.id !== deleteTargetCard.id));
      setSuccessMsg(`Đã xóa thẻ "${deleteTargetCard.name}" thành công.`);
      setTimeout(() => setSuccessMsg(null), 3000);
      setDeleteTargetCard(null);
    } catch (err: any) {
      setError(err.message || 'Lỗi khi xóa thẻ từ vựng');
    } finally {
      setIsDeletingCard(false);
    }
  };

  const handleCreateNewTopic = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTopicName.trim()) return;
    try {
      const created = await createTopic(newTopicName.trim());
      setTopics((prev) => [created, ...prev]);
      setSelectedTopicFilter(created.id);
      setNewTopicName('');
      setIsCreatingTopic(false);
      setSuccessMsg(`Đã tạo sổ tay mới: "${created.name}"`);
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      setError(err.message || 'Lỗi khi tạo sổ tay mới');
    }
  };

  const handleAddCardSuccess = (newCard: VocabCard, returnedTopic?: Topic) => {
    setCards((prev) => [newCard, ...prev]);

    // Update topics state
    if (returnedTopic) {
      setTopics((prev) => {
        const exists = prev.some((t) => t.id === returnedTopic.id);
        if (!exists) {
          return [{ ...returnedTopic, card_count: Math.max(1, returnedTopic.card_count || 1) }, ...prev];
        }
        return prev.map((t) =>
          t.id === returnedTopic.id
            ? { ...t, card_count: (t.card_count || 0) + 1 }
            : t
        );
      });
    } else if (newCard.topic_id) {
      setTopics((prev) =>
        prev.map((t) =>
          t.id === newCard.topic_id
            ? { ...t, card_count: (t.card_count || 0) + 1 }
            : t
        )
      );
    }

    // Automatically switch the notebook filter to the target notebook so the user immediately sees their word!
    if (newCard.topic_id) {
      setSelectedTopicFilter(newCard.topic_id);
    }

    // Reset deck view to show the newly added card first
    setCurrentDeckIndex(0);

    const targetTopicName =
      returnedTopic?.name ||
      topics.find((t) => t.id === newCard.topic_id)?.name ||
      'Sổ tay';
    const wordDisplay =
      newCard.word_en || newCard.word_zh || newCard.word_ja || 'mới';
    setSuccessMsg(
      `Đã thêm từ "${wordDisplay}" vào sổ tay "${targetTopicName}" thành công!`
    );
    setTimeout(() => setSuccessMsg(null), 3500);
  };

  const handleEditCardSuccess = (updated: VocabCard) => {
    setCards((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
    const targetTopicName = topics.find((t) => t.id === updated.topic_id)?.name || 'Sổ tay';
    setSuccessMsg(`Đã cập nhật thẻ "${updated.word_en || updated.word_zh || updated.word_ja}" trong sổ "${targetTopicName}" thành công!`);
    setTimeout(() => setSuccessMsg(null), 3000);
  };

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

  const activeCard = filteredCards[currentDeckIndex] || filteredCards[0];

  const showEn = langMode === 'all' || langMode === 'en-vi';
  const showZh = langMode === 'all' || langMode === 'zh-vi';
  const showJa = langMode === 'all' || langMode === 'ja-vi';

  return (
    <div className="space-y-6">
      {/* ================= HEADER & STATS HERO ================= */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 border border-[#E5E7EB] shadow-xs space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-[#EFF6FF] border border-[#DBEAFE] text-[#3B82F6] flex items-center justify-center">
              <BookMarked className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-[#111827]">
                Sổ tay từ vựng của tôi
              </h2>
              <p className="text-xs text-[#6B7280]">
                Quản lý, học với Flashcard 3D và ôn tập đa ngôn ngữ (Anh · Trung · Nhật · Việt)
              </p>
            </div>
          </div>

          {/* Action Buttons: Add Word & Create Topic */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              id="btn-open-create-topic"
              onClick={() => setIsCreatingTopic((prev) => !prev)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-[#4B5563] bg-[#F9FAFB] hover:bg-[#F3F4F6] border border-[#E5E7EB] transition-colors cursor-pointer"
            >
              <FolderPlus className="w-3.5 h-3.5 text-[#3B82F6]" />
              <span>Tạo Sổ tay mới</span>
            </button>

            <button
              id="btn-open-add-word-modal"
              onClick={() => setIsAddModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#3B82F6] hover:bg-[#2563EB] text-white rounded-xl text-xs font-bold transition-all duration-150 cursor-pointer shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>Thêm từ vựng mới</span>
            </button>
          </div>
        </div>

        {/* Create Topic Inline Form */}
        {isCreatingTopic && (
          <form
            onSubmit={handleCreateNewTopic}
            className="p-3.5 bg-[#EFF6FF] rounded-2xl border border-[#DBEAFE] flex items-center gap-2 animate-in fade-in duration-150"
          >
            <input
              type="text"
              id="input-new-topic-name"
              value={newTopicName}
              onChange={(e) => setNewTopicName(e.target.value)}
              placeholder="Nhập tên Sổ tay mới (VD: Tiếng Nhật N3, Từ vựng TOEIC, Du lịch Bắc Kinh...)"
              className="flex-1 px-3 py-2 text-xs rounded-xl bg-white border border-[#DBEAFE] text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#3B82F6] font-medium"
              autoFocus
            />
            <button
              type="submit"
              id="btn-submit-create-topic"
              className="px-4 py-2 bg-[#3B82F6] hover:bg-[#2563EB] text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
            >
              Tạo Sổ
            </button>
            <button
              type="button"
              onClick={() => setIsCreatingTopic(false)}
              className="px-3 py-2 text-xs text-[#6B7280] hover:text-[#111827] font-semibold cursor-pointer"
            >
              Hủy
            </button>
          </form>
        )}

        {/* Stats Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
          <div className="p-4 bg-[#F9FAFB] rounded-2xl border border-[#E5E7EB]">
            <span className="text-[11px] font-bold text-[#6B7280] uppercase tracking-wider block mb-1">
              Tổng số từ vựng
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-extrabold text-[#111827]">
                {totalCount}
              </span>
              <span className="text-xs text-[#6B7280] font-semibold">thẻ từ</span>
            </div>
          </div>

          <div className="p-4 bg-[#ECFDF5] rounded-2xl border border-[#A7F3D0]">
            <span className="text-[11px] font-bold text-[#065F46] uppercase tracking-wider block mb-1">
              Đã thuộc thành thạo
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-extrabold text-[#059669]">
                {learnedCount}
              </span>
              <span className="text-xs text-[#065F46] font-semibold">({masteryPercentage}%)</span>
            </div>
          </div>

          <div className="p-4 bg-[#FFFBEB] rounded-2xl border border-[#FDE68A]">
            <span className="text-[11px] font-bold text-[#92400E] uppercase tracking-wider block mb-1">
              Cần ôn tập thêm
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-extrabold text-[#D97706]">
                {learningCount}
              </span>
              <span className="text-xs text-[#92400E] font-semibold">thẻ</span>
            </div>
          </div>

          <div className="p-4 bg-[#EFF6FF] rounded-2xl border border-[#DBEAFE]">
            <span className="text-[11px] font-bold text-[#1E40AF] uppercase tracking-wider block mb-1">
              Số lượng Sổ tay
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-extrabold text-[#2563EB]">
                {topics.length}
              </span>
              <span className="text-xs text-[#1E40AF] font-semibold">danh mục</span>
            </div>
          </div>
        </div>
      </div>

      {/* Status Messages */}
      {error && (
        <div className="p-4 bg-[#FEE2E2] border border-[#FECACA] text-[#991B1B] rounded-2xl flex items-center gap-3 text-xs font-semibold">
          <AlertCircle className="w-4 h-4 text-[#EF4444] shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-4 bg-[#ECFDF5] border border-[#A7F3D0] text-[#065F46] rounded-2xl flex items-center gap-3 text-xs font-semibold">
          <Check className="w-4 h-4 text-[#059669] shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* ================= TOOLBAR: SEARCH, FILTERS & STUDY MODES ================= */}
      <div className="bg-white rounded-3xl p-4 sm:p-5 border border-[#E5E7EB] shadow-xs space-y-4">
        {/* Language Display Mode Filter */}
        <div className="pb-3 border-b border-[#E5E7EB]">
          <LanguageModeSelector currentMode={langMode} onChange={setLangMode} />
        </div>

        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-[#9CA3AF] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              id="input-search-notebook"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm kiếm tiếng Anh, Hán tự, Kanji/Kana, Romaji hoặc nghĩa tiếng Việt..."
              className="w-full pl-10 pr-4 py-2.5 text-xs rounded-xl bg-[#F9FAFB] border border-[#E5E7EB] text-[#111827] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#3B82F6] font-medium"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#9CA3AF] hover:text-[#111827] cursor-pointer"
              >
                ✕
              </button>
            )}
          </div>

          {/* View Mode Switcher */}
          <div className="bg-[#F3F4F6] p-1 rounded-full flex items-center border border-[#E5E7EB] shrink-0">
            <button
              id="notebook-mode-flashcard"
              onClick={() => setViewMode('flashcard')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                viewMode === 'flashcard'
                  ? 'bg-white text-[#3B82F6] shadow-xs'
                  : 'text-[#4B5563] hover:text-[#111827]'
              }`}
            >
              <CreditCard className="w-3.5 h-3.5" />
              <span>Flashcard 3D</span>
            </button>

            <button
              id="notebook-mode-list"
              onClick={() => setViewMode('list')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                viewMode === 'list'
                  ? 'bg-white text-[#3B82F6] shadow-xs'
                  : 'text-[#4B5563] hover:text-[#111827]'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Danh sách ({filteredCards.length})</span>
            </button>

            <button
              id="notebook-mode-quiz"
              onClick={() => setViewMode('quiz')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                viewMode === 'quiz'
                  ? 'bg-white text-[#3B82F6] shadow-xs'
                  : 'text-[#4B5563] hover:text-[#111827]'
              }`}
            >
              <HelpCircle className="w-3.5 h-3.5" />
              <span>Trắc nghiệm</span>
            </button>

            <button
              id="notebook-mode-practice"
              onClick={() => setViewMode('practice')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                viewMode === 'practice'
                  ? 'bg-white text-[#3B82F6] shadow-xs'
                  : 'text-[#4B5563] hover:text-[#111827]'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>Luyện đặt câu</span>
            </button>
          </div>
        </div>

        {/* Filter Pills Bar */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-[#E5E7EB] text-xs">
          {/* Topic Select */}
          <div className="flex items-center gap-1.5">
            <span className="text-[#6B7280] font-semibold text-[11px]">Sổ tay:</span>
            <select
              value={selectedTopicFilter}
              onChange={(e) => setSelectedTopicFilter(e.target.value)}
              className="px-2.5 py-1 rounded-lg bg-[#F9FAFB] border border-[#E5E7EB] text-[#111827] font-semibold text-xs focus:outline-none focus:ring-2 focus:ring-[#3B82F6]"
            >
              <option value="ALL">Tất cả sổ tay ({cards.length})</option>
              {topics.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} ({cards.filter((c) => c.topic_id === t.id).length})
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1.5 ml-2">
            <span className="text-[#6B7280] font-semibold text-[11px]">Trạng thái:</span>
            <div className="inline-flex rounded-lg border border-[#E5E7EB] bg-[#F9FAFB] p-0.5">
              <button
                onClick={() => setStatusFilter('ALL')}
                className={`px-2 py-0.5 rounded-md text-[11px] font-bold cursor-pointer ${
                  statusFilter === 'ALL' ? 'bg-white text-[#3B82F6] shadow-2xs' : 'text-[#6B7280]'
                }`}
              >
                Tất cả
              </button>
              <button
                onClick={() => setStatusFilter('LEARNING')}
                className={`px-2 py-0.5 rounded-md text-[11px] font-bold cursor-pointer ${
                  statusFilter === 'LEARNING' ? 'bg-white text-[#D97706] shadow-2xs' : 'text-[#6B7280]'
                }`}
              >
                Chưa thuộc ({learningCount})
              </button>
              <button
                onClick={() => setStatusFilter('LEARNED')}
                className={`px-2 py-0.5 rounded-md text-[11px] font-bold cursor-pointer ${
                  statusFilter === 'LEARNED' ? 'bg-white text-[#059669] shadow-2xs' : 'text-[#6B7280]'
                }`}
              >
                Đã thuộc ({learnedCount})
              </button>
            </div>
          </div>

          {/* Level Filter */}
          <div className="flex items-center gap-1.5 ml-2">
            <span className="text-[#6B7280] font-semibold text-[11px]">Cấp độ:</span>
            <select
              value={levelFilter}
              onChange={(e) => setLevelFilter(e.target.value)}
              className="px-2.5 py-1 rounded-lg bg-[#F9FAFB] border border-[#E5E7EB] text-[#111827] font-semibold text-xs focus:outline-none focus:ring-2 focus:ring-[#3B82F6]"
            >
              <option value="ALL">Tất cả cấp độ</option>
              {['A1', 'A2', 'B1', 'B2', 'C1', 'C2'].map((lvl) => (
                <option key={lvl} value={lvl}>
                  Trình độ {lvl}
                </option>
              ))}
            </select>
          </div>

          {/* Reset Filters */}
          {(searchQuery || selectedTopicFilter !== 'ALL' || statusFilter !== 'ALL' || levelFilter !== 'ALL') && (
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedTopicFilter('ALL');
                setStatusFilter('ALL');
                setLevelFilter('ALL');
              }}
              className="ml-auto text-[11px] font-bold text-[#EF4444] hover:underline cursor-pointer"
            >
              Xóa bộ lọc
            </button>
          )}
        </div>
      </div>

      {/* ================= EMPTY STATE ================= */}
      {filteredCards.length === 0 && !isLoading && (
        <div className="bg-white rounded-3xl p-12 border border-[#E5E7EB] text-center space-y-4 shadow-xs">
          <BookOpen className="w-12 h-12 text-[#9CA3AF] mx-auto" />
          <h4 className="text-base font-bold text-[#111827]">
            {cards.length === 0
              ? 'Sổ tay của bạn chưa có từ vựng nào'
              : 'Không tìm thấy từ vựng khớp với bộ lọc hiện tại'}
          </h4>
          <p className="text-xs text-[#6B7280] max-w-md mx-auto">
            {cards.length === 0
              ? 'Hãy bấm nút "Thêm từ vựng mới" ở trên để nhập từ đầu tiên. AI sẽ tự động điền đầy đủ cả 3 thứ tiếng (Anh, Trung, Nhật) và ví dụ cho bạn!'
              : 'Hãy thử tìm kiếm với từ khóa khác hoặc xóa bớt bộ lọc để hiển thị danh sách từ.'}
          </p>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#3B82F6] hover:bg-[#2563EB] text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Thêm từ vựng ngay</span>
          </button>
        </div>
      )}

      {/* ================= VIEW 1: 3D FLASHCARD CAROUSEL ================= */}
      {viewMode === 'flashcard' && filteredCards.length > 0 && activeCard && (
        <div className="space-y-6">
          <Flashcard
            key={activeCard.id}
            card={activeCard}
            index={currentDeckIndex}
            total={filteredCards.length}
            isLearned={activeCard.learned}
            onToggleLearned={handleToggleLearnedStatus}
            onPracticeSentence={(c) => setPracticeModalCard(c)}
            langMode={langMode}
          />

          {/* Controls Bar */}
          <div className="max-w-xl mx-auto flex items-center justify-between gap-4 bg-white p-3.5 rounded-full border border-[#E5E7EB] shadow-xs">
            <button
              id="btn-notebook-prev-card"
              onClick={handlePrevCard}
              className="flex items-center gap-1.5 px-4 py-2 bg-[#F3F4F6] hover:bg-[#E5E7EB] text-[#111827] rounded-full text-xs font-semibold transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Thẻ trước</span>
            </button>

            <div className="flex items-center gap-3">
              <span className="text-xs font-bold text-[#111827]">
                {currentDeckIndex + 1} / {filteredCards.length}
              </span>
              <button
                onClick={handleShuffleDeck}
                title="Xáo trộn ngẫu nhiên thẻ"
                className="p-1.5 text-[#6B7280] hover:text-[#3B82F6] hover:bg-[#EFF6FF] rounded-full transition-colors cursor-pointer"
              >
                <Shuffle className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setEditingCard(activeCard)}
                title="Chỉnh sửa thẻ này"
                className="p-1.5 text-[#6B7280] hover:text-[#3B82F6] hover:bg-[#EFF6FF] rounded-full transition-colors cursor-pointer"
              >
                <Edit3 className="w-3.5 h-3.5" />
              </button>
              <button
                id="btn-notebook-delete-current-card"
                onClick={() => handleDeleteCard(activeCard.id, activeCard.word_en || activeCard.word_zh || activeCard.word_ja)}
                title="Xóa thẻ này khỏi sổ tay"
                className="p-1.5 text-[#6B7280] hover:text-[#EF4444] hover:bg-[#FEE2E2] rounded-full transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>

            <button
              id="btn-notebook-next-card"
              onClick={handleNextCard}
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
              id="btn-notebook-toggle-inline-practice"
              onClick={() => setShowInlinePractice(!showInlinePractice)}
              className="w-full py-2.5 px-4 bg-gradient-to-r from-[#EFF6FF] to-white hover:from-[#DBEAFE] hover:to-[#EFF6FF] border border-[#BFDBFE] rounded-2xl text-xs font-bold text-[#1E40AF] flex items-center justify-between shadow-2xs transition-all cursor-pointer"
            >
              <span className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#3B82F6]" />
                <span>
                  Thực hành đặt câu với "{activeCard.word_en || activeCard.word_zh || activeCard.word_ja}"
                </span>
              </span>
              <span className="text-[11px] text-[#2563EB] bg-white px-2 py-0.5 rounded-md font-bold shadow-2xs border border-[#BFDBFE]">
                {showInlinePractice ? 'Thu gọn ▲' : 'Mở rộng luyện viết ▼'}
              </span>
            </button>

            {showInlinePractice && (
              <div className="mt-3">
                <SentencePracticeBox
                  key={activeCard.id}
                  card={activeCard}
                  langMode={langMode}
                  compact
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* ================= VIEW 2: LIST & MANAGEMENT GRID ================= */}
      {viewMode === 'list' && filteredCards.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredCards.map((card, idx) => {
            const isLearned = !!card.learned;
            const topicOfCard = topics.find((t) => t.id === card.topic_id);
            return (
              <div
                key={card.id}
                id={`notebook-card-item-${card.id}`}
                className={`bg-white rounded-2xl p-5 border transition-all duration-200 flex flex-col justify-between space-y-4 shadow-xs hover:shadow-md ${
                  isLearned ? 'border-[#A7F3D0] bg-[#F0FDF4]/30' : 'border-[#E5E7EB]'
                }`}
              >
                <div className="space-y-3">
                  {/* Top info & action buttons */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <div className="w-7 h-7 rounded-xl bg-[#EFF6FF] text-[#3B82F6] font-bold flex items-center justify-center text-xs">
                        #{idx + 1}
                      </div>
                      {card.difficulty && (
                        <span className={`px-2 py-0.5 text-[10px] font-extrabold rounded-md border ${getDifficultyColor(card.difficulty)}`}>
                          {card.difficulty}
                        </span>
                      )}
                      {topicOfCard && (
                        <span className="text-[10px] px-2 py-0.5 rounded-md bg-[#F3F4F6] text-[#4B5563] font-medium truncate max-w-[110px]">
                          {topicOfCard.name}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        id={`btn-notebook-practice-${card.id}`}
                        onClick={() => setPracticeModalCard(card)}
                        title="Thực hành đặt câu với AI"
                        className="text-[10px] px-2.5 py-0.5 rounded-full font-bold bg-[#EFF6FF] hover:bg-[#DBEAFE] text-[#1E40AF] border border-[#BFDBFE] transition-colors cursor-pointer flex items-center gap-1 shadow-2xs"
                      >
                        <Sparkles className="w-3 h-3 text-[#3B82F6]" />
                        <span>Đặt câu</span>
                      </button>

                      <button
                        onClick={() => handleToggleLearnedStatus(card.id)}
                        className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold transition-colors cursor-pointer ${
                          isLearned
                            ? 'bg-[#D1FAE5] text-[#065F46]'
                            : 'bg-[#F3F4F6] text-[#6B7280] hover:bg-[#E5E7EB]'
                        }`}
                      >
                        {isLearned ? '✓ Đã thuộc' : 'Chưa thuộc'}
                      </button>

                      <button
                        onClick={() => setEditingCard(card)}
                        title="Chỉnh sửa thẻ"
                        className="p-1.5 text-[#9CA3AF] hover:text-[#3B82F6] hover:bg-[#EFF6FF] rounded-lg transition-colors cursor-pointer"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => handleDeleteCard(card.id, card.word_en || card.word_zh || card.word_ja)}
                        title="Xóa thẻ"
                        className="p-1.5 text-[#9CA3AF] hover:text-[#EF4444] hover:bg-[#FEE2E2] rounded-lg transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Vocabulary presentation based on langMode */}
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

                  {/* Vietnamese Definition */}
                  <div className="p-2.5 bg-[#F9FAFB] rounded-xl border border-[#E5E7EB] text-xs font-semibold text-[#111827]">
                    🇻🇳 {card.meaning_vi}
                  </div>

                  {/* Context Examples */}
                  {(card.example_en || card.example_zh || card.example_ja || card.example_meaning_vi) && (
                    <div className="text-xs space-y-1 text-[#4B5563] pt-1">
                      {showEn && card.example_en && <p className="italic text-[#111827]">"{card.example_en}"</p>}
                      {showZh && card.example_zh && <p className="font-serif text-[#111827]">"{card.example_zh}"</p>}
                      {showJa && card.example_ja && <p className="font-sans text-[#111827]">"{card.example_ja}"</p>}
                      {card.example_meaning_vi && <p className="text-[#6B7280]">➔ {card.example_meaning_vi}</p>}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ================= VIEW 3: QUIZ TEST MODE ================= */}
      {viewMode === 'quiz' && filteredCards.length > 0 && (
        <QuizMode
          cards={filteredCards}
          langMode={langMode}
          onExit={() => setViewMode('flashcard')}
          onPracticeSentence={(c) => setPracticeModalCard(c)}
        />
      )}

      {/* ================= VIEW 4: SENTENCE PRACTICE STUDIO ================= */}
      {viewMode === 'practice' && filteredCards.length > 0 && (
        <SentencePracticeStudio
          cards={filteredCards}
          langMode={langMode}
          onExit={() => setViewMode('flashcard')}
        />
      )}

      {/* ================= MODALS ================= */}
      <SentencePracticeModal
        isOpen={practiceModalCard !== null}
        onClose={() => setPracticeModalCard(null)}
        card={practiceModalCard}
        langMode={langMode}
      />

      <AddWordModal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          if (onModalClosed) onModalClosed();
        }}
        topics={topics}
        defaultTopicId={selectedTopicFilter !== 'ALL' ? selectedTopicFilter : undefined}
        onSuccess={handleAddCardSuccess}
      />

      {editingCard && (
        <EditWordModal
          isOpen={true}
          onClose={() => setEditingCard(null)}
          card={editingCard}
          topics={topics}
          onSuccess={handleEditCardSuccess}
          onDelete={(deletedCardId) => {
            setCards((prev) => prev.filter((c) => c.id !== deletedCardId));
            setSuccessMsg(`Đã xóa thẻ từ vựng thành công.`);
            setTimeout(() => setSuccessMsg(null), 3000);
          }}
        />
      )}

      {/* Delete Confirmation Dialog Modal */}
      {deleteTargetCard && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full border border-[#E5E7EB] shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="w-12 h-12 rounded-2xl bg-[#FEF2F2] border border-[#FECACA] flex items-center justify-center text-[#DC2626] mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1.5">
              <h3 className="text-base font-extrabold text-[#111827]">
                Xác nhận xóa thẻ từ vựng?
              </h3>
              <p className="text-xs text-[#6B7280] leading-relaxed">
                Bạn có chắc chắn muốn xóa thẻ từ <span className="font-bold text-[#111827]">"{deleteTargetCard.name}"</span> khỏi Sổ tay từ vựng không? Hành động này không thể hoàn tác.
              </p>
            </div>

            <div className="flex items-center gap-2.5 pt-2">
              <button
                type="button"
                id="btn-dialog-cancel-delete"
                disabled={isDeletingCard}
                onClick={() => setDeleteTargetCard(null)}
                className="flex-1 py-2.5 rounded-xl border border-[#E5E7EB] text-xs font-semibold text-[#4B5563] hover:bg-[#F3F4F6] transition-colors cursor-pointer"
              >
                Hủy bỏ
              </button>

              <button
                type="button"
                id="btn-dialog-confirm-delete"
                disabled={isDeletingCard}
                onClick={handleConfirmDeleteFromDialog}
                className="flex-1 inline-flex items-center justify-center gap-1.5 py-2.5 bg-[#DC2626] hover:bg-[#B91C1C] text-white rounded-xl text-xs font-bold transition-colors cursor-pointer disabled:opacity-50"
              >
                {isDeletingCard ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Đang xóa...</span>
                  </>
                ) : (
                  <span>Xóa vĩnh viễn</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
