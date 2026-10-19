import React, { useState } from 'react';
import { Volume2, VolumeX } from 'lucide-react';

interface SpeechButtonProps {
  text: string;
  lang: 'en' | 'zh' | 'ja';
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  label?: string;
}

export default function SpeechButton({
  text,
  lang,
  className = '',
  size = 'md',
  label,
}: SpeechButtonProps) {
  const [isPlaying, setIsPlaying] = useState(false);

  const speak = (e: React.MouseEvent) => {
    e.stopPropagation();

    if (!('speechSynthesis' in window)) {
      return;
    }

    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    if (lang === 'zh') {
      utterance.lang = 'zh-CN';
      utterance.rate = 0.9;
    } else if (lang === 'ja') {
      utterance.lang = 'ja-JP';
      utterance.rate = 0.9;
    } else {
      utterance.lang = 'en-US';
      utterance.rate = 0.95;
    }

    // Find preferred voice if available
    const voices = window.speechSynthesis.getVoices();
    const preferredVoice = voices.find((v) => {
      if (lang === 'zh') return v.lang.includes('zh') || v.lang.includes('cmn');
      if (lang === 'ja') return v.lang.includes('ja') || v.lang.includes('jp');
      return v.lang.includes('en');
    });
    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }

    utterance.onstart = () => setIsPlaying(true);
    utterance.onend = () => setIsPlaying(false);
    utterance.onerror = () => setIsPlaying(false);

    window.speechSynthesis.speak(utterance);
  };

  const iconSizes = {
    sm: 'w-3.5 h-3.5',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  };

  const buttonPaddings = {
    sm: 'p-1 text-xs',
    md: 'p-1.5 text-xs',
    lg: 'p-2 text-sm',
  };

  const getLangTitle = () => {
    if (lang === 'zh') return 'Tiếng Trung';
    if (lang === 'ja') return 'Tiếng Nhật';
    return 'Tiếng Anh';
  };

  return (
    <button
      id={`speech-btn-${lang}-${text.slice(0, 10).replace(/\s+/g, '-')}`}
      type="button"
      onClick={speak}
      title={`Phát âm (${getLangTitle()})`}
      className={`inline-flex items-center gap-1.5 rounded-full transition-all duration-200 cursor-pointer ${
        isPlaying
          ? 'bg-amber-100 text-amber-700 ring-2 ring-amber-400 scale-105'
          : 'bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 border border-slate-200'
      } ${buttonPaddings[size]} ${className}`}
    >
      <Volume2 className={`${iconSizes[size]} ${isPlaying ? 'animate-pulse text-amber-600' : ''}`} />
      {label && <span className="font-medium">{label}</span>}
    </button>
  );
};
