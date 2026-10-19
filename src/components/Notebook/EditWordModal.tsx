import React, { useState, useEffect } from 'react';
import { VocabCard, Topic } from '../../types/index.ts';
import { updateCard, autoFillCard, deleteCard } from '../../services/api.ts';
import SpeechButton from '../common/SpeechButton.tsx';
import {
  X,
  Sparkles,
  Loader2,
  Edit3,
  Check,
  AlertCircle,
  Volume2,
  Trash2,
} from 'lucide-react';

interface EditWordModalProps {
  isOpen: boolean;
  onClose: () => void;
  card: VocabCard;
  topics: Topic[];
  onSuccess: (updatedCard: VocabCard) => void;
  onDelete?: (deletedCardId: string) => void;
}

const CEFR_LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];

export default function EditWordModal({
  isOpen,
  onClose,
  card,
  topics,
  onSuccess,
  onDelete,
}: EditWordModalProps) {
  const [wordEn, setWordEn] = useState<string>(card.word_en || '');
  const [ipaEn, setIpaEn] = useState<string>(card.ipa_en || '');
  const [wordZh, setWordZh] = useState<string>(card.word_zh || '');
  const [pinyin, setPinyin] = useState<string>(card.pinyin || '');
  const [wordJa, setWordJa] = useState<string>(card.word_ja || '');
  const [readingJa, setReadingJa] = useState<string>(card.reading_ja || '');
  const [meaningVi, setMeaningVi] = useState<string>(card.meaning_vi || '');
  const [exampleEn, setExampleEn] = useState<string>(card.example_en || '');
  const [exampleZh, setExampleZh] = useState<string>(card.example_zh || '');
  const [exampleJa, setExampleJa] = useState<string>(card.example_ja || '');
  const [exampleMeaningVi, setExampleMeaningVi] = useState<string>(card.example_meaning_vi || '');
  const [difficulty, setDifficulty] = useState<string>(card.difficulty || 'B1');
  const [selectedTopicId, setSelectedTopicId] = useState<string>(card.topic_id || topics[0]?.id || '');

  const [isAutoFilling, setIsAutoFilling] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && card) {
      setWordEn(card.word_en || '');
      setIpaEn(card.ipa_en || '');
      setWordZh(card.word_zh || '');
      setPinyin(card.pinyin || '');
      setWordJa(card.word_ja || '');
      setReadingJa(card.reading_ja || '');
      setMeaningVi(card.meaning_vi || '');
      setExampleEn(card.example_en || '');
      setExampleZh(card.example_zh || '');
      setExampleJa(card.example_ja || '');
      setExampleMeaningVi(card.example_meaning_vi || '');
      setDifficulty(card.difficulty || 'B1');
      setSelectedTopicId(card.topic_id || (topics[0]?.id || ''));
      setError(null);
      setShowDeleteConfirm(false);
    }
  }, [isOpen, card, topics]);

  if (!isOpen) return null;

  const handleConfirmDelete = async () => {
    setIsDeleting(true);
    setError(null);
    try {
      await deleteCard(card.id);
      if (onDelete) {
        onDelete(card.id);
      }
      onClose();
    } catch (err: any) {
      setError(err.message || 'Lỗi khi xóa thẻ từ vựng');
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const handleAutoFill = async () => {
    const inputToUse = wordEn.trim() || wordZh.trim() || wordJa.trim() || meaningVi.trim();
    if (!inputToUse) {
      setError('Vui lòng nhập từ khóa trước khi yêu cầu AI bổ sung thông tin.');
      return;
    }

    setIsAutoFilling(true);
    setError(null);

    try {
      const result = await autoFillCard(inputToUse, {
        word_en: wordEn,
        word_zh: wordZh,
        word_ja: wordJa,
        meaning_vi: meaningVi,
      });

      if (result.word_en && !wordEn) setWordEn(result.word_en);
      if (result.ipa_en) setIpaEn(result.ipa_en);
      if (result.word_zh) setWordZh(result.word_zh);
      if (result.pinyin) setPinyin(result.pinyin);
      if (result.word_ja) setWordJa(result.word_ja);
      if (result.reading_ja) setReadingJa(result.reading_ja);
      if (result.meaning_vi && !meaningVi) setMeaningVi(result.meaning_vi);
      if (result.example_en) setExampleEn(result.example_en);
      if (result.example_zh) setExampleZh(result.example_zh);
      if (result.example_ja) setExampleJa(result.example_ja);
      if (result.example_meaning_vi) setExampleMeaningVi(result.example_meaning_vi);
      if (result.difficulty) setDifficulty(result.difficulty);
    } catch (err: any) {
      setError(err.message || 'Lỗi khi AI bổ sung thông tin thẻ');
    } finally {
      setIsAutoFilling(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!wordEn.trim() && !wordZh.trim() && !wordJa.trim() && !meaningVi.trim()) {
      setError('Cần ít nhất một từ (Tiếng Anh, Tiếng Trung, Tiếng Nhật hoặc Nghĩa Tiếng Việt).');
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      const updates: Partial<VocabCard> = {
        word_en: wordEn.trim(),
        ipa_en: ipaEn.trim(),
        word_zh: wordZh.trim(),
        pinyin: pinyin.trim(),
        word_ja: wordJa.trim(),
        reading_ja: readingJa.trim(),
        meaning_vi: meaningVi.trim(),
        example_en: exampleEn.trim(),
        example_zh: exampleZh.trim(),
        example_ja: exampleJa.trim(),
        example_meaning_vi: exampleMeaningVi.trim(),
        difficulty,
        topic_id: selectedTopicId,
      };

      const updated = await updateCard(card.id, updates);
      onSuccess(updated);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Lỗi khi cập nhật thẻ từ vựng');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-7 shadow-2xl border border-[#E5E7EB] my-8 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#E5E7EB]">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-[#EFF6FF] text-[#3B82F6] flex items-center justify-center border border-[#DBEAFE]">
              <Edit3 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-[#111827]">
                Chỉnh sửa thẻ từ vựng
              </h3>
              <p className="text-xs text-[#6B7280]">
                Cập nhật thông tin tiếng Anh, Trung, Nhật, nghĩa tiếng Việt, câu ví dụ hoặc chủ đề
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-[#9CA3AF] hover:text-[#111827] hover:bg-[#F3F4F6] rounded-full transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* AI Quick Auto-Fill Prompt */}
        <div className="my-4 p-3 bg-[#EFF6FF] rounded-2xl border border-[#DBEAFE] flex items-center justify-between gap-3">
          <div className="text-xs font-semibold text-[#1E40AF] flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-[#3B82F6] shrink-0" />
            <span>Bạn muốn AI tự động điền / cập nhật cả 3 thứ tiếng (Anh, Trung, Nhật)?</span>
          </div>

          <button
            type="button"
            disabled={isAutoFilling}
            onClick={handleAutoFill}
            className="inline-flex items-center gap-1 px-3 py-1.5 bg-[#3B82F6] hover:bg-[#2563EB] text-white rounded-xl text-xs font-bold transition-all cursor-pointer disabled:opacity-50 shrink-0"
          >
            {isAutoFilling ? (
              <>
                <Loader2 className="w-3 h-3 animate-spin" />
                <span>Đang xử lý...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-3 h-3" />
                <span>AI Điền lại</span>
              </>
            )}
          </button>
        </div>

        {/* Error Notification */}
        {error && (
          <div className="mb-4 p-3 bg-[#FEE2E2] border border-[#FECACA] text-[#991B1B] rounded-xl flex items-center gap-2 text-xs font-semibold">
            <AlertCircle className="w-4 h-4 text-[#EF4444] shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Main Form */}
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 max-h-[380px] overflow-y-auto pr-1">
            {/* English Word & IPA */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-[#111827] flex items-center justify-between">
                <span>🇬🇧 Từ Tiếng Anh</span>
                {wordEn && <SpeechButton text={wordEn} lang="en" size="sm" />}
              </label>
              <input
                type="text"
                value={wordEn}
                onChange={(e) => setWordEn(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl bg-[#F9FAFB] border border-[#E5E7EB] text-[#111827] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#3B82F6] font-medium"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-[#111827]">
                Phiên âm IPA Tiếng Anh
              </label>
              <input
                type="text"
                value={ipaEn}
                onChange={(e) => setIpaEn(e.target.value)}
                placeholder="/.../"
                className="w-full px-3 py-2 text-xs rounded-xl bg-[#F9FAFB] border border-[#E5E7EB] text-[#2563EB] font-mono focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#3B82F6]"
              />
            </div>

            {/* Chinese Word & Pinyin */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-[#111827] flex items-center justify-between">
                <span>🇨🇳 Từ Tiếng Trung (Hán tự)</span>
                {wordZh && <SpeechButton text={wordZh} lang="zh" size="sm" />}
              </label>
              <input
                type="text"
                value={wordZh}
                onChange={(e) => setWordZh(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl bg-[#F9FAFB] border border-[#E5E7EB] text-[#111827] font-serif focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#3B82F6] font-medium"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-[#111827]">
                Phiên âm Pinyin (Có dấu)
              </label>
              <input
                type="text"
                value={pinyin}
                onChange={(e) => setPinyin(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl bg-[#F9FAFB] border border-[#E5E7EB] text-[#DC2626] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#3B82F6]"
              />
            </div>

            {/* Japanese Word & Reading */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-[#111827] flex items-center justify-between">
                <span>🇯🇵 Từ Tiếng Nhật (Kanji/Kana)</span>
                {wordJa && <SpeechButton text={wordJa} lang="ja" size="sm" />}
              </label>
              <input
                type="text"
                value={wordJa}
                onChange={(e) => setWordJa(e.target.value)}
                placeholder="VD: 几帳面"
                className="w-full px-3 py-2 text-xs rounded-xl bg-[#F9FAFB] border border-[#E5E7EB] text-[#111827] font-sans focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#9333EA] font-medium"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-[#111827]">
                Cách đọc Tiếng Nhật (Furigana / Romaji)
              </label>
              <input
                type="text"
                value={readingJa}
                onChange={(e) => setReadingJa(e.target.value)}
                placeholder="VD: きちょうめん (kichōmen)"
                className="w-full px-3 py-2 text-xs rounded-xl bg-[#F9FAFB] border border-[#E5E7EB] text-[#9333EA] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#9333EA]"
              />
            </div>

            {/* Vietnamese Meaning */}
            <div className="sm:col-span-2 space-y-1">
              <label className="text-xs font-semibold text-[#111827]">
                🇻🇳 Giải nghĩa Tiếng Việt <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={meaningVi}
                onChange={(e) => setMeaningVi(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl bg-[#F9FAFB] border border-[#E5E7EB] text-[#111827] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#3B82F6] font-medium"
              />
            </div>

            {/* Example English */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-[#111827]">
                Câu ví dụ Tiếng Anh
              </label>
              <textarea
                rows={2}
                value={exampleEn}
                onChange={(e) => setExampleEn(e.target.value)}
                className="w-full px-3 py-1.5 text-xs rounded-xl bg-[#F9FAFB] border border-[#E5E7EB] text-[#111827] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#3B82F6]"
              />
            </div>

            {/* Example Chinese */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-[#111827]">
                Câu ví dụ Tiếng Trung
              </label>
              <textarea
                rows={2}
                value={exampleZh}
                onChange={(e) => setExampleZh(e.target.value)}
                className="w-full px-3 py-1.5 text-xs rounded-xl bg-[#F9FAFB] border border-[#E5E7EB] text-[#111827] font-serif focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#3B82F6]"
              />
            </div>

            {/* Example Japanese */}
            <div className="sm:col-span-2 space-y-1">
              <label className="text-xs font-semibold text-[#111827]">
                Câu ví dụ Tiếng Nhật
              </label>
              <textarea
                rows={2}
                value={exampleJa}
                onChange={(e) => setExampleJa(e.target.value)}
                className="w-full px-3 py-1.5 text-xs rounded-xl bg-[#F9FAFB] border border-[#E5E7EB] text-[#111827] font-sans focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#9333EA]"
              />
            </div>

            {/* Example Meaning Vietnamese */}
            <div className="sm:col-span-2 space-y-1">
              <label className="text-xs font-semibold text-[#111827]">
                Dịch nghĩa câu ví dụ (Tiếng Việt)
              </label>
              <input
                type="text"
                value={exampleMeaningVi}
                onChange={(e) => setExampleMeaningVi(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl bg-[#F9FAFB] border border-[#E5E7EB] text-[#111827] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#3B82F6]"
              />
            </div>

            {/* Level & Topic */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-[#111827]">
                Cấp độ CEFR / JLPT / HSK
              </label>
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl bg-[#F9FAFB] border border-[#E5E7EB] text-[#111827] font-bold focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#3B82F6]"
              >
                {CEFR_LEVELS.map((lvl) => (
                  <option key={lvl} value={lvl}>
                    Trình độ {lvl}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-[#111827]">
                Thuộc Sổ tay / Chủ đề
              </label>
              <select
                value={selectedTopicId}
                onChange={(e) => setSelectedTopicId(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl bg-[#F9FAFB] border border-[#E5E7EB] text-[#111827] font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#3B82F6]"
              >
                {topics.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Action Buttons Footer */}
          <div className="pt-4 border-t border-[#E5E7EB] flex flex-wrap items-center justify-between gap-3">
            {showDeleteConfirm ? (
              <div className="flex items-center gap-2 bg-[#FEF2F2] p-1.5 px-2.5 rounded-xl border border-[#FECACA]">
                <span className="text-xs text-[#DC2626] font-bold">Xác nhận xóa thẻ?</span>
                <button
                  type="button"
                  id="btn-modal-confirm-delete"
                  disabled={isDeleting}
                  onClick={handleConfirmDelete}
                  className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#DC2626] hover:bg-[#B91C1C] text-white rounded-lg text-xs font-bold transition-colors cursor-pointer disabled:opacity-50"
                >
                  {isDeleting ? (
                    <>
                      <Loader2 className="w-3 h-3 animate-spin" />
                      <span>Đang xóa...</span>
                    </>
                  ) : (
                    <span>Xóa ngay</span>
                  )}
                </button>
                <button
                  type="button"
                  disabled={isDeleting}
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-2 py-1 text-[#6B7280] hover:text-[#111827] text-xs font-medium cursor-pointer"
                >
                  Hủy
                </button>
              </div>
            ) : (
              <button
                type="button"
                id="btn-modal-delete-word"
                disabled={isDeleting || isSaving}
                onClick={() => setShowDeleteConfirm(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-[#DC2626] bg-[#FEF2F2] hover:bg-[#FEE2E2] border border-[#FECACA] transition-colors cursor-pointer disabled:opacity-50"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Xóa thẻ này</span>
              </button>
            )}

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-[#4B5563] hover:bg-[#F3F4F6] transition-colors cursor-pointer"
              >
                Hủy
              </button>

              <button
                type="submit"
                id="btn-modal-save-word"
                disabled={isSaving || isDeleting}
                className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-[#3B82F6] hover:bg-[#2563EB] text-white rounded-xl text-xs font-bold transition-all cursor-pointer disabled:opacity-50 shadow-xs"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Đang lưu...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Lưu Thay Đổi</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
