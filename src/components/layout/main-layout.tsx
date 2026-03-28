'use client';

import Link from 'next/link';
import { useEffect, useState, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { AnimatePresence, motion } from 'motion/react';
import { useEchoLensStore } from '@/store/echolens-store';
import { useEchoLensWs } from '@/hooks/use-echolens-ws';
import { StructuredChart } from '@/components/cards/chart-card';
import { ContextCard } from '@/components/cards/context-card';
import { MicButton } from '@/components/controls/mic-button';
import { AuraHero } from '@/components/aura';
import { Mic, Presentation, Bot, BarChart3, FileText, MessageSquare, CheckSquare, Users, Clock, List, PlayCircle, CheckCircle2, Activity } from 'lucide-react';

/* ─── Mock Data ────────────────────────────────────── */
const MEETING_AGENDA = [
  { id: 1, title: 'Opening Remarks', status: 'completed' },
  { id: 2, title: 'Strategic Review', status: 'active' },
  { id: 3, title: 'Roadmap Planning', status: 'upcoming' }
];

const ATTENDEES = [
  { id: '1', initials: 'MR', color: 'bg-blue-900/50 text-blue-200 border-blue-700/50' },
  { id: '2', initials: 'AK', color: 'bg-purple-900/50 text-purple-200 border-purple-700/50' },
  { id: '3', initials: 'TC', color: 'bg-emerald-900/50 text-emerald-200 border-emerald-700/50' },
  { id: '4', initials: '+4', color: 'bg-slate-800 text-slate-400 border-slate-600/50' }
];

/* ─── Accent Colors ──────────────────────────────────── */
const getCategoryStyles = (category: string) => {
  switch(category) {
    case 'decision': return { icon: CheckCircle2, color: 'text-emerald-400' };
    case 'action_item': return { icon: CheckSquare, color: 'text-rose-400' };
    case 'DOC_MENTION': return { icon: FileText, color: 'text-blue-400' };
    case 'question': return { icon: MessageSquare, color: 'text-purple-400' };
    default: return { icon: Activity, color: 'text-[#0A84FF]' };
  }
};

type ArtifactDisplay =
  | {
      id: string;
      category: 'key_point' | 'decision' | 'action_item' | 'question';
      title: string;
      owner?: string;
      type: 'bullet';
    }
  | {
      id: string;
      category: 'DOC_MENTION';
      title: string;
      excerpt: string;
      owner: string;
      type: 'reference';
    };

/* ═══════════════════════════════════════════════════════
   Main Layout — Cinematic Ambient UI
   ═══════════════════════════════════════════════════════ */
interface MainLayoutProps {
  viewer: {
    userName: string;
    userEmail: string;
    workspaceId: string;
    workspaceName: string;
  };
}

export function MainLayout({ viewer }: MainLayoutProps) {
  const searchParams = useSearchParams();
  const urlSessionId = searchParams.get('session');

  const {
    transcriptChunks,
    interimText,
    charts,
    references,
    contextMatches,
    summaryBullets,
    isRecording,
    agentStatuses,
    sessionId,
    setSessionId,
  } = useEchoLensStore();

  useEffect(() => {
    if (urlSessionId) {
      if (urlSessionId !== sessionId) setSessionId(urlSessionId);
    } else if (!sessionId) {
      setSessionId(`session-${viewer.workspaceId}-${Date.now()}`);
    }
  }, [urlSessionId, sessionId, setSessionId, viewer.workspaceId]);

  useEchoLensWs();
  
  const transcriptEndRef = useRef<HTMLDivElement>(null);

  // Load Keynote-style fonts seamlessly
  useEffect(() => {
    if (!document.getElementById('echolens-fonts')) {
      const link = document.createElement('link');
      link.id = 'echolens-fonts';
      link.href = 'https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400&family=Inter:wght@300;400;500;600&display=swap';
      link.rel = 'stylesheet';
      document.head.appendChild(link);
    }
  }, []);

  // Timer effect
  const [elapsedTime, setElapsedTime] = useState(0);
  useEffect(() => {
    const timeInterval = setInterval(() => setElapsedTime(prev => prev + 1), 1000);
    return () => clearInterval(timeInterval);
  }, []);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `00:${m}:${s}`;
  };

  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [transcriptChunks, interimText]);

  const activeAgents = Object.values(agentStatuses).filter((s) => s === 'processing').length;
  const isAnalyzing = activeAgents > 0;
  const hasContent = summaryBullets.length > 0 || charts.length > 0 || references.length > 0 || contextMatches.length > 0;

  // Derive "Active Insight" for the center screen
  // Strongly favor the most recent visual asset
  const activeChart = charts.length > 0 ? charts[charts.length - 1] : null;
  const activeContext = contextMatches.length > 0 ? contextMatches[contextMatches.length - 1] : null;

  // Combine Artifacts for right sidebar
  const artifacts: ArtifactDisplay[] = [
    ...summaryBullets.map(b => ({
      id: b.id,
      category: b.category,
      title: b.text,
      owner: b.owner,
      type: 'bullet' as const
    })),
    ...references.flatMap(r => r.sources.map((s, idx) => ({
      id: `ref-${idx}-${s.title}`,
      category: 'DOC_MENTION' as const,
      title: s.title,
      excerpt: s.snippet,
      owner: s.domain,
      type: 'reference' as const
    })))
  ].sort(() => -1); // Reverse array to show newest at top (if chronological from store)

  return (
    <div className="relative h-screen bg-[#050505] text-slate-200 overflow-hidden font-['Inter',sans-serif]">
      
      {/* --- GLOBAL MEETING HEADER --- */}
      <div className="absolute top-0 left-0 w-full px-10 py-5 flex items-center justify-between z-50 border-b border-white/5 bg-[#050505]/60 backdrop-blur-xl">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
            <div className={`w-2 h-2 rounded-full bg-emerald-400 ${isRecording ? 'animate-pulse' : ''}`} />
            <span className="text-xs font-bold tracking-widest uppercase">Live</span>
          </div>
          <div className="flex items-center gap-3 font-mono text-slate-300 bg-white/5 px-4 py-1.5 rounded-lg border border-white/10 shadow-inner">
            <Clock size={16} className="text-slate-500" />
            <span className="text-lg">{formatTime(elapsedTime)}</span>
            <span className="text-sm text-slate-600">/ 01:00:00</span>
          </div>
          <MicButton />
        </div>

        {/* Center Logo */}
        <div className="absolute left-1/2 -translate-x-1/2 flex flex-col items-center">
             <span className="text-xl font-semibold tracking-tight text-white">EchoLens</span>
        </div>

        {/* Agenda Progress Tracker */}
        <div className="flex items-center gap-4">
          {MEETING_AGENDA.map((item, idx) => (
            <div key={item.id} className={`flex items-center gap-3 ${item.status === 'active' ? 'text-white' : 'text-slate-600'}`}>
              {item.status === 'completed' ? <CheckCircle2 size={16} className="text-emerald-500" /> : 
               item.status === 'active' ? <PlayCircle size={16} className="text-blue-400" /> :
               <div className="w-2 h-2 rounded-full bg-slate-700 ml-1" />}
              <span className={`text-sm ${item.status === 'active' ? 'font-semibold tracking-wide' : ''}`}>{item.title}</span>
              {idx < MEETING_AGENDA.length - 1 && <div className="w-8 h-px bg-slate-800 ml-1" />}
            </div>
          ))}
          <Link
            href="/app/settings"
            className="rounded-lg border border-white/10 px-3 py-2 text-xs uppercase tracking-[0.18em] text-slate-300 transition-colors hover:border-white/20 hover:text-white"
          >
            Settings
          </Link>
        </div>
      </div>

      {/* --- THE AURA (z-0) & FROSTED GLASS SCREEN (z-1) --- */}
      <motion.div
        className="absolute inset-0 z-0 pointer-events-none mt-10 opacity-80"
        animate={{ opacity: hasContent ? 0.6 : 0.9 }}
        transition={{ duration: 1.5, ease: 'easeInOut' }}
      >
        <AuraHero />
      </motion.div>
      <div className="absolute inset-0 z-[1] pointer-events-none bg-gradient-to-b from-[#050505]/20 via-[#050505]/40 to-[#050505]/50 backdrop-blur-[40px]" />

      {/* --- MAIN UI GRID z-10 --- */}
      <div className="relative z-10 flex h-screen pt-28 pb-10 px-10 gap-8 max-w-[2000px] mx-auto">
        
        {/* Left Column: Context & Presenter Transcript (25%) */}
        <div className="w-[25%] flex flex-col gap-8 min-w-[300px]">
          {/* Meeting Context Card w/ Attendees */}
          <div className="bg-[#0a0a0a]/80 backdrop-blur-2xl border border-white/5 rounded-3xl p-8 shadow-2xl flex-shrink-0">
            <h2 className="text-xs font-bold tracking-[0.2em] text-slate-500 uppercase mb-6 flex items-center gap-2">
              <Presentation size={14} /> Session Details
            </h2>
            <div className="font-['Playfair_Display',serif]">
              <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">{viewer.workspaceName}</h1>
              <p className="text-xs text-slate-400 italic font-sans pr-2 break-all mt-2">{sessionId}</p>
            </div>
            
            <div className="mt-8 pt-6 border-t border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-slate-800 border border-slate-600 flex items-center justify-center font-bold text-white shadow-lg">
                  {viewer.userName.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <p className="text-xs text-slate-400 uppercase tracking-wider mb-0.5">Workspace Owner</p>
                  <p className="text-slate-200 font-medium text-sm">{viewer.userName}</p>
                  <p className="text-xs text-slate-500">{viewer.userEmail}</p>
                </div>
              </div>
              <div className="flex -space-x-3">
                {ATTENDEES.map(a => (
                  <div key={a.id} className={`w-9 h-9 rounded-full flex items-center justify-center text-[10px] font-bold border-2 border-[#050505] shadow-lg ${a.color}`}>
                    {a.initials}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Live Transcript */}
          <div className="flex-1 overflow-hidden relative flex flex-col justify-end pb-4">
            <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-b from-[#050505] via-[#050505]/50 to-transparent z-10 pointer-events-none" />
            
            <div className="flex flex-col gap-6 overflow-y-auto hide-scrollbar pr-4 relative pt-12">
              {transcriptChunks.map((msg, idx) => (
                <div 
                  key={msg.id} 
                  className={`flex flex-col items-start transition-opacity duration-1000 ${idx === transcriptChunks.length - 1 && !interimText ? 'opacity-100' : 'opacity-50'}`}
                >
                  <p className="text-lg leading-relaxed text-slate-300 font-light border-l-2 border-white/10 pl-5">
                    {msg.text}
                  </p>
                </div>
              ))}
              {interimText && (
                <div className="flex flex-col items-start opacity-100">
                  <p className="text-lg leading-relaxed text-slate-300 font-light border-l-2 border-blue-500/50 pl-5 italic">
                    {interimText}
                  </p>
                </div>
              )}
              <div ref={transcriptEndRef} />
              
              <div className={`flex items-center gap-3 text-slate-500 pl-5 mt-4 transition-opacity ${isRecording ? 'opacity-100 animate-pulse' : 'opacity-0'}`}>
                <Mic size={14} />
                <span className="text-[10px] font-semibold uppercase tracking-[0.2em]">
                  {isAnalyzing ? 'Synthesizing...' : 'Listening...'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Middle Column: Dynamic Presentation Canvas (50%) */}
        <div className="w-[50%] flex flex-col justify-center items-center relative px-8 border-x border-white/5">
          <AnimatePresence mode="wait">
            {activeChart ? (
               <motion.div 
                 key={activeChart.id}
                 initial={{ opacity: 0, y: 30, scale: 0.98 }}
                 animate={{ opacity: 1, y: 0, scale: 1 }}
                 exit={{ opacity: 0, scale: 0.98 }}
                 transition={{ duration: 0.6, ease: "easeOut" }}
                 className="w-full max-w-4xl"
               >
                 <div className="relative bg-[#050505]/60 backdrop-blur-3xl border border-white/10 rounded-[2.5rem] p-12 shadow-2xl overflow-hidden bg-blue-500/5">
                   <div className="relative z-10 mb-8 border-b border-white/10 pb-8 flex justify-between items-start">
                     <div>
                       <div className="flex items-center gap-4 mb-4">
                         <div className="p-3 rounded-2xl bg-white/5 backdrop-blur-md border border-white/10 text-blue-400">
                           <BarChart3 size={24} />
                         </div>
                       <span className="text-xs font-bold tracking-[0.2em] uppercase text-slate-400">
                           Visual Insight
                         </span>
                       </div>
                       <h1 className="font-['Playfair_Display',serif] text-4xl font-bold text-white tracking-tight">
                         {activeChart.chartSpec.title}
                       </h1>
                       {activeChart.narration && (
                         <p className="mt-4 text-slate-400 max-w-2xl">{activeChart.narration}</p>
                       )}
                     </div>
                   </div>
                   <div className="relative z-10 w-full flex items-center justify-center p-4 bg-white/5 rounded-2xl border border-white/10">
                      <StructuredChart
                        spec={activeChart.chartSpec}
                        narration={activeChart.narration}
                      />
                   </div>
                 </div>
               </motion.div>
            ) : activeContext ? (
               <motion.div 
                 key={activeContext.matches[0]?.id || 'ctx'}
                 initial={{ opacity: 0, y: 30, scale: 0.98 }}
                 animate={{ opacity: 1, y: 0, scale: 1 }}
                 exit={{ opacity: 0, scale: 0.98 }}
                 transition={{ duration: 0.6, ease: "easeOut" }}
                 className="w-full max-w-4xl max-h-[80vh] overflow-y-auto hide-scrollbar"
               >
                 <div className="relative bg-[#050505]/60 backdrop-blur-3xl border border-white/10 rounded-[2.5rem] p-12 shadow-2xl overflow-hidden bg-purple-500/5">
                   <div className="relative z-10 mb-8 border-b border-white/10 pb-8">
                     <div className="flex items-center gap-4 mb-4">
                       <div className="p-3 rounded-2xl bg-white/5 backdrop-blur-md border border-white/10 text-purple-400">
                         <FileText size={24} />
                       </div>
                       <span className="text-xs font-bold tracking-[0.2em] uppercase text-slate-400">
                         Related Context
                       </span>
                     </div>
                     <h1 className="font-['Playfair_Display',serif] text-4xl font-bold text-white tracking-tight">
                        Vault Retrieval
                     </h1>
                   </div>
                   <div className="relative z-10 space-y-4">
                      {activeContext.matches.map(m => (
                         <ContextCard key={m.id} match={m} matchType={activeContext.matchType} />
                      ))}
                   </div>
                 </div>
               </motion.div>
            ) : (
               <motion.div 
                 key="idle"
                 initial={{ opacity: 0 }}
                 animate={{ opacity: 1 }}
                 exit={{ opacity: 0 }}
                 className="flex flex-col items-center justify-center opacity-60 transition-opacity duration-1000"
               >
                 <div className="relative mb-8">
                   <div className="absolute inset-0 bg-blue-500/30 blur-3xl rounded-full opacity-40 animate-pulse" />
                   <Bot size={80} className="relative z-10 text-slate-400" />
                 </div>
                 <h2 className="font-['Playfair_Display',serif] text-4xl text-white text-center max-w-lg leading-tight mt-6" style={{ textShadow: '0 4px 12px rgba(0,0,0,0.5)' }}>
                   EchoLens is actively indexing the presentation.
                 </h2>
                 <p className="text-sm text-slate-400 mt-4">
                   {isRecording ? 'Listening for actionable insights...' : 'Start speaking to begin'}
                 </p>
               </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Right Column: Running Meeting Artifacts (25%) */}
        <div className="w-[25%] flex flex-col gap-6 pl-4 relative min-w-[300px]">
          <div className="flex items-center justify-between mb-2 mt-[6px]">
            <h2 className="text-xs font-bold tracking-[0.2em] text-slate-500 uppercase flex items-center gap-2">
              <List size={14} /> Captured Artifacts
            </h2>
            <div className="text-xs font-mono text-slate-500 bg-white/5 px-2 py-1 rounded">
              {artifacts.length} Items
            </div>
          </div>
          
          <div className="flex flex-col gap-4 overflow-y-auto hide-scrollbar pb-8 pr-2">
            {artifacts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center opacity-50 border border-dashed border-white/10 rounded-2xl mt-4">
                <CheckSquare size={24} className="text-slate-500 mb-3" />
                <p className="text-sm text-slate-400">Listening for action items,<br/>decisions, and references...</p>
              </div>
            ) : artifacts.map((art) => {
              const style = getCategoryStyles(art.category);
              const Icon = style.icon;
              return (
                <motion.div 
                  key={art.id} 
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="bg-[#0a0a0a]/80 backdrop-blur border border-white/5 rounded-2xl p-5 shadow-xl hover:bg-white/[0.04] transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <Icon size={16} className={style.color} />
                    <span className="text-[10px] font-bold tracking-widest text-slate-400 uppercase">
                      {art.category.replace('_', ' ')}
                    </span>
                  </div>
                  <p className="text-sm text-slate-200 font-medium leading-relaxed mb-3">
                    {art.title}
                  </p>
                  {art.type === 'bullet' && art.owner && (
                    <div className="flex items-center gap-3 text-xs text-slate-500">
                      <span className="flex items-center gap-1 bg-white/5 px-2 py-1 rounded"><Users size={12}/> {art.owner}</span>
                    </div>
                  )}
                  {art.type === 'reference' && art.excerpt && (
                    <p className="text-xs text-slate-500 line-clamp-3 italic">&ldquo;{art.excerpt}&rdquo;</p>
                  )}
                </motion.div>
              );
            })}
          </div>
        </div>

      </div>

      <style dangerouslySetInnerHTML={{__html: `
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}} />
    </div>
  );
}
