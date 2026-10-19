import React from 'react';
import { BookOpen, Youtube, Sparkles, BookMarked, HelpCircle, Plus } from 'lucide-react';

interface NavbarProps {
  activeTab: 'topic' | 'video' | 'notebook';
  setActiveTab: (tab: 'topic' | 'video' | 'notebook') => void;
  onOpenHelp?: () => void;
  onOpenAddWord?: () => void;
}

export default function Navbar({
  activeTab,
  setActiveTab,
  onOpenHelp,
  onOpenAddWord,
}: NavbarProps) {
  return (
    <header className="sticky top-0 z-40 w-full bg-white border-b border-[#E5E7EB] shrink-0">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <div className="flex items-center gap-4 sm:gap-6">
            <div className="flex items-center gap-2 cursor-pointer" onClick={() => setActiveTab('topic')}>
              <span className="text-xl font-bold tracking-tighter text-[#3B82F6]">
                DUOVOCAB<span className="text-[#111827]">.AI</span>
              </span>
            </div>

            <div className="hidden xl:flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#EFF6FF] text-[#1E40AF] border border-[#DBEAFE] uppercase tracking-wider">
                Song ngữ EN / ZH ➔ VI
              </span>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="flex items-center bg-[#F3F4F6] p-1 rounded-full border border-[#E5E7EB] overflow-x-auto max-w-full">
            <button
              id="nav-tab-topic"
              onClick={() => setActiveTab('topic')}
              className={`flex items-center gap-1.5 px-3 sm:px-4 py-1.5 rounded-full text-xs font-semibold transition-all duration-150 cursor-pointer whitespace-nowrap ${
                activeTab === 'topic'
                  ? 'bg-white text-[#3B82F6] shadow-xs'
                  : 'text-[#4B5563] hover:text-[#111827]'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">1. Flashcard Chủ Đề</span>
              <span className="sm:hidden">Chủ đề</span>
            </button>

            <button
              id="nav-tab-video"
              onClick={() => setActiveTab('video')}
              className={`flex items-center gap-1.5 px-3 sm:px-4 py-1.5 rounded-full text-xs font-semibold transition-all duration-150 cursor-pointer whitespace-nowrap ${
                activeTab === 'video'
                  ? 'bg-white text-[#3B82F6] shadow-xs'
                  : 'text-[#4B5563] hover:text-[#111827]'
              }`}
            >
              <Youtube className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">2. Từ Vựng YouTube</span>
              <span className="sm:hidden">YouTube</span>
            </button>

            <button
              id="nav-tab-notebook"
              onClick={() => setActiveTab('notebook')}
              className={`flex items-center gap-1.5 px-3 sm:px-4 py-1.5 rounded-full text-xs font-semibold transition-all duration-150 cursor-pointer whitespace-nowrap ${
                activeTab === 'notebook'
                  ? 'bg-white text-[#3B82F6] shadow-xs font-bold'
                  : 'text-[#4B5563] hover:text-[#111827]'
              }`}
            >
              <BookMarked className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">3. Sổ Từ Của Tôi</span>
              <span className="sm:hidden">Sổ từ</span>
            </button>
          </nav>

          {/* Action Helper & Quick Add Pill */}
          <div className="flex items-center gap-2 sm:gap-3">
            {onOpenAddWord && (
              <button
                id="btn-navbar-add-word"
                onClick={onOpenAddWord}
                className="inline-flex items-center gap-1 px-3 py-1.5 bg-[#059669] hover:bg-[#047857] text-white rounded-full text-xs font-bold transition-all cursor-pointer shadow-2xs"
                title="Nhập và lưu từ vựng mới vào sổ tay"
              >
                <Plus className="w-3.5 h-3.5" />
                <span className="hidden md:inline">Thêm từ mới</span>
              </button>
            )}

            {onOpenHelp && (
              <button
                id="btn-help-guide"
                onClick={onOpenHelp}
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#4B5563] hover:text-[#111827] bg-[#F3F4F6] hover:bg-[#E5E7EB] rounded-full transition-colors cursor-pointer"
                title="Hướng dẫn sử dụng & Cấu trúc"
              >
                <HelpCircle className="w-3.5 h-3.5" />
                <span className="hidden lg:inline">Hướng dẫn</span>
              </button>
            )}

            <div className="hidden 2xl:flex items-center gap-1.5 text-[11px] font-semibold text-[#1E40AF] bg-[#EFF6FF] px-3 py-1 rounded-full border border-[#DBEAFE]">
              <Sparkles className="w-3 h-3 text-[#3B82F6]" />
              <span>Gemini 3.7 Flash</span>
            </div>

            {/* Avatar Badge */}
            <div className="w-8 h-8 rounded-full bg-[#EFF6FF] border border-[#BFDBFE] text-[#1E40AF] flex items-center justify-center text-xs font-bold">
              AI
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};


