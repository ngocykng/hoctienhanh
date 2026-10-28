import React, { useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import AddWordModal from './components/Notebook/AddWordModal.tsx';
import HelpModal from './components/common/HelpModal.tsx';
import Navbar from './components/common/Navbar.tsx';
import MyNotebookPage from './pages/MyNotebookPage.tsx';
import Login, { type AuthUser } from './pages/login.tsx';
import RegisterPage from './pages/register.tsx';
import VideoVocabPage from './pages/VideoVocabPage.tsx';
import VocabByTopicPage from './pages/VocabByTopicPage.tsx';
import { getTopics } from './services/api.ts';
import type { Topic, VocabCard } from './types/index.ts';
import Admin from './pages/Admin.tsx';
import QLhocvien from './components/Admin/QLhocvien.tsx';
import Qlnoidung from './components/Admin/Qlnoidung.tsx';
import Setting from './components/Admin/setting.tsx';

function readStoredUser(): AuthUser | null {
  const storedUser = localStorage.getItem('user_info');
  if (!storedUser) return null;
  try {
    return JSON.parse(storedUser) as AuthUser;
  } catch {
    localStorage.removeItem('user_info');
    localStorage.removeItem('auth_token');
    return null;
  }
}

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const user = readStoredUser();
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
};

export default function App() {
  const [user, setUser] = useState<AuthUser | null>(readStoredUser);
  const [activeTab, setActiveTab] = useState<'topic' | 'video' | 'notebook'>('topic');
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [isAddWordOpen, setIsAddWordOpen] = useState(false);
  const [topics, setTopics] = useState<Topic[]>([]);

  const openAddWord = async () => {
    const fetchedTopics = await getTopics();
    setTopics(fetchedTopics);
    setIsAddWordOpen(true);
  };

  const logout = () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user_info');
    setUser(null);
  };

  const handleAddWordSuccess = (_newCard: VocabCard) => setActiveTab('notebook');

  return (
    <div className="min-h-screen bg-[#F9FAFB] text-[#111827] flex flex-col">
      <Routes>
        {/* Auth Routes */}
        <Route path="/login" element={<Login onSuccess={(u) => setUser(u)} />} />
        <Route path="/register" element={<RegisterPage onSuccess={(u) => setUser(u)} />} />

        {/* Protected Routes for Users */}
        <Route path="/topics" element={
          <ProtectedRoute>
            <div className="flex flex-col h-full">
              <Navbar activeTab="topic" setActiveTab={setActiveTab} onOpenHelp={() => setIsHelpOpen(true)} onOpenAddWord={openAddWord} />
              <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <VocabByTopicPage />
                <div className="text-right mt-4">
                  <span className="text-sm text-gray-500 mr-3">{user?.full_name || user?.email}</span>
                  <button onClick={logout} className="text-sm text-blue-600 hover:underline">Đăng xuất</button>
                </div>
              </main>
            </div>
          </ProtectedRoute>
        } />

        <Route path="/video" element={
          <ProtectedRoute>
            <div className="flex flex-col h-full">
              <Navbar activeTab="video" setActiveTab={setActiveTab} onOpenHelp={() => setIsHelpOpen(true)} onOpenAddWord={openAddWord} />
              <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <VideoVocabPage />
                <div className="text-right mt-4">
                  <span className="text-sm text-gray-500 mr-3">{user?.full_name || user?.email}</span>
                  <button onClick={logout} className="text-sm text-blue-600 hover:underline">Đăng xuất</button>
                </div>
              </main>
            </div>
          </ProtectedRoute>
        } />

        <Route path="/notebook" element={
          <ProtectedRoute>
            <div className="flex flex-col h-full">
              <Navbar activeTab="notebook" setActiveTab={setActiveTab} onOpenHelp={() => setIsHelpOpen(true)} onOpenAddWord={openAddWord} />
              <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <MyNotebookPage />
                <div className="text-right mt-4">
                  <span className="text-sm text-gray-500 mr-3">{user?.full_name || user?.email}</span>
                  <button onClick={logout} className="text-sm text-blue-600 hover:underline">Đăng xuất</button>
                </div>
              </main>
            </div>
          </ProtectedRoute>
        } />

        {/* Admin Route */}
        <Route path="/admin" element={
          <ProtectedRoute>
            {user?.role === 'admin' ? <Admin onLogout={logout} /> : <Navigate to="/topics" replace />}
          </ProtectedRoute>

        } />
        <Route path="/admin/QLhocvien" element={
          <ProtectedRoute>
            {user?.role === 'admin' ? <QLhocvien /> : <Navigate to="/topics" replace />}
          </ProtectedRoute>
        } />
        <Route path="/admin/Qlnoidung" element={
          <Qlnoidung />
        } />
        <Route path="/admin/setting" element={
          <Setting />
        } />
        {/* Default Route */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>

      <AddWordModal isOpen={isAddWordOpen} onClose={() => setIsAddWordOpen(false)}
        topics={topics} onSuccess={handleAddWordSuccess} />
      <HelpModal isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} />
    </div>
  );
}
