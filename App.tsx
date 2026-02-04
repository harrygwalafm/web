
import React, { useState, useEffect, useMemo, useRef } from 'react';
import Layout from './components/Layout';
import { Profile, View, Match, Message, Filters, Report } from './types';
import { MOCK_PROFILES, CURRENT_USER } from './constants';
import { getIcebreaker, getCompatibilityScore, getProfileAdvice, rewriteBio, findDateSpots } from './services/geminiService';
import { GoogleGenAI, LiveServerMessage, Modality, Blob as GeminiBlob } from '@google/genai';

// --- Live API Helper Functions ---
function decode(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

function encode(bytes: Uint8Array) {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

// --- Notification Helper ---
const sendNotification = (title: string, options?: NotificationOptions, onClick?: () => void) => {
  if (!("Notification" in window)) return;
  if (Notification.permission === "granted") {
    const notification = new Notification(title, {
      icon: 'https://cdn-icons-png.flaticon.com/512/2589/2589175.png',
      ...options
    });
    if (onClick) {
      notification.onclick = () => { window.focus(); onClick(); notification.close(); };
    }
  }
};

// --- Admin Components ---

const AdminDashboard: React.FC<{ 
  profiles: Profile[]; 
  reports: Report[]; 
  onBan: (id: string) => void;
  onResolveReport: (id: string) => void;
}> = ({ profiles, reports, onBan, onResolveReport }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'reports'>('overview');

  const stats = {
    totalUsers: profiles.length,
    pendingReports: reports.filter(r => r.status === 'pending').length,
    totalReports: reports.length
  };

  return (
    <div className="p-6 space-y-6 animate-in fade-in duration-500">
      <div className="flex space-x-2 bg-gray-100 p-1 rounded-2xl">
        {(['overview', 'users', 'reports'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${activeTab === tab ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
          >
            {tab}
          </button>
        ))}
      </div>

      {activeTab === 'overview' && (
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-sm">
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Active Users</span>
            <div className="text-3xl font-black text-gray-900 mt-1">{stats.totalUsers}</div>
          </div>
          <div className="bg-rose-50 p-6 rounded-[2.5rem] border border-rose-100 shadow-sm">
            <span className="text-[10px] font-black text-rose-500 uppercase tracking-widest">Alerts</span>
            <div className="text-3xl font-black text-rose-500 mt-1">{stats.pendingReports}</div>
          </div>
          <div className="col-span-2 bg-gray-900 p-6 rounded-[2.5rem] text-white">
            <h4 className="text-[10px] font-black uppercase tracking-widest opacity-60">System Health</h4>
            <div className="flex items-center space-x-2 mt-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm font-bold">All services operational</span>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'users' && (
        <div className="space-y-3">
          {profiles.map(p => (
            <div key={p.id} className="bg-white p-4 rounded-3xl border border-gray-100 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <img src={p.imageUrl} className="w-10 h-10 rounded-full object-cover" />
                <div>
                  <h5 className="text-sm font-black text-gray-900">{p.name}</h5>
                  <p className="text-[10px] text-gray-400 font-bold uppercase">{p.occupation}</p>
                </div>
              </div>
              <button 
                onClick={() => { if(window.confirm(`Ban ${p.name}?`)) onBan(p.id) }}
                className="p-2 text-rose-500 hover:bg-rose-50 rounded-xl transition-all"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636" /></svg>
              </button>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'reports' && (
        <div className="space-y-4">
          {reports.length === 0 ? (
            <div className="text-center py-12 text-gray-400 font-bold text-xs uppercase tracking-widest">No reports found</div>
          ) : (
            reports.map(r => {
              const target = profiles.find(p => p.id === r.targetId);
              return (
                <div key={r.id} className={`p-5 rounded-[2rem] border-2 transition-all ${r.status === 'resolved' ? 'bg-gray-50 border-gray-100 opacity-60' : 'bg-white border-rose-100'}`}>
                  <div className="flex justify-between items-start">
                    <div className="flex items-center space-x-2">
                      <div className={`w-2 h-2 rounded-full ${r.status === 'pending' ? 'bg-rose-500 animate-pulse' : 'bg-gray-300'}`}></div>
                      <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">{r.status}</span>
                    </div>
                    <span className="text-[10px] text-gray-300 font-bold">{new Date(r.timestamp).toLocaleDateString()}</span>
                  </div>
                  <div className="mt-3">
                    <span className="text-xs font-black text-gray-900">Target: {target?.name || 'Deleted User'}</span>
                    <p className="text-xs text-gray-500 mt-1 leading-relaxed">Reason: {r.reason}</p>
                  </div>
                  {r.status === 'pending' && (
                    <div className="flex space-x-2 mt-4">
                      <button 
                        onClick={() => onBan(r.targetId)}
                        className="flex-1 py-2 bg-rose-500 text-white rounded-xl text-[10px] font-black uppercase"
                      >
                        Ban User
                      </button>
                      <button 
                        onClick={() => onResolveReport(r.id)}
                        className="flex-1 py-2 bg-gray-100 text-gray-500 rounded-xl text-[10px] font-black uppercase"
                      >
                        Dismiss
                      </button>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};

// --- Main App Logic ---

const LoginView: React.FC<{ onLogin: (role: 'user' | 'admin', isNew: boolean) => void }> = ({ onLogin }) => {
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({ username: '', password: '' });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      // Admin backdoor for demo
      if (formData.username.toLowerCase() === 'admin' && formData.password === 'admin') {
        onLogin('admin', false);
      } else {
        onLogin('user', mode === 'signup');
      }
    }, 1200);
  };

  return (
    <div className="flex flex-col h-full bg-white px-8 py-12">
      <div className="flex-1 flex flex-col justify-center items-center text-center">
        <div className="w-20 h-20 bg-gradient-to-br from-pink-500 to-rose-500 rounded-3xl flex items-center justify-center shadow-2xl mb-6 rotate-3 transform hover:rotate-0 transition-transform duration-500">
          <svg className="w-10 h-10 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" /></svg>
        </div>
        <h1 className="text-4xl font-black text-gray-900 mb-2 tracking-tight">NMZ Mingle</h1>
        <p className="text-gray-400 font-medium mb-10 max-w-[240px]">Find your human in a world of machines.</p>

        <form onSubmit={handleSubmit} className="w-full space-y-4">
          <input
            type="text"
            required
            placeholder="Username"
            value={formData.username}
            onChange={e => setFormData({ ...formData, username: e.target.value })}
            className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm focus:ring-2 focus:ring-rose-500 focus:bg-white outline-none transition-all"
          />
          <input
            type="password"
            required
            placeholder="Password"
            value={formData.password}
            onChange={e => setFormData({ ...formData, password: e.target.value })}
            className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm focus:ring-2 focus:ring-rose-500 focus:bg-white outline-none transition-all"
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-gray-900 text-white rounded-2xl font-black shadow-xl hover:bg-black active:scale-95 transition-all flex items-center justify-center"
          >
            {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : 'Sign In'}
          </button>
        </form>
      </div>
      <div className="pt-8 text-center">
        <button onClick={() => setMode(mode === 'login' ? 'signup' : 'login')} className="text-xs font-black text-rose-500 uppercase tracking-widest">{mode === 'login' ? "Don't have an account? Sign Up" : "Already have an account? Log In"}</button>
      </div>
    </div>
  );
};

// --- Discovery, Chat, and Other Views ---
// (Simplified for brevity, assuming existing logic from previous turn)

const ReportModal: React.FC<{ profile: Profile; onClose: () => void; onReport: (reason: string) => void; onBlock: () => void; }> = ({ profile, onClose, onReport, onBlock }) => {
  const [reason, setReason] = useState('');
  const reasons = ['Inappropriate Content', 'Harassment', 'Fake Profile / Spam', 'Other'];
  return (
    <div className="fixed inset-0 z-[110] bg-black/60 backdrop-blur-md flex items-center justify-center p-6 animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-xs rounded-[2.5rem] p-8 space-y-6 shadow-2xl">
        <h3 className="text-xl font-black text-gray-900 text-center">Report {profile.name}</h3>
        <div className="space-y-2">
          {reasons.map(r => (
            <button key={r} onClick={() => setReason(r)} className={`w-full py-3 px-4 rounded-2xl text-[10px] font-black uppercase text-left border-2 transition-all ${reason === r ? 'border-rose-500 bg-rose-50 text-rose-500' : 'border-gray-50 text-gray-400'}`}>{r}</button>
          ))}
        </div>
        <button onClick={() => onReport(reason)} disabled={!reason} className="w-full py-4 bg-gray-900 text-white rounded-2xl font-black text-xs disabled:opacity-50">Submit Report</button>
        <button onClick={onClose} className="w-full text-[10px] font-black uppercase text-gray-300">Cancel</button>
      </div>
    </div>
  );
};

const DiscoverView: React.FC<{ profile: Profile | null; onLike: (p: Profile) => void; onPass: () => void; onOpenSafety: (p: Profile) => void; }> = ({ profile, onLike, onPass, onOpenSafety }) => {
  if (!profile) return <div className="h-full flex flex-col items-center justify-center p-12 text-center text-gray-400 font-black uppercase tracking-widest">No more users nearby</div>;
  return (
    <div className="p-4 h-full flex flex-col animate-in fade-in zoom-in duration-500">
      <div className="relative flex-1 rounded-[2.5rem] overflow-hidden shadow-2xl bg-white border border-gray-100 group">
        <img src={profile.imageUrl} className="w-full h-full object-cover" />
        <button onClick={() => onOpenSafety(profile)} className="absolute top-6 right-6 p-3 bg-black/20 backdrop-blur-md rounded-full text-white/80 hover:bg-black/40"><svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg></button>
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent p-6 flex flex-col justify-end text-white">
          <h2 className="text-3xl font-black">{profile.name}, {profile.age}</h2>
          <p className="text-sm font-bold opacity-80 mt-1">{profile.occupation}</p>
          <p className="mt-4 text-xs italic opacity-90 line-clamp-2">"{profile.bio}"</p>
        </div>
      </div>
      <div className="flex justify-center items-center space-x-4 mt-6 pb-2">
        <button onClick={onPass} className="w-16 h-16 rounded-full bg-white shadow-xl flex items-center justify-center text-gray-400 hover:text-rose-500 transition-all"><svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg></button>
        <button onClick={() => onLike(profile)} className="w-20 h-20 rounded-full bg-rose-500 shadow-2xl flex items-center justify-center text-white"><svg className="h-10 w-10" fill="currentColor" viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" /></svg></button>
      </div>
    </div>
  );
};

const ChatView: React.FC<{ profile: Profile; messages: Message[]; onSendMessage: (t?: string, i?: string) => void; onBack: () => void; onOpenSafety: (p: Profile) => void; }> = ({ profile, messages, onSendMessage, onBack, onOpenSafety }) => {
  const [text, setText] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);
  return (
    <div className="flex flex-col h-full bg-white">
      <div className="p-4 border-b flex items-center space-x-4 sticky top-0 bg-white/90 backdrop-blur-md z-10">
        <button onClick={onBack} className="text-gray-400"><svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg></button>
        <img src={profile.imageUrl} className="w-10 h-10 rounded-full object-cover" />
        <div className="flex-1"><h4 className="font-black text-gray-900">{profile.name}</h4><p className="text-[10px] text-green-500 font-black uppercase">Online</p></div>
        <button onClick={() => onOpenSafety(profile)} className="p-2 text-gray-300"><svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-7.618 3.033A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg></button>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map(m => (
          <div key={m.id} className={`flex ${m.senderId === 'me' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] rounded-3xl overflow-hidden shadow-sm ${m.senderId === 'me' ? 'bg-rose-500 text-white rounded-tr-none' : 'bg-gray-100 text-gray-800 rounded-tl-none'}`}>
              {m.imageUrl && <img src={m.imageUrl} className="w-full" />}
              {m.text && <div className="px-4 py-3 text-sm">{m.text}</div>}
            </div>
          </div>
        ))}
      </div>
      <div className="p-4 border-t flex space-x-2">
        <input type="file" className="hidden" ref={fileRef} accept="image/*" onChange={e => {
          const f = e.target.files?.[0];
          if(f){ const r = new FileReader(); r.onloadend = () => onSendMessage(undefined, r.result as string); r.readAsDataURL(f); }
        }} />
        <button onClick={() => fileRef.current?.click()} className="p-3 text-gray-300"><svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg></button>
        <input value={text} onChange={e => setText(e.target.value)} className="flex-1 bg-gray-50 border-none rounded-2xl px-4 py-3 text-sm" placeholder="Message..." />
        <button onClick={() => { if(text){ onSendMessage(text); setText(''); } }} className="p-3 bg-rose-500 text-white rounded-full"><svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg></button>
      </div>
    </div>
  );
};

export default function App() {
  const [authState, setAuthState] = useState<'loggedOut' | 'onboarding' | 'loggedIn'>('loggedOut');
  const [userProfile, setUserProfile] = useState<Profile>(CURRENT_USER);
  const [view, setView] = useState<View>('discover');
  const [profiles, setProfiles] = useState<Profile[]>(MOCK_PROFILES);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [matches, setMatches] = useState<Match[]>([]);
  const [activeMatchId, setActiveMatchId] = useState<string | null>(null);
  const [chatMessages, setChatMessages] = useState<Record<string, Message[]>>({});
  const [blockedUserIds, setBlockedUserIds] = useState<string[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [reportingProfile, setReportingProfile] = useState<Profile | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem('soulai_reports');
    const blocked = localStorage.getItem('soulai_blocked');
    const profilesSaved = localStorage.getItem('soulai_all_profiles');
    if (saved) setReports(JSON.parse(saved));
    if (blocked) setBlockedUserIds(JSON.parse(blocked));
    if (profilesSaved) setProfiles(JSON.parse(profilesSaved));
  }, []);

  useEffect(() => {
    localStorage.setItem('soulai_reports', JSON.stringify(reports));
    localStorage.setItem('soulai_blocked', JSON.stringify(blockedUserIds));
    localStorage.setItem('soulai_all_profiles', JSON.stringify(profiles));
  }, [reports, blockedUserIds, profiles]);

  const handleLogin = (role: 'user' | 'admin', isNew: boolean) => {
    setUserProfile({ ...userProfile, role });
    setAuthState(isNew ? 'onboarding' : 'loggedIn');
  };

  const handleGlobalBan = (id: string) => {
    setProfiles(prev => prev.filter(p => p.id !== id));
    setBlockedUserIds(prev => [...prev, id]);
    setMatches(prev => prev.filter(m => m.profileId !== id));
    setReports(prev => prev.map(r => r.targetId === id ? { ...r, status: 'resolved' } : r));
    sendNotification("Global Ban Executed", { body: `User ${id} has been removed from NMZ Mingle.` });
  };

  const handleResolveReport = (reportId: string) => {
    setReports(prev => prev.map(r => r.id === reportId ? { ...r, status: 'resolved' } : r));
  };

  const handleReport = (reason: string) => {
    if (!reportingProfile) return;
    const newReport: Report = {
      id: Math.random().toString(36).substr(2, 9),
      reporterId: userProfile.id,
      targetId: reportingProfile.id,
      reason,
      timestamp: Date.now(),
      status: 'pending'
    };
    setReports(prev => [newReport, ...prev]);
    setBlockedUserIds(prev => [...prev, reportingProfile.id]);
    setReportingProfile(null);
    if(view === 'chat') setView('matches');
    sendNotification("Report Filed", { body: "Our moderators will review this shortly." });
  };

  const handleSendMessage = (text?: string, imageUrl?: string) => {
    if (!activeMatchId) return;
    const msg: Message = { id: Date.now().toString(), senderId: 'me', text, imageUrl, timestamp: Date.now() };
    setChatMessages(prev => ({ ...prev, [activeMatchId]: [...(prev[activeMatchId] || []), msg] }));
  };

  if (authState === 'loggedOut') return <LoginView onLogin={handleLogin} />;
  
  const availableProfiles = profiles.filter(p => !blockedUserIds.includes(p.id));
  const currentProfile = availableProfiles[currentIndex] || null;

  return (
    <>
      <Layout currentView={view} setView={setView} userRole={userProfile.role}>
        <div className="flex-1 overflow-hidden h-full">
          {view === 'admin' && (
            <AdminDashboard 
              profiles={profiles} 
              reports={reports} 
              onBan={handleGlobalBan} 
              onResolveReport={handleResolveReport} 
            />
          )}
          {view === 'discover' && <DiscoverView profile={currentProfile} onLike={() => setCurrentIndex(i => i + 1)} onPass={() => setCurrentIndex(i => i + 1)} onOpenSafety={setReportingProfile} />}
          {view === 'matches' && (
            <div className="p-4 space-y-4">
              <h3 className="text-xl font-black text-gray-900 px-2">Matches</h3>
              {matches.filter(m => !blockedUserIds.includes(m.profileId)).map(m => {
                const p = profiles.find(x => x.id === m.profileId);
                return (
                  <button key={m.id} onClick={() => { setActiveMatchId(m.id); setView('chat'); }} className="w-full flex items-center space-x-4 p-4 hover:bg-rose-50 rounded-3xl transition-all">
                    <img src={p?.imageUrl} className="w-16 h-16 rounded-full object-cover" />
                    <div className="text-left"><h4 className="font-black text-gray-900">{p?.name}</h4><p className="text-xs text-gray-400">Say something witty...</p></div>
                  </button>
                );
              })}
            </div>
          )}
          {view === 'chat' && activeMatchId && (
            <ChatView 
              profile={profiles.find(p => p.id === matches.find(m => m.id === activeMatchId)!.profileId)!} 
              messages={chatMessages[activeMatchId] || []} 
              onSendMessage={handleSendMessage} 
              onBack={() => setView('matches')} 
              onOpenSafety={setReportingProfile}
            />
          )}
          {view === 'profile' && (
            <div className="p-10 flex flex-col items-center animate-in fade-in duration-500">
              <img src={userProfile.imageUrl} className="w-32 h-32 rounded-[2.5rem] shadow-2xl border-4 border-white" />
              <h2 className="mt-4 text-2xl font-black text-gray-900">{userProfile.name}</h2>
              <span className="text-[10px] font-black uppercase text-rose-500 tracking-widest">{userProfile.role} Account</span>
              <button onClick={() => setAuthState('loggedOut')} className="mt-10 py-4 px-8 bg-gray-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl">Logout</button>
            </div>
          )}
        </div>
      </Layout>

      {reportingProfile && (
        <ReportModal 
          profile={reportingProfile} 
          onClose={() => setReportingProfile(null)} 
          onReport={handleReport} 
          onBlock={() => handleGlobalBan(reportingProfile.id)}
        />
      )}
    </>
  );
}
