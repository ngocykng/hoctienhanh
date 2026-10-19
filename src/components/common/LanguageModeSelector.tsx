import React from 'react';
import { LanguagePairMode } from '../../types/index.ts';
import { Globe, Sparkles } from 'lucide-react';

interface LanguageModeSelectorProps {
  currentMode: LanguagePairMode;
  onChange?: (mode: LanguagePairMode) => void;
  onChangeMode?: (mode: LanguagePairMode) => void;
  className?: string;
  size?: 'sm' | 'md';
}

export default function LanguageModeSelector({
  currentMode,
  onChange,
  onChangeMode,
  className = '',
  size = 'md',
}: LanguageModeSelectorProps) {
  const handleChange = (mode: LanguagePairMode) => {
    if (onChange) {
      onChange(mode);
    } else if (onChangeMode) {
      onChangeMode(mode);
    }
  };
  const options: {
    id: LanguagePairMode;
    label: string;
    shortLabel: string;
    badge: string;
    flag: string;
    activeColor: string;
  }[] = [
    {
      id: 'all',
      label: 'Tất cả (Anh · Trung · Nhật · Việt)',
      shortLabel: 'Tất cả (3 Thứ Tiếng)',
      badge: 'Đa ngữ',
      flag: '🌐',
      activeColor: 'bg-[#1E293B] text-white shadow-xs',
    },
    {
      id: 'en-vi',
      label: 'Chỉ Tiếng Anh - Tiếng Việt',
      shortLabel: 'Anh - Việt (EN/VI)',
      badge: 'EN - VI',
      flag: '🇬🇧',
      activeColor: 'bg-[#2563EB] text-white shadow-xs',
    },
    {
      id: 'zh-vi',
      label: 'Chỉ Tiếng Trung - Tiếng Việt',
      shortLabel: 'Trung - Việt (ZH/VI)',
      badge: 'ZH - VI',
      flag: '🇨🇳',
      activeColor: 'bg-[#DC2626] text-white shadow-xs',
    },
    {
      id: 'ja-vi',
      label: 'Chỉ Tiếng Nhật - Tiếng Việt',
      shortLabel: 'Nhật - Việt (JA/VI)',
      badge: 'JA - VI',
      flag: '🇯🇵',
      activeColor: 'bg-[#9333EA] text-white shadow-xs',
    },
  ];

  return (
    <div
      className={`inline-flex flex-wrap items-center gap-1.5 p-1 bg-[#F1F5F9] rounded-2xl border border-[#E2E8F0] ${className}`}
    >
      {options.map((opt) => {
        const isActive = currentMode === opt.id;
        return (
          <button
            key={opt.id}
            id={`lang-mode-btn-${opt.id}`}
            type="button"
            onClick={() => handleChange(opt.id)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold transition-all duration-150 cursor-pointer text-xs ${
              isActive
                ? `${opt.activeColor} ring-1 ring-black/5`
                : 'text-[#475569] hover:text-[#0F172A] hover:bg-white/70'
            }`}
          >
            <span className="text-sm leading-none">{opt.flag}</span>
            <span className="hidden sm:inline">{opt.label}</span>
            <span className="sm:hidden">{opt.shortLabel}</span>
          </button>
        );
      })}
    </div>
  );
};
