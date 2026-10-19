import React from 'react';
import { VocabCard, LanguagePairMode, SentenceCheckResult } from '../../types/index.ts';
import SentencePracticeBox from './SentencePracticeBox.tsx';
import { X, Sparkles } from 'lucide-react';

interface SentencePracticeModalProps {
  isOpen: boolean;
  onClose: () => void;
  card: VocabCard | null;
  langMode?: LanguagePairMode;
  onSentenceChecked?: (result: SentenceCheckResult) => void;
}

export default function SentencePracticeModal({
  isOpen,
  onClose,
  card,
  langMode = 'en-vi',
  onSentenceChecked,
}: SentencePracticeModalProps) {
  if (!isOpen || !card) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-[#DBEAFE] max-h-[92vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button Top Right */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2 text-[#9CA3AF] hover:text-[#111827] hover:bg-[#F3F4F6] rounded-full transition-colors cursor-pointer"
          title="Đóng cửa sổ"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="p-1">
          <SentencePracticeBox
            card={card}
            langMode={langMode}
            onSentenceChecked={onSentenceChecked}
          />
        </div>
      </div>
    </div>
  );
};
