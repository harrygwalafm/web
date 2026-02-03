
import React, { useState, useEffect, useMemo } from 'react';
import Layout from './components/Layout';
import { Profile, View, Match, Message } from './types';
import { MOCK_PROFILES, CURRENT_USER } from './constants';
import { getIcebreaker, getCompatibilityScore, getProfileAdvice } from './services/geminiService';

// --- Sub-components ---

const LoginView: React.FC<{ onLogin: () => void }> = ({ onLogin }) => (
  <div className="flex flex-col items-center justify-center h-full px-8 bg-gradient-to-br from-rose-500 via-pink-500 to-orange-400 text-white text-center">
    <div className="mb-8 animate-bounce">
      <svg xmlns="http://www.w3.org/2000/svg" className="h-24 w-24" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
      </svg>
    </div>
    <h1 className="text-5xl font-extrabold tracking-tight mb-4">SoulAI</h1>
    <p className="text-xl opacity-90 mb-12">Connect deeper with AI-powered matching and icebreakers.</p>
    <button 
      onClick={onLogin}
      className="w-full py-4 bg-white text-rose-500 rounded-full font-bold text-lg shadow-xl hover:bg-opacity-90 transition-all transform hover:scale-105 active:scale-95"
    >
      Get Started
    </button>
    <p className="mt-6 text-xs opacity-70">By clicking Get Started, you agree to our Terms and Privacy Policy.</p>
  </div>
);

const MatchOverlay: React.FC<{ profile: Profile; onClose: () => void; onChat: () => void }> = ({ profile, onClose, onChat }) => (
  <div className="fixed inset-0 z-[100] bg-black/90 flex flex-col items-center justify-center p-8 animate-in fade-in zoom-in duration-300">
    <h2 className="text-4xl font-black text-rose-500 italic mb-8 drop-shadow-lg">It's a Match!</h2>
    <div className="flex -space-x-6 mb-12">
      <div className="w-32 h-32 rounded-full border-4 border-rose-500 overflow-hidden shadow-2xl transform -rotate-6">
        <img src={CURRENT_USER.imageUrl} className="w-full h-full object-cover" alt="Me" />
      </div>
      <div className="w-32 h-32 rounded-full border-4 border-rose-500 overflow-hidden shadow-2xl transform rotate-6">
        <img src={profile.imageUrl} className="w-full h-full object-cover" alt={profile.name} />
      </div>
    </div>
    <p className="text-white text-xl mb-12 font-medium">You and {profile.name} liked each other.</p>
    <div className="w-full space-y-4 max-w-xs">
      <button 
        onClick={onChat}
        className="w-full py-4 bg-rose-500 text-white rounded-full font-bold shadow-lg hover:bg-rose-600 transition-colors"
      >
        Send a Message
      </button>
      <button 
        onClick={onClose}
        className="w-full py-4 bg-transparent border-2 border-white/30 text-white rounded-full font-bold hover:bg-white/10 transition-colors"
      >
        Keep Swiping
      </button>
    </div>
  </div>
);

const DiscoverView: React.FC<{
  onLike: (profile: Profile) => void;
  onPass: () => void;
  profile: Profile | null;
}> = ({ onLike, onPass, profile }) => {
  if (!profile) return (
    <div className="flex flex-col items-center justify-center h-full text-gray-500 space-y-6 p-8 text-center animate-in fade-in duration-700">
      <div className="w-24 h-24 bg-rose-50 rounded-full flex items-center justify-center text-rose-300">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      </div>
      <div>
        <h3 className="text-2xl font-bold text-gray-800 mb-2">You've reached the end!</h3>
        <p className="text-gray-500 max-w-xs mx-auto">Expand your distance or age filters to find more potential matches nearby.</p>
      </div>
      <button onClick={() => window.location.reload()} className="px-6 py-2 bg-rose-500 text-white rounded-full font-bold shadow-md">
        Reset Feed
      </button>
    </div>
  );

  return (
    <div className="p-4 h-full flex flex-col">
      <div className="relative flex-1 rounded-3xl overflow-hidden shadow-2xl bg-white swipe-card">
        <img 
          src={profile.imageUrl} 
          alt={profile.name} 
          className="w-full h-full object-cover"
        />
        <div className="absolute top-4 left-4 bg-black/30 backdrop-blur-md px-3 py-1 rounded-full text-white text-xs font-bold border border-white/20">
          {Math.floor(Math.random() * 5) + 1} miles away
        </div>
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent p-6 text-white pt-20">
          <div className="flex items-center space-x-2">
            <h2 className="text-3xl font-bold">{profile.name}, {profile.age}</h2>
            <div className="w-2.5 h-2.5 bg-green-400 rounded-full border-2 border-black/50"></div>
          </div>
          <p className="text-sm opacity-90 mt-1 font-medium flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            {profile.occupation}
          </p>
          <p className="mt-3 line-clamp-2 text-sm text-gray-200 leading-relaxed italic">"{profile.bio}"</p>
          <div className="flex flex-wrap gap-2 mt-4">
            {profile.interests.map(interest => (
              <span key={interest} className="px-3 py-1 bg-white/10 backdrop-blur-md border border-white/20 rounded-full text-xs font-semibold">
                {interest}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="flex justify-center items-center space-x-6 mt-6 pb-4">
        <button 
          onClick={onPass}
          className="w-14 h-14 rounded-full bg-white shadow-lg flex items-center justify-center text-gray-400 hover:text-gray-600 transition-all hover:rotate-12 transform active:scale-90 border border-gray-100"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        <button 
          className="w-12 h-12 rounded-full bg-white shadow-md flex items-center justify-center text-blue-400 hover:text-blue-500 transition-all border border-gray-100"
        >
           <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
           </svg>
        </button>
        <button 
          onClick={() => onLike(profile)}
          className="w-16 h-16 rounded-full bg-rose-500 shadow-xl flex items-center justify-center text-white hover:bg-rose-600 transition-all transform hover:scale-110 active:scale-95"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-9 w-9" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
          </svg>
        </button>
      </div>
    </div>
  );
};

const MatchesView: React.FC<{ 
  matches: Match[]; 
  profiles: Profile[]; 
  onSelectChat: (matchId: string) => void 
}> = ({ matches, profiles, onSelectChat }) => {
  return (
    <div className="p-4 space-y-6 bg-white min-h-full">
      <div className="space-y-4">
        <h3 className="text-xs font-black text-rose-500 uppercase tracking-widest px-1">
          New Matches
        </h3>
        <div className="flex space-x-4 overflow-x-auto hide-scrollbar py-2 -mx-1 px-1">
          {matches.length === 0 ? (
            <div className="flex flex-col items-center justify-center w-full py-8 text-gray-300 border-2 border-dashed border-gray-100 rounded-3xl">
              <p className="text-sm font-medium">Keep swiping to find matches!</p>
            </div>
          ) : (
            matches.filter(m => !m.lastMessage).map(match => {
              const profile = profiles.find(p => p.id === match.profileId);
              if (!profile) return null;
              return (
                <button 
                  key={match.id} 
                  onClick={() => onSelectChat(match.id)}
                  className="flex-shrink-0 flex flex-col items-center space-y-2 group"
                >
                  <div className="relative">
                    <div className="w-16 h-16 rounded-full p-0.5 bg-gradient-to-br from-rose-500 to-orange-400">
                      <img src={profile.imageUrl} alt={profile.name} className="w-full h-full rounded-full object-cover border-2 border-white" />
                    </div>
                    <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-rose-500 rounded-full border-2 border-white flex items-center justify-center shadow-sm">
                        <div className="w-1.5 h-1.5 bg-white rounded-full animate-ping"></div>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-gray-700">{profile.name}</span>
                </button>
              );
            })
          )}
        </div>
      </div>

      <div className="space-y-2">
        <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest px-1">
          Messages
        </h3>
        <div className="divide-y divide-gray-50">
          {matches.length === 0 ? (
             <div className="text-center py-20 text-gray-300">
                <p>No conversations yet.</p>
             </div>
          ) : (
            matches.map(match => {
              const profile = profiles.find(p => p.id === match.profileId);
              if (!profile) return null;
              return (
                <button 
                  key={match.id} 
                  onClick={() => onSelectChat(match.id)}
                  className="w-full py-4 flex items-center space-x-4 hover:bg-rose-50/30 transition-all px-1 rounded-xl group"
                >
                  <div className="relative flex-shrink-0">
                    <img src={profile.imageUrl} alt={profile.name} className="w-16 h-16 rounded-full object-cover shadow-sm" />
                    <div className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 border-2 border-white rounded-full"></div>
                  </div>
                  <div className="flex-1 overflow-hidden">
                    <div className="flex justify-between items-baseline mb-1">
                      <span className="font-bold text-gray-900 group-hover:text-rose-600 transition-colors">{profile.name}</span>
                      <span className="text-[10px] text-gray-400 font-medium">{new Date(match.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    <p className={`text-sm line-clamp-1 ${match.lastMessage ? 'text-gray-500' : 'text-rose-500 font-semibold'}`}>
                      {match.lastMessage || `You matched! Start with a witty icebreaker.`}
                    </p>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

const ChatView: React.FC<{
  match: Match;
  profile: Profile;
  messages: Message[];
  onSendMessage: (text: string) => void;
  onBack: () => void;
}> = ({ match, profile, messages, onSendMessage, onBack }) => {
  const [inputText, setInputText] = useState('');
  const [icebreakers, setIcebreakers] = useState<string[]>([]);
  const [loadingIcebreakers, setLoadingIcebreakers] = useState(false);
  const [compScore, setCompScore] = useState<{ score: number, reason: string } | null>(null);
  const [isTyping, setIsTyping] = useState(false);

  const generateIcebreakers = async () => {
    setLoadingIcebreakers(true);
    const result = await getIcebreaker(CURRENT_USER, profile);
    setIcebreakers(result.split('\n').filter(s => s.trim().length > 0).slice(0, 3));
    setLoadingIcebreakers(false);
  };

  const checkCompatibility = async () => {
    const result = await getCompatibilityScore(CURRENT_USER, profile);
    setCompScore(result);
  };

  const handleSend = () => {
    if (!inputText.trim()) return;
    onSendMessage(inputText);
    setInputText('');
    setIsTyping(true);
    setTimeout(() => setIsTyping(false), 2500);
  };

  return (
    <div className="flex flex-col h-full bg-white relative">
      {/* Chat Header */}
      <div className="p-4 border-b flex items-center space-x-4 bg-white/80 backdrop-blur-lg sticky top-0 z-10 shadow-sm">
        <button onClick={onBack} className="text-gray-400 hover:text-rose-500 p-1">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div className="relative">
            <img src={profile.imageUrl} className="w-11 h-11 rounded-full object-cover border border-gray-100" alt="" />
            <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-green-500 border-2 border-white rounded-full shadow-sm"></div>
        </div>
        <div className="flex-1">
          <h4 className="font-extrabold text-gray-900 tracking-tight">{profile.name}</h4>
          <span className="text-[10px] text-gray-400 uppercase font-black tracking-widest flex items-center">
            {isTyping ? <span className="text-rose-500 animate-pulse">Typing...</span> : 'Active Now'}
          </span>
        </div>
        <button 
            onClick={checkCompatibility} 
            className="p-2.5 text-rose-500 bg-rose-50 hover:bg-rose-100 rounded-full transition-colors shadow-sm"
            title="Check AI Compatibility"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
          </svg>
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#fdfdfd] hide-scrollbar">
        {compScore && (
          <div className="bg-gradient-to-r from-rose-50 to-pink-50 border border-rose-100 p-5 rounded-3xl mb-6 shadow-sm animate-in slide-in-from-top-4 duration-500">
            <div className="flex justify-between items-center mb-2">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-rose-500 text-white rounded-full flex items-center justify-center text-xs font-black">AI</div>
                <span className="font-black text-rose-600 text-sm tracking-tight">SoulAI Insight: {compScore.score}%</span>
              </div>
              <button onClick={() => setCompScore(null)} className="text-rose-300 hover:text-rose-500">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <p className="text-rose-700 italic text-sm leading-relaxed">"{compScore.reason}"</p>
          </div>
        )}

        {messages.length === 0 && !loadingIcebreakers && icebreakers.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-gray-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <p className="text-sm text-gray-400 font-medium">Say something interesting to break the ice!</p>
            <button 
                onClick={generateIcebreakers}
                className="mt-4 px-4 py-2 bg-rose-500 text-white rounded-full text-xs font-bold shadow-md hover:bg-rose-600 transition-colors"
            >
                AI Suggestions
            </button>
          </div>
        )}
        
        {messages.map((msg, idx) => (
          <div key={msg.id} className={`flex flex-col ${msg.senderId === 'me' ? 'items-end' : 'items-start'} animate-in slide-in-from-bottom-2 duration-300`}>
            <div className={`max-w-[85%] px-4 py-2.5 rounded-2xl shadow-sm text-sm leading-relaxed ${
              msg.senderId === 'me' 
              ? 'bg-rose-500 text-white rounded-tr-none' 
              : 'bg-white border border-gray-100 text-gray-800 rounded-tl-none'
            }`}>
              {msg.text}
            </div>
            <span className="text-[10px] text-gray-300 mt-1 px-1 font-medium">
                {idx === messages.length - 1 && msg.senderId === 'me' ? 'Delivered' : ''}
            </span>
          </div>
        ))}

        {isTyping && (
           <div className="flex space-x-1 items-center bg-gray-100/50 w-fit px-3 py-2 rounded-2xl rounded-tl-none border border-gray-50">
             <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
             <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
             <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
           </div>
        )}

        {icebreakers.length > 0 && (
          <div className="space-y-2 pt-6 animate-in fade-in duration-500">
            <div className="flex items-center space-x-2 px-1 mb-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-rose-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                <p className="text-[10px] font-black text-rose-500 uppercase tracking-widest">AI Icebreakers</p>
            </div>
            {icebreakers.map((ib, i) => (
              <button 
                key={i} 
                onClick={() => {
                  onSendMessage(ib);
                  setIcebreakers([]);
                }}
                className="block w-full text-left p-4 text-sm bg-white border-2 border-rose-50 shadow-sm rounded-2xl text-rose-600 hover:border-rose-200 hover:bg-rose-50 transition-all font-medium leading-relaxed"
              >
                {ib}
              </button>
            ))}
            <button onClick={() => setIcebreakers([])} className="text-[10px] font-bold text-gray-400 text-center w-full hover:text-gray-600 uppercase pt-2">Dismiss</button>
          </div>
        )}
      </div>

      {/* Chat Footer */}
      <div className="p-4 border-t bg-white sticky bottom-0">
        <div className="flex space-x-3 items-center">
          <button 
            onClick={generateIcebreakers}
            disabled={loadingIcebreakers}
            className="p-3 text-rose-500 hover:bg-rose-50 rounded-full transition-all flex-shrink-0 bg-rose-50/50"
            title="AI Assist"
          >
            {loadingIcebreakers ? (
               <div className="w-6 h-6 border-2 border-rose-500 border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            )}
          </button>
          <div className="flex-1 relative flex items-center">
            <input 
              type="text" 
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Type a message..."
              className="w-full bg-gray-100 border-none rounded-2xl px-5 py-3 text-sm focus:ring-2 focus:ring-rose-500 transition-all placeholder:text-gray-400 font-medium"
            />
          </div>
          <button 
            disabled={!inputText.trim()}
            onClick={handleSend}
            className="p-3 bg-rose-500 text-white rounded-full shadow-lg shadow-rose-200 disabled:opacity-50 disabled:shadow-none hover:bg-rose-600 transition-all transform active:scale-95 flex-shrink-0"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

const ProfileView: React.FC<{ profile: Profile }> = ({ profile }) => {
  const [advice, setAdvice] = useState<string>('');
  const [loadingAdvice, setLoadingAdvice] = useState(false);

  const getCoachAdvice = async () => {
    setLoadingAdvice(true);
    const res = await getProfileAdvice(profile);
    setAdvice(res);
    setLoadingAdvice(false);
  };

  return (
    <div className="pb-10 bg-white min-h-full">
      <div className="relative h-80">
        <img src={profile.imageUrl} className="w-full h-full object-cover" alt="" />
        <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-transparent"></div>
        <div className="absolute -bottom-14 left-1/2 -translate-x-1/2">
          <div className="relative">
            <div className="w-32 h-32 rounded-full border-[6px] border-white overflow-hidden shadow-2xl bg-gray-100">
              <img src={profile.imageUrl} className="w-full h-full object-cover" alt="" />
            </div>
            <button className="absolute bottom-1 right-1 p-2.5 bg-rose-500 text-white rounded-full shadow-lg border-2 border-white transform hover:scale-110 active:scale-95 transition-all">
               <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
               </svg>
            </button>
          </div>
        </div>
      </div>
      
      <div className="mt-16 px-6 text-center">
        <div className="flex items-center justify-center space-x-2">
            <h2 className="text-3xl font-black text-gray-900 tracking-tight">{profile.name}, {profile.age}</h2>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-500" viewBox="0 0 20 20" fill="currentColor">
               <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
        </div>
        <p className="text-gray-500 text-sm font-semibold tracking-wide uppercase mt-1">{profile.occupation} • {profile.location}</p>
        
        <div className="mt-8 text-left space-y-8">
          {/* AI Coach Card */}
          <section className="bg-rose-500 rounded-3xl p-6 text-white shadow-xl shadow-rose-200">
             <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                </div>
                <div>
                    <h3 className="font-black text-lg tracking-tight">AI Profile Coach</h3>
                    <p className="text-white/80 text-xs font-medium uppercase tracking-widest">Powered by Gemini</p>
                </div>
             </div>
             
             {advice ? (
                 <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-4 text-sm animate-in fade-in zoom-in duration-500">
                    <p className="italic leading-relaxed">"{advice}"</p>
                    <button onClick={() => setAdvice('')} className="mt-3 text-[10px] font-black uppercase text-white/60 hover:text-white">Close Insight</button>
                 </div>
             ) : (
                <button 
                    onClick={getCoachAdvice}
                    disabled={loadingAdvice}
                    className="w-full py-3 bg-white text-rose-500 rounded-2xl font-black text-sm hover:bg-opacity-90 transition-all flex items-center justify-center space-x-2 shadow-lg"
                >
                    {loadingAdvice ? (
                        <div className="w-5 h-5 border-2 border-rose-500 border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                        <>
                            <span>Improve My Profile</span>
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                            </svg>
                        </>
                    )}
                </button>
             )}
          </section>

          <section>
            <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-3 px-1">About Me</h3>
            <p className="text-gray-700 leading-relaxed bg-gray-50 p-5 rounded-3xl border border-gray-100 italic">"{profile.bio}"</p>
          </section>

          <section>
            <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-3 px-1">Interests</h3>
            <div className="flex flex-wrap gap-2.5">
              {profile.interests.map(interest => (
                <span key={interest} className="px-5 py-2.5 bg-rose-50 text-rose-600 rounded-2xl text-xs font-black shadow-sm border border-rose-100">
                  {interest}
                </span>
              ))}
            </div>
          </section>

          <div className="pt-6 space-y-4">
             <button className="w-full py-4 bg-gray-900 text-white rounded-2xl font-black shadow-xl hover:bg-gray-800 transition-all transform hover:-translate-y-1">
                Edit Information
             </button>
             <button className="w-full py-4 text-rose-500 font-black text-sm uppercase tracking-widest hover:bg-rose-50 rounded-2xl transition-all">
                Logout
             </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [view, setView] = useState<View>('discover');
  const [profiles, setProfiles] = useState<Profile[]>(MOCK_PROFILES);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [matches, setMatches] = useState<Match[]>([]);
  const [activeMatchId, setActiveMatchId] = useState<string | null>(null);
  const [chatMessages, setChatMessages] = useState<Record<string, Message[]>>({});
  const [matchCelebrationProfile, setMatchCelebrationProfile] = useState<Profile | null>(null);

  // Persistence (Optional for demo)
  useEffect(() => {
    const saved = localStorage.getItem('soulai_matches');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setMatches(parsed.matches);
        setChatMessages(parsed.messages);
      } catch (e) {}
    }
  }, []);

  useEffect(() => {
    if (matches.length > 0) {
      localStorage.setItem('soulai_matches', JSON.stringify({ matches, messages: chatMessages }));
    }
  }, [matches, chatMessages]);

  const handleLike = (profile: Profile) => {
    // 50% chance of a "match" for demo purposes
    const isMatch = Math.random() > 0.4;
    
    if (isMatch) {
      const matchId = Math.random().toString(36).substr(2, 9);
      const newMatch: Match = {
        id: matchId,
        profileId: profile.id,
        timestamp: Date.now(),
        lastMessage: ''
      };
      setMatches(prev => [newMatch, ...prev]);
      setMatchCelebrationProfile(profile);
    }
    
    setCurrentIndex(prev => prev + 1);
  };

  const handlePass = () => {
    setCurrentIndex(prev => prev + 1);
  };

  const handleSendMessage = (text: string) => {
    if (!activeMatchId) return;
    const newMessage: Message = {
      id: Date.now().toString(),
      senderId: 'me',
      text,
      timestamp: Date.now()
    };
    
    setChatMessages(prev => ({
      ...prev,
      [activeMatchId]: [...(prev[activeMatchId] || []), newMessage]
    }));

    setMatches(prev => prev.map(m => 
      m.id === activeMatchId ? { ...m, lastMessage: text, timestamp: Date.now() } : m
    ));

    // Simple auto-reply simulation to make it feel alive
    setTimeout(() => {
        const replies = [
          "I love that! I've always thought the same.",
          "That's so cool. We should definitely talk more about that!",
          "Haha, you're funny. I like your vibe.",
          "Tell me more! I'm genuinely curious.",
          "Definitely! When are you free to chat properly?"
        ];
        const randomReply = replies[Math.floor(Math.random() * replies.length)];
        const reply: Message = {
            id: (Date.now() + 1).toString(),
            senderId: 'them',
            text: randomReply,
            timestamp: Date.now()
        };
        setChatMessages(prev => ({
            ...prev,
            [activeMatchId]: [...(prev[activeMatchId] || []), reply]
        }));
        setMatches(prev => prev.map(m => 
            m.id === activeMatchId ? { ...m, lastMessage: randomReply, timestamp: Date.now() } : m
        ));
    }, 3000);
  };

  const currentProfile = profiles[currentIndex] || null;

  if (!isLoggedIn) {
    return <LoginView onLogin={() => setIsLoggedIn(true)} />;
  }

  const renderContent = () => {
    switch (view) {
      case 'discover':
        return <DiscoverView profile={currentProfile} onLike={handleLike} onPass={handlePass} />;
      case 'matches':
        return <MatchesView matches={matches} profiles={profiles} onSelectChat={(id) => {
          setActiveMatchId(id);
          setView('chat');
        }} />;
      case 'chat':
        if (!activeMatchId) return null;
        const match = matches.find(m => m.id === activeMatchId)!;
        const profile = profiles.find(p => p.id === match.profileId)!;
        return (
          <ChatView 
            match={match} 
            profile={profile} 
            messages={chatMessages[activeMatchId] || []} 
            onSendMessage={handleSendMessage}
            onBack={() => setView('matches')}
          />
        );
      case 'profile':
        return <ProfileView profile={CURRENT_USER} />;
      default:
        return <DiscoverView profile={currentProfile} onLike={handleLike} onPass={handlePass} />;
    }
  };

  return (
    <>
      <Layout 
        currentView={view} 
        setView={setView} 
        hasUnread={matches.some(m => !m.lastMessage)}
      >
        {renderContent()}
      </Layout>

      {matchCelebrationProfile && (
        <MatchOverlay 
          profile={matchCelebrationProfile} 
          onClose={() => setMatchCelebrationProfile(null)}
          onChat={() => {
            const m = matches.find(m => m.profileId === matchCelebrationProfile.id);
            if (m) {
                setActiveMatchId(m.id);
                setView('chat');
            }
            setMatchCelebrationProfile(null);
          }}
        />
      )}
    </>
  );
}
