import React, { useState, useEffect } from 'react';
import { VocabCard, Topic } from '../../types/index.ts';
import { autoFillCard, createCustomCard } from '../../services/api.ts';
import SpeechButton from '../common/SpeechButton.tsx';
import {
  X,
  Sparkles,
  Loader2,
  BookMarked,
  Layers,
  Check,
  AlertCircle,
  Eye,
  RotateCw,
  PlusCircle,
  Volume2,
} from 'lucide-react';

interface AddWordModalProps {
  isOpen: boolean;
  onClose: () => void;
  topics: Topic[];
  defaultTopicId?: string;
  initialWord?: string;
  onSuccess: (newCard: VocabCard, topic?: Topic) => void;
}

const CEFR_LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];

export default function AddWordModal({
  isOpen,
  onClose,
  topics,
  defaultTopicId,
  initialWord = '',
  onSuccess,
}: AddWordModalProps) {
  const [quickInput, setQuickInput] = useState<string>(initialWord);
  const [wordEn, setWordEn] = useState<string>(initialWord);
  const [ipaEn, setIpaEn] = useState<string>('');
  const [wordZh, setWordZh] = useState<string>('');
  const [pinyin, setPinyin] = useState<string>('');
  const [wordJa, setWordJa] = useState<string>('');
  const [readingJa, setReadingJa] = useState<string>('');
  const [meaningVi, setMeaningVi] = useState<string>('');
  const [exampleEn, setExampleEn] = useState<string>('');
  const [exampleZh, setExampleZh] = useState<string>('');
  const [exampleJa, setExampleJa] = useState<string>('');
  const [exampleMeaningVi, setExampleMeaningVi] = useState<string>('');
  const [difficulty, setDifficulty] = useState<string>('B1');
  const [selectedTopicId, setSelectedTopicId] = useState<string>(
    defaultTopicId && topics.some((t) => t.id === defaultTopicId)
      ? defaultTopicId
      : topics[0]?.id || ''
  );
  const [customTopicName, setCustomTopicName] = useState<string>('');
  const [isCreatingNewTopic, setIsCreatingNewTopic] = useState<boolean>(false);

  const [isAutoFilling, setIsAutoFilling] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState<boolean>(false);
  const [isPreviewFlipped, setIsPreviewFlipped] = useState<boolean>(false);

  // Sync selectedTopicId whenever modal opens or when topics/defaultTopicId change
  useEffect(() => {
    if (isOpen) {
      if (defaultTopicId && topics.some((t) => t.id === defaultTopicId)) {
        setSelectedTopicId(defaultTopicId);
      } else if (topics.length > 0) {
        if (!selectedTopicId || !topics.some((t) => t.id === selectedTopicId)) {
          setSelectedTopicId(topics[0].id);
        }
      } else {
        setSelectedTopicId('');
      }
      setIsCreatingNewTopic(false);
      setCustomTopicName('');
      setError(null);
    }
  }, [isOpen, defaultTopicId, topics]);

  if (!isOpen) return null;

  const handleAutoFill = async () => {
    const inputToUse = quickInput.trim() || wordEn.trim() || wordZh.trim() || wordJa.trim() || meaningVi.trim();
    if (!inputToUse) {
      setError('Vui lòng nhập từ hoặc cụm từ trước khi yêu cầu AI tự động điền.');
      return;
    }

    setIsAutoFilling(true);
    setError(null);

    try {
      const existing: Partial<VocabCard> = {
        word_en: wordEn.trim() || undefined,
        word_zh: wordZh.trim() || undefined,
        word_ja: wordJa.trim() || undefined,
        meaning_vi: meaningVi.trim() || undefined,
      };

      const result = await autoFillCard(inputToUse, existing);
      if (result.word_en) setWordEn(result.word_en);
      if (result.ipa_en) setIpaEn(result.ipa_en);
      if (result.word_zh) setWordZh(result.word_zh);
      if (result.pinyin) setPinyin(result.pinyin);
      if (result.word_ja) setWordJa(result.word_ja);
      if (result.reading_ja) setReadingJa(result.reading_ja);
      if (result.meaning_vi) setMeaningVi(result.meaning_vi);
      if (result.example_en) setExampleEn(result.example_en);
      if (result.example_zh) setExampleZh(result.example_zh);
      if (result.example_ja) setExampleJa(result.example_ja);
      if (result.example_meaning_vi) setExampleMeaningVi(result.example_meaning_vi);
      if (result.difficulty) setDifficulty(result.difficulty);

      if (!quickInput) {
        setQuickInput(result.word_en || inputToUse);
      }
    } catch (err: any) {
      setError(err.message || 'Lỗi khi AI tự động điền thẻ từ vựng');
    } finally {
      setIsAutoFilling(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!wordEn.trim() && !wordZh.trim() && !wordJa.trim() && !meaningVi.trim()) {
      setError('Cần điền ít nhất một từ (Tiếng Anh, Tiếng Trung, Tiếng Nhật hoặc Nghĩa Tiếng Việt).');
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      // Determine the precise target topic
      let targetTopicId: string | undefined = undefined;
      let targetTopicName: string | undefined = undefined;

      if (isCreatingNewTopic) {
        targetTopicName = customTopicName.trim() || 'Sổ tay từ vựng của tôi';
      } else {
        if (selectedTopicId && topics.some((t) => t.id === selectedTopicId)) {
          targetTopicId = selectedTopicId;
        } else if (defaultTopicId && topics.some((t) => t.id === defaultTopicId)) {
          targetTopicId = defaultTopicId;
        } else if (topics.length > 0) {
          targetTopicId = topics[0].id;
        }
      }

      const payload: Partial<VocabCard> & { topicName?: string } = {
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
        topic_id: targetTopicId,
        topicName: targetTopicName,
      };

      const res = await createCustomCard(payload);
      onSuccess(res.card, res.topic);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Lỗi khi lưu thẻ từ vựng');
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
              <BookMarked className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-[#111827]">
                Thêm từ vựng mới vào Sổ tay
              </h3>
              <p className="text-xs text-[#6B7280]">
                Lưu trữ dạng thẻ đa ngữ (Anh · Trung · Nhật · Việt) chuẩn IPA, Pinyin & Romaji
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

        {/* AI Quick Auto-Fill Bar */}
        <div className="my-5 p-4 bg-gradient-to-r from-[#EFF6FF] via-[#FAF5FF] to-[#FEF2F2] rounded-2xl border border-[#DBEAFE] space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-[#1E40AF] flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[#3B82F6]" />
              AI Điền thông tin tự động siêu nhanh (Anh / Trung / Nhật / Việt)
            </label>
            <span className="text-[10px] text-[#6B7280]">
              Nhập từ bất kỳ
            </span>
          </div>

          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              id="input-quick-autofill-word"
              value={quickInput}
              onChange={(e) => setQuickInput(e.target.value)}
              placeholder="VD: Serendipity, 一丝不苟, 几帳面, Kiên trì..."
              className="flex-1 px-3.5 py-2 text-xs rounded-xl bg-white border border-[#DBEAFE] text-[#111827] placeholder-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#3B82F6] font-medium"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAutoFill();
                }
              }}
            />

            <button
              type="button"
              id="btn-trigger-autofill"
              disabled={isAutoFilling || !quickInput.trim()}
              onClick={handleAutoFill}
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-[#3B82F6] hover:bg-[#2563EB] text-white rounded-xl text-xs font-bold transition-all cursor-pointer disabled:opacity-50 shadow-xs shrink-0"
            >
              {isAutoFilling ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Đang điền thông tin...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>AI Tự Động Điền 3 Ngôn Ngữ</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Error Notification */}
        {error && (
          <div className="mb-4 p-3 bg-[#FEE2E2] border border-[#FECACA] text-[#991B1B] rounded-xl flex items-center gap-2 text-xs font-semibold">
            <AlertCircle className="w-4 h-4 text-[#EF4444] shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Main Form & Preview Tabs */}
        <form onSubmit={handleSave} className="space-y-4">
          <div className="flex items-center justify-between pb-1">
            <span className="text-xs font-bold text-[#111827] uppercase tracking-wider">
              Chi tiết thông tin thẻ
            </span>
            <button
              type="button"
              onClick={() => setShowPreview(!showPreview)}
              className="text-xs font-semibold text-[#3B82F6] hover:text-[#1D4ED8] inline-flex items-center gap-1 cursor-pointer"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>{showPreview ? 'Ẩn xem trước' : 'Xem trước thẻ'}</span>
            </button>
          </div>

          {/* Live Flashcard Preview Card (if toggled) */}
          {showPreview && (
            <div className="p-4 bg-[#F9FAFB] rounded-2xl border border-[#E5E7EB] space-y-2">
              <div className="flex items-center justify-between text-[11px] text-[#6B7280]">
                <span>Xem trước Thẻ Flashcard 3D:</span>
                <button
                  type="button"
                  onClick={() => setIsPreviewFlipped(!isPreviewFlipped)}
                  className="inline-flex items-center gap-1 font-bold text-[#3B82F6] cursor-pointer hover:underline"
                >
                  <RotateCw className="w-3 h-3" />
                  <span>{isPreviewFlipped ? 'Xem mặt trước' : 'Xem mặt sau (Nghĩa & Ví dụ)'}</span>
                </button>
              </div>

              {!isPreviewFlipped ? (
                <div className="bg-white rounded-xl p-4 border border-[#DBEAFE] text-center space-y-2.5 shadow-2xs">
                  <div className="p-2 rounded-lg bg-[#EFF6FF] border border-[#DBEAFE]">
                    <span className="text-[10px] uppercase font-bold text-[#1E40AF] block">🇬🇧 English</span>
                    <p className="text-lg font-bold text-[#111827]">{wordEn || '(Chưa nhập từ EN)'}</p>
                    {ipaEn && <p className="text-xs font-mono text-[#2563EB]">{ipaEn.startsWith('/') ? ipaEn : `/${ipaEn}/`}</p>}
                  </div>
                  <div className="p-2 rounded-lg bg-[#FEF2F2] border border-[#FEE2E2]">
                    <span className="text-[10px] uppercase font-bold text-[#DC2626] block">🇨🇳 中文</span>
                    <p className="text-lg font-bold font-serif text-[#111827]">{wordZh || '(Chưa nhập từ ZH)'}</p>
                    {pinyin && <p className="text-xs text-[#DC2626]">[{pinyin}]</p>}
                  </div>
                  <div className="p-2 rounded-lg bg-[#FAF5FF] border border-[#F3E8FF]">
                    <span className="text-[10px] uppercase font-bold text-[#9333EA] block">🇯🇵 日本語</span>
                    <p className="text-lg font-bold font-sans text-[#111827]">{wordJa || '(Chưa nhập từ JA)'}</p>
                    {readingJa && <p className="text-xs text-[#9333EA]">[{readingJa}]</p>}
                  </div>
                </div>
              ) : (
                <div className="bg-white rounded-xl p-4 border border-[#A7F3D0] space-y-2 text-xs">
                  <div className="p-2 rounded-lg bg-[#ECFDF5] border border-[#A7F3D0]">
                    <span className="text-[10px] font-bold text-[#065F46] uppercase block">Nghĩa tiếng Việt</span>
                    <p className="font-bold text-sm text-[#111827]">{meaningVi || '(Chưa nhập nghĩa)'}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="italic text-[#111827]">EN: "{exampleEn || 'Chưa có ví dụ tiếng Anh'}"</p>
                    <p className="font-serif text-[#111827]">ZH: "{exampleZh || 'Chưa có ví dụ tiếng Trung'}"</p>
                    <p className="font-sans text-[#111827]">JA: "{exampleJa || 'Chưa có ví dụ tiếng Nhật'}"</p>
                    <p className="text-[#6B7280]">➔ {exampleMeaningVi || 'Chưa có dịch câu'}</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Form Fields Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 max-h-[380px] overflow-y-auto pr-1">
            {/* English Word & IPA */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-[#111827] flex items-center justify-between">
                <span>🇬🇧 Từ Tiếng Anh <span className="text-red-500">*</span></span>
                {wordEn && <SpeechButton text={wordEn} lang="en" size="sm" />}
              </label>
              <input
                type="text"
                value={wordEn}
                onChange={(e) => setWordEn(e.target.value)}
                placeholder="VD: Meticulous"
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
                placeholder="VD: /məˈtɪk.jə.ləs/"
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
                placeholder="VD: 一丝不苟"
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
                placeholder="VD: yī sī bù gǒu"
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
                placeholder="VD: 几帳面 / 緻密"
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
                placeholder="VD: Tỉ mỉ, cẩn thận từng chi tiết nhỏ"
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
                placeholder="VD: She is meticulous about keeping records."
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
                placeholder="VD: 她对保持记录一丝不苟。"
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
                placeholder="VD: 彼女は記録を整理することに非常に几帳面です。"
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
                placeholder="VD: Cô ấy rất tỉ mỉ trong việc lưu giữ hồ sơ."
                className="w-full px-3 py-2 text-xs rounded-xl bg-[#F9FAFB] border border-[#E5E7EB] text-[#111827] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#3B82F6]"
              />
            </div>

            {/* Level & Topic Selector */}
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
              <label className="text-xs font-semibold text-[#111827] flex items-center justify-between">
                <span>Lưu vào Sổ tay / Chủ đề</span>
                <button
                  type="button"
                  onClick={() => setIsCreatingNewTopic(!isCreatingNewTopic)}
                  className="text-[10px] font-bold text-[#3B82F6] hover:underline cursor-pointer"
                >
                  {isCreatingNewTopic ? 'Chọn sổ có sẵn' : '+ Tạo sổ tay mới'}
                </button>
              </label>

              {isCreatingNewTopic ? (
                <input
                  type="text"
                  value={customTopicName}
                  onChange={(e) => setCustomTopicName(e.target.value)}
                  placeholder="Nhập tên Sổ tay mới..."
                  className="w-full px-3 py-2 text-xs rounded-xl bg-white border border-[#3B82F6] text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#3B82F6] font-medium"
                />
              ) : (
                <select
                  value={
                    selectedTopicId && topics.some((t) => t.id === selectedTopicId)
                      ? selectedTopicId
                      : defaultTopicId && topics.some((t) => t.id === defaultTopicId)
                      ? defaultTopicId
                      : topics[0]?.id || ''
                  }
                  onChange={(e) => setSelectedTopicId(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-[#F9FAFB] border border-[#E5E7EB] text-[#111827] font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#3B82F6]"
                >
                  {topics.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} ({t.card_count || 0} từ)
                    </option>
                  ))}
                  {topics.length === 0 && (
                    <option value="">Sổ tay từ vựng của tôi (Mặc định)</option>
                  )}
                </select>
              )}
            </div>
          </div>

          {/* Action Buttons Footer */}
          <div className="pt-4 border-t border-[#E5E7EB] flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-[#4B5563] hover:bg-[#F3F4F6] transition-colors cursor-pointer"
            >
              Hủy
            </button>

            <button
              type="submit"
              id="btn-submit-add-card"
              disabled={isSaving}
              className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-[#059669] hover:bg-[#047857] text-white rounded-xl text-xs font-bold transition-all cursor-pointer disabled:opacity-50 shadow-xs"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Đang lưu...</span>
                </>
              ) : (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Lưu Thẻ Vào Sổ Từ</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
