
import React from 'react';
import { View, Profile } from '../types';

interface LayoutProps {
  children: React.ReactNode;
  currentView: View;
  setView: (view: View) => void;
  hasUnread?: boolean;
  userRole?: 'user' | 'admin';
}

const Layout: React.FC<LayoutProps> = ({ children, currentView, setView, hasUnread, userRole }) => {
  return (
    <div className="flex flex-col h-screen max-w-md mx-auto bg-white shadow-xl relative">
      {/* Header */}
      <header className="p-4 border-b flex justify-between items-center bg-white sticky top-0 z-50">
        <h1 className="text-2xl font-bold bg-gradient-to-r from-pink-500 to-rose-500 bg-clip-text text-transparent">
          NMZ Mingle
        </h1>
        <div className="flex space-x-2">
          {userRole === 'admin' && (
            <button 
              onClick={() => setView('admin')}
              className={`p-2 rounded-xl transition-all ${currentView === 'admin' ? 'bg-gray-900 text-white shadow-lg' : 'bg-gray-50 text-gray-400 hover:text-gray-900'}`}
              title="Admin Dashboard"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </button>
          )}
          <button 
            onClick={() => setView('profile')}
            className={`p-2 rounded-xl transition-all ${currentView === 'profile' ? 'bg-rose-100 text-rose-500' : 'bg-gray-50 text-gray-400'}`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto hide-scrollbar bg-gray-50 pb-20">
        {children}
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white border-t flex justify-around p-3 z-50">
        <button 
          onClick={() => setView('discover')}
          className={`flex flex-col items-center space-y-1 ${currentView === 'discover' ? 'text-rose-500' : 'text-gray-400'}`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
          <span className="text-[10px] font-black uppercase tracking-widest">Discover</span>
        </button>
        
        <button 
          onClick={() => setView('matches')}
          className={`flex flex-col items-center space-y-1 relative ${currentView === 'matches' || currentView === 'chat' ? 'text-rose-500' : 'text-gray-400'}`}
        >
          {hasUnread && <div className="absolute top-0 right-1 w-2 h-2 bg-rose-500 rounded-full animate-pulse"></div>}
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
          <span className="text-[10px] font-black uppercase tracking-widest">Matches</span>
        </button>

        <button 
          onClick={() => setView('profile')}
          className={`flex flex-col items-center space-y-1 ${currentView === 'profile' ? 'text-rose-500' : 'text-gray-400'}`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="text-[10px] font-black uppercase tracking-widest">Profile</span>
        </button>
      </nav>
    </div>
  );
};

export default Layout;
