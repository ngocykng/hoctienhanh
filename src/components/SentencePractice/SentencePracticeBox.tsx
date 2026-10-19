import React, { useState, useEffect } from 'react';
import { VocabCard, LanguagePairMode, SentenceCheckResult } from '../../types/index.ts';
import { checkSentence } from '../../services/api.ts';
import SpeechButton from '../common/SpeechButton.tsx';
import confetti from 'canvas-confetti';
import {
  Sparkles,
  Send,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  HelpCircle,
  RotateCcw,
  Volume2,
  ArrowRight,
  BookOpen,
  Check,
  Loader2,
  Lightbulb,
} from 'lucide-react';

interface SentencePracticeBoxProps {
  card: VocabCard;
  langMode?: LanguagePairMode;
  compact?: boolean;
  onSentenceChecked?: (result: SentenceCheckResult) => void;
}

export default function SentencePracticeBox({
  card,
  langMode = 'en-vi',
  compact = false,
  onSentenceChecked,
}: SentencePracticeBoxProps) {
  // Determine language to practice with
  const [targetLang, setTargetLang] = useState<'en' | 'zh' | 'ja'>(
    langMode === 'zh-vi' ? 'zh' : langMode === 'ja-vi' ? 'ja' : 'en'
  );

  const [inputSentence, setInputSentence] = useState<string>('');
  const [isChecking, setIsChecking] = useState<boolean>(false);
  const [result, setResult] = useState<SentenceCheckResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Sync targetLang if langMode changes
  useEffect(() => {
    if (langMode === 'zh-vi') setTargetLang('zh');
    else if (langMode === 'ja-vi') setTargetLang('ja');
    else setTargetLang('en');
  }, [langMode]);

  // Reset input and result when card changes
  useEffect(() => {
    setInputSentence('');
    setResult(null);
    setErrorMsg(null);
  }, [card.id]);

  const targetWord =
    targetLang === 'zh'
      ? card.word_zh
      : targetLang === 'ja'
      ? card.word_ja || card.word_en
      : card.word_en;

  const phonetic =
    targetLang === 'zh'
      ? card.pinyin
      : targetLang === 'ja'
      ? card.reading_ja
      : card.ipa_en;

  const handleCheck = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputSentence.trim() || isChecking) return;

    setIsChecking(true);
    setErrorMsg(null);

    try {
      const res = await checkSentence({
        targetWord: targetWord,
        userSentence: inputSentence.trim(),
        language: targetLang,
        targetWordMeaning: card.meaning_vi,
      });

      setResult(res);
      if (onSentenceChecked) onSentenceChecked(res);

      if (res.isCorrect && res.score >= 90) {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.7 },
        });
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Không thể kiểm tra câu. Vui lòng thử lại sau.');
    } finally {
      setIsChecking(false);
    }
  };

  const handleReset = () => {
    setInputSentence('');
    setResult(null);
    setErrorMsg(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      handleCheck();
    }
  };

  const placeholderText =
    targetLang === 'zh'
      ? `Nhập câu tiếng Trung chứa từ "${targetWord}"... (Ví dụ: 我每天早上...)`
      : targetLang === 'ja'
      ? `Nhập câu tiếng Nhật chứa từ "${targetWord}"... (Ví dụ: 毎朝...)`
      : `Nhập câu tiếng Anh chứa từ "${targetWord}"... (Ví dụ: I usually ${targetWord} early...)`;

  return (
    <div
      className={`bg-white rounded-3xl border border-[#DBEAFE] shadow-xs overflow-hidden transition-all duration-300 ${
        compact ? 'p-4 sm:p-5' : 'p-6 sm:p-7'
      }`}
    >
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#E5E7EB]">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#EFF6FF] text-[#1E40AF] border border-[#BFDBFE]">
              <Sparkles className="w-3.5 h-3.5 text-[#3B82F6]" />
              Thực hành đặt câu với AI
            </span>
            <span className="text-xs text-[#6B7280] font-medium hidden sm:inline">
              Kiểm tra ngữ pháp & cấu trúc câu tức thì
            </span>
          </div>

          <div className="flex flex-wrap items-baseline gap-2 mt-2">
            <span className="text-lg sm:text-xl font-extrabold text-[#111827]">
              {targetWord}
            </span>
            {phonetic && (
              <span className="text-xs font-mono font-semibold text-[#2563EB]">
                {phonetic.startsWith('/') ? phonetic : `[${phonetic}]`}
              </span>
            )}
            <SpeechButton text={targetWord} lang={targetLang} size="sm" />
            <span className="text-xs font-semibold text-[#4B5563] ml-1">
              🇻🇳 {card.meaning_vi}
            </span>
          </div>
        </div>

        {/* Language selector toggle if card supports multiple */}
        <div className="flex items-center gap-1 self-start sm:self-auto bg-[#F3F4F6] p-1 rounded-xl">
          <button
            type="button"
            onClick={() => setTargetLang('en')}
            className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
              targetLang === 'en'
                ? 'bg-white text-[#2563EB] shadow-2xs'
                : 'text-[#6B7280] hover:text-[#111827]'
            }`}
          >
            🇬🇧 EN
          </button>
          {card.word_zh && (
            <button
              type="button"
              onClick={() => setTargetLang('zh')}
              className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                targetLang === 'zh'
                  ? 'bg-white text-[#DC2626] shadow-2xs'
                  : 'text-[#6B7280] hover:text-[#111827]'
              }`}
            >
              🇨🇳 ZH
            </button>
          )}
          {card.word_ja && (
            <button
              type="button"
              onClick={() => setTargetLang('ja')}
              className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                targetLang === 'ja'
                  ? 'bg-white text-[#9333EA] shadow-2xs'
                  : 'text-[#6B7280] hover:text-[#111827]'
              }`}
            >
              🇯🇵 JA
            </button>
          )}
        </div>
      </div>

      {/* Input Section */}
      <div className="mt-4 space-y-3">
        <label className="block text-xs font-semibold text-[#374151]">
          Đặt câu của bạn (bắt buộc chứa từ{' '}
          <span className="text-[#2563EB] font-bold underline underline-offset-2">
            "{targetWord}"
          </span>
          ):
        </label>

        <div className="relative">
          <textarea
            value={inputSentence}
            onChange={(e) => setInputSentence(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={3}
            disabled={isChecking}
            placeholder={placeholderText}
            className="w-full px-4 py-3 rounded-2xl bg-[#F9FAFB] border border-[#D1D5DB] focus:bg-white focus:border-[#3B82F6] focus:ring-3 focus:ring-[#93C5FD]/40 text-sm text-[#111827] outline-none transition-all placeholder:text-[#9CA3AF] resize-none disabled:opacity-60"
          />
          {inputSentence && (
            <button
              type="button"
              onClick={() => setInputSentence('')}
              className="absolute top-3 right-3 text-xs text-[#9CA3AF] hover:text-[#6B7280] px-2 py-0.5 rounded-md hover:bg-[#E5E7EB] cursor-pointer"
            >
              Xóa
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="text-[11px] text-[#6B7280] flex items-center gap-1.5">
            <Lightbulb className="w-3.5 h-3.5 text-amber-500 shrink-0" />
            <span>Mẹo: Nhấn <strong>Ctrl + Enter</strong> để kiểm tra nhanh.</span>
          </div>

          <div className="flex items-center gap-2">
            {result && (
              <button
                type="button"
                onClick={handleReset}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-[#4B5563] hover:text-[#111827] bg-[#F3F4F6] hover:bg-[#E5E7EB] rounded-xl transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Đặt câu khác</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => handleCheck()}
              disabled={isChecking || !inputSentence.trim()}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-[#2563EB] to-[#1D4ED8] hover:from-[#1D4ED8] hover:to-[#1E40AF] text-white rounded-xl text-xs font-bold shadow-sm hover:shadow transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isChecking ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                  <span>AI đang phân tích câu...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  <span>Kiểm tra lỗi & Đánh giá</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Error Message if API fails */}
      {errorMsg && (
        <div className="mt-4 p-3.5 rounded-2xl bg-[#FEF2F2] border border-[#FECACA] text-[#991B1B] text-xs font-medium flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-[#EF4444] shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* ================= AI EVALUATION RESULT ================= */}
      {result && (
        <div className="mt-6 pt-5 border-t border-[#E5E7EB] space-y-4 animate-in fade-in duration-300">
          {/* Header Score & Overall Feedback */}
          <div
            className={`p-4 sm:p-5 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
              result.isCorrect && result.score >= 90
                ? 'bg-[#ECFDF5] border-[#A7F3D0] text-[#065F46]'
                : result.score >= 70
                ? 'bg-[#FFFBEB] border-[#FDE68A] text-[#92400E]'
                : 'bg-[#FEF2F2] border-[#FECACA] text-[#991B1B]'
            }`}
          >
            <div className="flex items-start gap-3">
              {result.isCorrect && result.score >= 90 ? (
                <div className="w-9 h-9 rounded-full bg-[#10B981] text-white flex items-center justify-center shrink-0 shadow-xs">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
              ) : (
                <div className="w-9 h-9 rounded-full bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-xs">
                  <AlertTriangle className="w-5 h-5" />
                </div>
              )}

              <div>
                <div className="flex items-center gap-2">
                  <h4 className="font-extrabold text-sm sm:text-base">
                    {result.isCorrect && result.score >= 90
                      ? 'Xuất sắc! Cấu trúc câu chuẩn xác'
                      : 'Phát hiện lỗi cần cải thiện'}
                  </h4>
                  <span
                    className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                      result.score >= 90
                        ? 'bg-[#D1FAE5] text-[#065F46] border border-[#A7F3D0]'
                        : result.score >= 70
                        ? 'bg-[#FEF3C7] text-[#92400E] border border-[#FDE68A]'
                        : 'bg-[#FEE2E2] text-[#991B1B] border border-[#FECACA]'
                    }`}
                  >
                    Điểm: {result.score}/100
                  </span>
                </div>
                <p className="text-xs mt-1 leading-relaxed opacity-95">
                  {result.overallFeedback}
                </p>
                {!result.wordUsedCorrectly && (
                  <p className="text-xs font-bold text-[#DC2626] mt-1">
                    ⚠️ Chú ý: Bạn chưa dùng đúng hoặc chưa đưa từ vựng "{targetWord}" vào đúng ngữ cảnh của câu.
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Detailed Error Breakdown */}
          {result.errors && result.errors.length > 0 && (
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold text-[#111827] uppercase tracking-wider flex items-center gap-1.5">
                  <XCircle className="w-4 h-4 text-[#EF4444]" />
                  Chi tiết lỗi sai & cách khắc phục ({result.errors.length} lỗi):
                </span>
              </div>

              <div className="space-y-2.5">
                {result.errors.map((err, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-2xl bg-white border border-[#FECACA] shadow-2xs space-y-2"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#FEE2E2] pb-2">
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-[#FEE2E2] text-[#991B1B]">
                        Lỗi #{idx + 1}: {err.issue}
                      </span>
                      <div className="text-xs flex items-center gap-2">
                        <span className="line-through text-[#EF4444] font-semibold bg-rose-50 px-1.5 py-0.5 rounded">
                          "{err.part}"
                        </span>
                        <ArrowRight className="w-3.5 h-3.5 text-[#6B7280]" />
                        <span className="font-bold text-[#059669] bg-emerald-50 px-1.5 py-0.5 rounded">
                          "{err.correction}"
                        </span>
                      </div>
                    </div>

                    <div className="text-xs text-[#374151] leading-relaxed">
                      <span className="font-bold text-[#111827]">💡 Giải thích: </span>
                      {err.explanation}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Corrected & Polished Complete Sentence */}
          <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-[#F0FDF4] to-[#ECFDF5] border border-[#A7F3D0] space-y-2 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-[#065F46] uppercase tracking-wider flex items-center gap-1">
                <Check className="w-3.5 h-3.5 text-[#059669]" />
                Câu hoàn chỉnh chuẩn ngữ pháp:
              </span>
              <SpeechButton text={result.improvedSentence} lang={targetLang} size="sm" />
            </div>

            <p className="text-sm sm:text-base font-extrabold text-[#065F46] tracking-tight">
              "{result.improvedSentence}"
            </p>

            {result.vietnameseMeaning && (
              <p className="text-xs font-semibold text-[#047857] opacity-90 pt-1 border-t border-[#A7F3D0]/60">
                🇻🇳 Dịch nghĩa: "{result.vietnameseMeaning}"
              </p>
            )}
          </div>

          {/* Native Alternatives (1-2 recommendations) */}
          {result.betterAlternatives && result.betterAlternatives.length > 0 && (
            <div className="p-4 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-2">
              <span className="text-[10px] font-bold text-[#475569] uppercase tracking-wider flex items-center gap-1">
                <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
                Gợi ý cách diễn đạt tự nhiên hơn của người bản xứ:
              </span>

              <div className="space-y-1.5">
                {result.betterAlternatives.map((alt, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between gap-2 p-2 bg-white rounded-xl border border-[#E2E8F0] text-xs font-medium text-[#1E293B]"
                  >
                    <span>"{alt}"</span>
                    <SpeechButton text={alt} lang={targetLang} size="sm" />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
