import { useState } from 'react';
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
import { Routes, Route, Navigate } from 'react-router-dom';
// import AdminUsers from './components/Admin/QLhocvien.tsx';
// import AdminCourses from './components/Admin/Qlnoidung.tsx';
//   import AdminSettings from './

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

export default function App() {
  const [user, setUser] = useState<AuthUser | null>(readStoredUser);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [activeTab, setActiveTab] = useState<'topic' | 'video' | 'notebook'>('topic');
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [isAddWordOpen, setIsAddWordOpen] = useState(false);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [adminMode, setAdminMode] = useState(false);

  if (!user) {
    return authMode === 'login'
      ? <Login onSwitchToRegister={() => setAuthMode('register')} onSuccess={setUser} />
      : <RegisterPage onSwitchToLogin={() => setAuthMode('login')} onSuccess={setUser} />;
  }

  if (user.role === 'admin') {
    return <Admin onLogout={() => setUser(null)} />;
  }


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
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenHelp={() => setIsHelpOpen(true)}
        onOpenAddWord={openAddWord}
      />
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'topic' && <VocabByTopicPage />}
        {activeTab === 'video' && <VideoVocabPage />}
        {activeTab === 'notebook' && <MyNotebookPage />}
        <div className="text-right mt-4">
          <span className="text-sm text-gray-500 mr-3">{user.full_name || user.email}</span>
          <button onClick={logout} className="text-sm text-blue-600 hover:underline">Đăng xuất</button>
        </div>
      </main>
      <AddWordModal isOpen={isAddWordOpen} onClose={() => setIsAddWordOpen(false)}
        topics={topics} onSuccess={handleAddWordSuccess} />
      <HelpModal isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} />
    </div>
  );
}
