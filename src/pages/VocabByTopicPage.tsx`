import React, { useState, useEffect } from 'react';
import { Topic, VocabCard } from '../types/index.ts';
import { generateVocab, getTopics, getTopicCards, deleteTopic } from '../services/api.ts';
import TopicInput from '../components/TopicInput/TopicInput.tsx';
import FlashcardDeck from '../components/Flashcard/FlashcardDeck.tsx';
import { BookOpen, Sparkles, FolderOpen, AlertCircle, Clock, Check, Layers, ChevronRight } from 'lucide-react';

export default function VocabByTopicPage() {
  const [topics, setTopics] = useState<Topic[]>([]);
  const [selectedTopic, setSelectedTopic] = useState<Topic | null>(null);
  const [cards, setCards] = useState<VocabCard[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Load initial topics
  useEffect(() => {
    loadTopics();
  }, []);

  const loadTopics = async () => {
    try {
      const fetched = await getTopics();
      setTopics(fetched);
      if (Array.isArray(fetched) && fetched.length > 0 && !selectedTopic) {
        loadCardsForTopic(fetched[0].id);
      }
    } catch (err: any) {
      console.error('Error loading topics:', err);
    }
  };

  const loadCardsForTopic = async (topicId: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await getTopicCards(topicId);
      setSelectedTopic(res.topic);
      setCards(res.cards);
    } catch (err: any) {
      setError(err.message || 'Lỗi khi tải bộ thẻ từ vựng');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerate = async (topicName: string, level?: string) => {
    setIsLoading(true);
    setError(null);
    setSuccessMsg(null);
    try {
      const res = await generateVocab(topicName, level);
      setSelectedTopic(res.topic);
      setCards(res.cards);
      setTopics((prev) => {
        const prevArray = Array.isArray(prev) ? prev : [];
        return [res.topic, ...prevArray.filter((t) => t.id !== res.topic.id)];
      });
      const levelBadge = level && level !== 'ALL' ? ` [Cấp độ ${level}]` : '';
      setSuccessMsg(`Đã tạo thành công bộ 15 từ vựng cho chủ đề "${topicName}"${levelBadge}!`);
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      setError(err.message || 'Không thể sinh từ vựng. Vui lòng kiểm tra lại kết nối hoặc thử lại.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteTopic = async (topicId: string) => {
    try {
      await deleteTopic(topicId);
      const remaining = Array.isArray(topics) ? topics.filter((t) => t.id !== topicId) : [];
      setTopics(remaining);
      if (selectedTopic?.id === topicId) {
        if (remaining.length > 0) {
          loadCardsForTopic(remaining[0].id);
        } else {
          setSelectedTopic(null);
          setCards([]);
        }
      }
    } catch (err: any) {
      setError('Không thể xóa chủ đề này');
    }
  };

  const totalCardsCount = Array.isArray(topics) ? topics.reduce((acc, t) => acc + (t.card_count || 15), 0) : 0;
  const safeTopics = Array.isArray(topics) ? topics : [];

  return (
    <div className="space-y-8">
      {/* Topic Generator Input */}
      <TopicInput onGenerate={handleGenerate} isLoading={isLoading} />

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

      {/* Main Deck & Topic List Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Side: Topic Selector Sidebar */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-white rounded-2xl p-5 border border-[#E5E7EB] shadow-xs flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-[10px] uppercase tracking-widest text-[#9CA3AF] font-bold">
                  Bộ sưu tập chủ đề ({safeTopics.length})
                </h3>
              </div>

              <div className="space-y-1.5 max-h-[380px] overflow-y-auto pr-1">
                {safeTopics.map((t) => {
                  const isSelected = selectedTopic?.id === t.id;
                  return (
                    <button
                      key={t.id}
                      id={`topic-item-${t.id}`}
                      onClick={() => loadCardsForTopic(t.id)}
                      className={`w-full p-2.5 rounded-xl text-left transition-all duration-150 cursor-pointer flex items-center justify-between text-xs ${
                        isSelected
                          ? 'bg-[#F3F4F6] text-[#3B82F6] font-bold shadow-2xs'
                          : 'text-[#4B5563] hover:bg-[#F9FAFB] hover:text-[#111827] font-medium'
                      }`}
                    >
                      <div className="overflow-hidden pr-2 flex items-center gap-2.5">
                        <div className={`w-2 h-2 rounded-full shrink-0 ${isSelected ? 'bg-[#3B82F6]' : 'bg-[#D1D5DB]'}`} />
                        <span className="truncate">
                          {t.name}
                          {t.batch && t.batch > 1 && (
                            <span className="text-[10px] text-amber-600 font-bold ml-1.5">(Bộ #{t.batch})</span>
                          )}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        {t.level && t.level !== 'ALL' && (
                          <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded-md bg-blue-100 text-blue-700">
                            {t.level}
                          </span>
                        )}
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold shrink-0 ${
                          isSelected ? 'bg-[#DBEAFE] text-[#1E40AF]' : 'bg-[#F3F4F6] text-[#6B7280]'
                        }`}>
                          {t.card_count || 15} từ
                        </span>
                      </div>
                    </button>
                  );
                })}

                {safeTopics.length === 0 && (
                  <div className="text-center py-8 text-xs text-[#9CA3AF]">
                    Chưa có chủ đề nào. Nhập chủ đề ở trên để bắt đầu!
                  </div>
                )}
              </div>
            </div>

            {/* Sleek Memory / Vocab Storage Indicator */}
            <div className="p-4 bg-[#EFF6FF] rounded-xl border border-[#DBEAFE]">
              <p className="text-xs font-semibold text-[#1E40AF] mb-1 flex items-center justify-between">
                <span>Kho từ vựng song ngữ</span>
                <span className="text-[10px] font-bold">{totalCardsCount} từ</span>
              </p>
              <div className="w-full bg-[#BFDBFE] h-1.5 rounded-full mb-2 overflow-hidden">
                <div
                  className="bg-[#3B82F6] h-1.5 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, Math.max(10, safeTopics.length * 15))}%` }}
                />
              </div>
              <p className="text-[10px] text-[#1E40AF] opacity-80">
                {safeTopics.length} chủ đề đã lưu trữ · Sẵn sàng ôn tập
              </p>
            </div>
          </div>
        </div>

        {/* Right Side: Flashcard Deck View */}
        <div className="lg:col-span-8">
          {selectedTopic && cards.length > 0 ? (
            <FlashcardDeck
              topic={selectedTopic}
              cards={cards}
              onDeleteTopic={handleDeleteTopic}
              onRegenerateRandom={handleGenerate}
              isRegenerating={isLoading}
            />
          ) : (
            <div className="bg-white rounded-2xl p-12 border border-[#E5E7EB] text-center space-y-3 shadow-xs">
              <BookOpen className="w-12 h-12 text-[#9CA3AF] mx-auto" />
              <h4 className="text-base font-bold text-[#111827]">Chưa chọn chủ đề</h4>
              <p className="text-xs text-[#6B7280] max-w-sm mx-auto">
                Hãy chọn một chủ đề trong danh sách hoặc nhập chủ đề mới để bắt đầu học với Flashcard 3D và trắc nghiệm.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
