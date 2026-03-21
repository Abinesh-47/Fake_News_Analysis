import React, { useState, useEffect } from 'react';
import { 
  Shield, Database, BarChart3, Share2, FileText, 
  History, Lock, LogOut, ChevronRight, Globe, 
  Activity, ShieldCheck, ShieldAlert, Trash, Menu, X, Bot,
  TrendingUp, Users, Search
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Link } from 'react-router-dom';
import StatsCard from '../components/StatsCard';
import DiffusionChart from '../components/DiffusionChart';
import ModelComparison from '../components/ModelComparison';
import ChatInterface from '../components/ChatInterface';
import NewsUpload from '../components/NewsUpload';

interface Summary {
  totalNews: number;
  averageCredibility: number;
  activeUsers: number;
  dataProcessed: string;
}

interface AnalysisResult {
  id?: number;
  news_title?: string;
  label: 'REAL' | 'FAKE';
  confidence: number;
  context: string;
  spreaders: string[];
  location: string;
  technicalMetadata: {
    propagationPattern: string;
    botActivity: string;
    sourceReliability: string;
  };
  sources: { title: string; url: string }[];
  model_results?: any[];
  source_links?: { original?: string, others?: string[] };
  diffusion_data?: any[];
}

export default function Dashboard({ user, onLogout }: { user: { email: string } | null, onLogout: () => void }) {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [latestAnalysis, setLatestAnalysis] = useState<AnalysisResult | null>(null);
  const [allNews, setAllNews] = useState<any[]>([]);
  const [selectedDiffusionId, setSelectedDiffusionId] = useState<number | null>(null);

  // Scroll to top on tab change
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [activeTab]);

  useEffect(() => {
    const fetchData = () => {
      const token = localStorage.getItem('token');
      
      // Summary is always available? Or just for logged in? 
      // User says "Guest ... no DB usage". Summary uses DB.
      // So if guest, maybe show mock numbers or zero.
      if (user && token) {
        fetch('/api/analytics/summary', {
          headers: { 'Authorization': `Bearer ${token}` }
        })
          .then(res => res.json())
          .then(setSummary)
          .catch(err => console.error('Summary fetch error:', err));
        
        fetch('/api/reports', {
          headers: { 'Authorization': `Bearer ${token}` }
        })
          .then(res => res.json())
          .then(data => {
            if (Array.isArray(data)) {
              setAllNews(data);
            } else {
              setAllNews([]);
            }
          })
          .catch(err => {
            console.error('Reports fetch error:', err);
            setAllNews([]);
          });
      } else {
        try {
          setSummary(null);
          const raw = localStorage.getItem('guestReports');
          const guestData = raw ? JSON.parse(raw) : [];
          setAllNews(guestData);
          setLatestAnalysis(null);
        } catch (err) {
          console.error('Guest data parse error:', err);
          setAllNews([]);
        }
      }
    };

    fetchData();

    // Guest cleanup on refresh
    const handleUnload = () => {
      if (!localStorage.getItem('user')) {
        localStorage.removeItem('guestReports');
      }
    };

    window.addEventListener('beforeunload', handleUnload);
    return () => window.removeEventListener('beforeunload', handleUnload);
  }, [user]);

  const handleAnalysisComplete = (result: AnalysisResult) => {
    setLatestAnalysis(result);
    setActiveTab('dossier');
    // Refresh archive
    if (user) {
      const token = localStorage.getItem('token');
      fetch('/api/reports', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data)) {
            setAllNews(data);
          }
        });
    } else {
      const guestData = JSON.parse(localStorage.getItem('guestReports') || '[]');
      setAllNews(guestData);
    }
  };

  const handleDeleteReport = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this intelligence report?')) {
      try {
        if (user) {
          const token = localStorage.getItem('token');
          await fetch(`/api/report/${id}`, { 
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
          });
          setAllNews(allNews.filter(n => n.id !== id));
        } else {
          const guestData = JSON.parse(localStorage.getItem('guestReports') || '[]');
          const updated = guestData.filter((n: any) => n.id !== id);
          localStorage.setItem('guestReports', JSON.stringify(updated));
          setAllNews(updated);
        }

        if (latestAnalysis && (latestAnalysis as any).id === id) {
          setLatestAnalysis(null);
          setActiveTab('overview');
        }
      } catch (err) {
        console.error('Failed to delete report', err);
      }
    }
  };

  if (!allNews && !summary) return <div className="h-screen flex items-center justify-center bg-[#020617] text-blue-500 font-black tracking-[0.5em] uppercase animate-pulse">Initializing Neural Link...</div>;

  return (
    <div className="min-h-screen flex bg-[#020617] text-slate-200">
      {/* Sidebar Overlay for Mobile */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-sm"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside 
        className={`w-64 bg-[#0F172A] border-r border-white/5 flex flex-col fixed inset-y-0 left-0 z-50 transform transition-transform duration-300 lg:translate-x-0 lg:static ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
            <div className="p-8 flex items-center gap-3 border-b border-white/5">
              <div className="logo-container flex items-center gap-2">
                <img src="/logo.png" alt="Sentinel Logo" className="w-8 h-8 rounded-lg shadow-[0_0_15px_rgba(59,130,246,0.5)]" />
                <span className="text-white font-display font-bold tracking-tight text-sm">NEWS DETECTION</span>
              </div>
            </div>

            <nav className="flex-1 px-6 py-8 space-y-4">
              <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500 font-bold mb-4">Intelligence</p>
              <NavItem 
                icon={<Database size={18} />} 
                label="Overview" 
                active={activeTab === 'overview'} 
                onClick={() => setActiveTab('overview')} 
              />
              <NavItem 
                icon={<BarChart3 size={18} />} 
                label="Data Archive" 
                active={activeTab === 'archive'} 
                onClick={() => setActiveTab('archive')} 
              />
              <NavItem 
                icon={<Share2 size={18} />} 
                label="Diffusion" 
                active={activeTab === 'diffusion'} 
                onClick={() => setActiveTab('diffusion')} 
              />
              <NavItem 
                icon={<FileText size={18} />} 
                label="Intelligence Dossier" 
                active={activeTab === 'dossier'} 
                onClick={() => setActiveTab('dossier')} 
                disabled={!latestAnalysis}
              />
              
            </nav>

            <div className="p-8 border-t border-white/5">
              {user ? (
                <div className="flex items-center gap-3 group">
                  <div className="w-10 h-10 rounded-xl bg-blue-600/10 border border-blue-500/30 flex items-center justify-center text-xs font-bold text-blue-400">
                    {user.email[0].toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-white truncate uppercase tracking-wider">{user.email.split('@')[0]}</p>
                    <button 
                      onClick={onLogout}
                      className="text-[10px] text-slate-500 uppercase tracking-tighter hover:text-red-400 transition-colors flex items-center gap-1"
                    >
                      <LogOut size={10} /> Disconnect
                    </button>
                  </div>
                </div>
              ) : (
                <Link 
                  to="/login"
                  className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-[10px] font-bold uppercase tracking-[0.2em] transition-all shadow-2xl shadow-blue-500/10"
                >
                  <Lock size={16} /> Authenticate
                </Link>
              )}
            </div>
          </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto min-w-0">
        <header className="sticky top-0 z-40 bg-[#020617]/80 backdrop-blur-xl border-b border-white/5 px-4 sm:px-6 lg:px-8 py-4 lg:py-6 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 hover:bg-white/5 rounded-lg transition-colors text-blue-400 lg:hidden"
            >
              <Menu size={20} />
            </button>
            <div>
              <h2 className="text-xl font-display font-extrabold text-white tracking-tight uppercase">
                {activeTab === 'overview' ? 'Sovereign Overview' : activeTab.toUpperCase()}
              </h2>
              <p className="text-slate-500 text-[10px] uppercase tracking-[0.2em] font-medium">Imperial Truth Engine v4.0</p>
            </div>
          </div>
          <div className="flex items-center gap-8">
            <div className="relative hidden md:block">
              <Activity className="absolute left-0 top-1/2 -translate-y-1/2 text-slate-600 w-4 h-4" />
              <input 
                type="text" 
                placeholder="QUERY ARCHIVES..." 
                className="pl-8 pr-4 py-2 bg-transparent border-b border-white/10 text-[10px] tracking-[0.2em] focus:border-blue-500 outline-none w-48 transition-all placeholder:text-slate-700"
              />
            </div>
            {!user && (
              <Link 
                to="/login" 
                className="px-6 py-2 bg-blue-500/5 border border-blue-500/20 rounded-full text-[10px] font-bold text-blue-400 uppercase tracking-[0.2em] hover:bg-blue-500/10 hover:border-blue-500/50 hover:shadow-[0_0_20px_rgba(59,130,246,0.1)] transition-all"
              >
                LOGIN
              </Link>
            )}
          </div>
        </header>

        <div className="p-4 sm:p-6 lg:p-12 max-w-7xl mx-auto w-full">
          {activeTab === 'overview' && (
            <div className="space-y-8 lg:space-y-12">
              <ChatInterface onAnalysisComplete={handleAnalysisComplete} />
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatsCard 
                  title="Verified Records" 
                  value={summary?.totalNews || 0} 
                  icon={<Database className="text-blue-400" />} 
                  trend={summary?.trend || "STABLE"}
                />
                <StatsCard 
                  title="Integrity Index" 
                  value={(Number(summary?.averageCredibility || 0) * 100).toFixed(1) + '%'} 
                  icon={<ShieldAlert className="text-emerald-500" />} 
                  trend="VERIFIED"
                />
                <StatsCard 
                  title="Active Sentinels" 
                  value={summary?.activeUsers || 0} 
                  icon={<Users className="text-indigo-400" />} 
                  trend="LIVE"
                />
                <StatsCard 
                  title="Data Volume" 
                  value={summary?.dataProcessed || '0.00 MB'} 
                  icon={<TrendingUp className="text-amber-500" />} 
                  trend="SYNCHRONIZED"
                />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-16">
                <div className="lg:col-span-2 space-y-8 lg:space-y-16">
                  {latestAnalysis && (
                    <section>
                      <div className="flex items-center justify-between mb-8">
                        <h3 className="text-[10px] uppercase tracking-[0.4em] text-slate-500 font-bold">Latest Intelligence</h3>
                        <button 
                          onClick={() => setActiveTab('dossier')}
                          className="text-[9px] font-bold text-blue-400 uppercase tracking-widest hover:underline"
                        >
                          View Full Dossier
                        </button>
                      </div>
                      <div className={`royal-card p-6 lg:p-8 border-l-4 ${
                        latestAnalysis.label === 'REAL' ? 'border-l-emerald-500' : 'border-l-red-500'
                      }`}>
                        <div className="flex items-center justify-between mb-4">
                          <span className={`text-[10px] font-bold uppercase tracking-widest ${
                            latestAnalysis.label === 'REAL' ? 'text-emerald-500' : 'text-red-500'
                          }`}>
                            {latestAnalysis.label} VERDICT
                          </span>
                          <span className="text-[9px] text-slate-500 uppercase tracking-widest">Confidence: {latestAnalysis.confidence.toFixed(1)}%</span>
                        </div>
                        <p className="text-xs text-slate-300 line-clamp-2 mb-4">{latestAnalysis.context}</p>
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-1 text-[9px] text-slate-500 uppercase tracking-widest">
                            <Globe size={10} /> {latestAnalysis.location}
                          </div>
                          <div className="flex items-center gap-1 text-[9px] text-slate-500 uppercase tracking-widest">
                            <Users size={10} /> {latestAnalysis?.spreaders?.length || 0} Spreaders
                          </div>
                        </div>
                      </div>
                    </section>
                  )}

                    <section>
                      <div className="flex items-center gap-4 mb-8">
                        <h3 className="text-[10px] uppercase tracking-[0.4em] text-slate-500 font-bold">Diffusion Chronology</h3>
                        <div className="h-px flex-1 bg-white/5"></div>
                      </div>
                      <div className="royal-card p-6 lg:p-8 overflow-x-auto min-h-[300px] flex flex-col justify-center">
                        <DiffusionChart data={latestAnalysis?.diffusion_data || []} />
                      </div>
                    </section>
                    
                    <section>
                      <div className="flex items-center gap-4 mb-8">
                        <h3 className="text-[10px] uppercase tracking-[0.4em] text-slate-500 font-bold">Algorithmic Prowess</h3>
                        <div className="h-px flex-1 bg-white/5"></div>
                      </div>
                      <div className="royal-card p-6 lg:p-8 overflow-x-auto min-h-[250px] flex flex-col justify-center">
                        <ModelComparison models={latestAnalysis?.model_results || []} />
                      </div>
                    </section>
                </div>
                
                <div className="space-y-8 lg:space-y-16">
                  <section>
                    <h3 className="text-[10px] uppercase tracking-[0.4em] text-slate-500 font-bold mb-8">Operational Hierarchy</h3>
                    <div className="space-y-8 border-l border-white/5 pl-8">
                      <ArchStep number="01" title="Ingestion" desc="Distributed HDFS Cluster" />
                      <ArchStep number="02" title="Refinement" desc="MLlib NLP Pipeline" />
                      <ArchStep number="03" title="Judgment" desc="Ensemble Classification" />
                      <ArchStep number="04" title="Revelation" desc="Graph Diffusion Mapping" />
                    </div>
                  </section>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'archive' && (
            <div className="space-y-8 lg:space-y-12 perspective-1000">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
                <div>
                  <h3 className="text-2xl font-display font-extrabold text-white uppercase tracking-tight">Intelligence Archive</h3>
                  <p className="text-slate-500 text-[10px] uppercase tracking-[0.2em] mt-2">3D Backend Data Visualization</p>
                </div>
                {allNews.length > 0 && user && (
                  <button 
                    onClick={async () => {
                      if (window.confirm('Wipe all intelligence records from the mainframe?')) {
                        const token = localStorage.getItem('token');
                        await fetch('/api/reports', { 
                          method: 'DELETE',
                          headers: { 'Authorization': `Bearer ${token}` }
                        });
                        setAllNews([]);
                      }
                    }}
                    className="px-6 py-2 bg-red-500/10 border border-red-500/20 rounded-full text-[10px] font-bold text-red-500 uppercase tracking-[0.2em] hover:bg-red-500/20 transition-all"
                  >
                    Wipe Archive
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {allNews.length === 0 ? (
                  <div className="col-span-full royal-card p-12 lg:p-24 flex flex-col items-center justify-center text-center opacity-40">
                    <History size={48} className="text-slate-500 mb-6" />
                    <h4 className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-2">Archive Vacant</h4>
                    <p className="text-[10px] text-slate-600 uppercase tracking-widest">No Intelligence reports found in this classification.</p>
                  </div>
                ) : (
                  (allNews || []).map((item, i) => (
                    <motion.div
                      key={item?.id || i}
                      initial={{ opacity: 0, rotateY: -20, translateZ: -100 }}
                      animate={{ opacity: 1, rotateY: 0, translateZ: 0 }}
                      transition={{ delay: i * 0.1, duration: 0.8 }}
                      whileHover={{ 
                        scale: 1.05, 
                        rotateX: 5, 
                        rotateY: -5,
                        boxShadow: "0 20px 40px rgba(59, 130, 246, 0.2)"
                      }}
                      className="royal-card p-6 lg:p-8 cursor-pointer group relative overflow-hidden preserve-3d"
                      onClick={() => {
                        const analysis = item.result || item;
                        setLatestAnalysis({
                          label: analysis.label as 'REAL' | 'FAKE',
                          confidence: analysis.confidence || item.credibility_score,
                          context: analysis.context || item.text || item.inputText,
                          spreaders: analysis.spreaders || ["@archive_node", "@historical_seq"],
                          location: analysis.location || 'Archived Region',
                          technicalMetadata: analysis.technicalMetadata || {
                            propagationPattern: 'Historical Diffusion',
                            botActivity: 'Low',
                            sourceReliability: 'High'
                          },
                          sources: analysis.sources || [],
                          model_results: analysis.model_results || [
                            { algorithm: 'BERT', accuracy: '94.2', precision: '93.5', recall: '94.0', f1: '93.7', status: 'ARCHIVED' },
                            { algorithm: 'IMPERIAL', accuracy: '97.8', precision: '97.0', recall: '98.0', f1: '97.5', status: 'ARCHIVED' }
                          ],
                          diffusion_data: analysis.diffusion_data || [
                            { time: "0h", reach: 100, depth: 1, velocity: 5 },
                            { time: "12h", reach: 1500, depth: 8, velocity: 40 },
                            { time: "24h", reach: 4500, depth: 15, velocity: 120 }
                          ],
                          source_links: analysis.source_links || { original: null, others: [] }
                        });
                        setActiveTab('dossier');
                      }}
                    >
                      <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-30 transition-opacity">
                        <Database size={64} />
                      </div>
                      
                      <div className="relative z-10">
                        <div className="flex items-center justify-between mb-6">
                          <span className={`text-[8px] font-bold uppercase tracking-[0.3em] px-2 py-1 rounded border ${
                            (item.result?.label || item.label) === 'REAL' ? 'border-emerald-500/30 text-emerald-500 bg-emerald-500/5' : 'border-red-500/30 text-red-500 bg-red-500/5'
                          }`}>
                            {item.result?.label || item.label}
                          </span>
                          <span className="text-[8px] text-slate-500 font-mono">{new Date(item.createdAt || item.timestamp).toLocaleDateString()}</span>
                        </div>

                        <h4 className="text-[10px] font-bold text-white uppercase tracking-wider line-clamp-2 mb-4 group-hover:text-blue-400 transition-colors">
                          {item.inputText || item.text}
                        </h4>

                        <div className="space-y-3 pt-4 border-t border-white/5">
                          <div className="flex justify-between items-center">
                            <span className="text-[8px] text-slate-500 uppercase tracking-widest">Location</span>
                            <span className="text-[8px] text-blue-400 font-bold uppercase">{item.result?.location || item.location || 'GLOBAL'}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-[8px] text-slate-500 uppercase tracking-widest">Bot Activity</span>
                            <span className="text-[8px] text-slate-300 font-bold uppercase">{item.result?.technicalMetadata?.botActivity || item.technicalMetadata?.botActivity || 'LOW'}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-[8px] text-slate-500 uppercase tracking-widest">Confidence</span>
                            <span className="text-[8px] text-slate-300 font-bold uppercase">{(item.result?.confidence || item.credibility_score || 0).toFixed(1)}%</span>
                          </div>
                          <div className="pt-4 flex justify-end">
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteReport(item.id);
                              }}
                              className="p-2 text-slate-500 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                            >
                              <Trash size={14} />
                            </button>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
            </div>
          )}

          {activeTab === 'models' && (
            <div className="royal-card p-6 lg:p-12 overflow-x-auto">
               <h3 className="text-xl font-display font-extrabold text-white mb-12 uppercase tracking-tight">Algorithmic Benchmarks</h3>
               <ModelComparison showDetails />
            </div>
          )}

          {activeTab === 'diffusion' && (
            <div className="space-y-8 lg:space-y-12">
               <div className="royal-card p-6 lg:p-12 flex flex-col md:flex-row md:items-center justify-between gap-6">
                 <div>
                   <h3 className="text-xl font-display font-extrabold text-white uppercase tracking-tight">Global Diffusion & Veracity</h3>
                   <p className="text-slate-500 text-[10px] uppercase tracking-[0.2em] mt-2">Select a case archive to query deep metrics</p>
                 </div>
                 <select 
                   value={selectedDiffusionId || ''} 
                   onChange={(e) => setSelectedDiffusionId(Number(e.target.value))}
                   className="bg-[#0F172A] border border-white/10 text-white text-xs font-bold uppercase tracking-widest rounded-xl px-4 py-3 outline-none focus:border-blue-500 w-full md:w-auto"
                 >
                   <option value="" disabled>Select Intelligence Report...</option>
                    {(allNews || []).map(news => (
                      <option key={news?.id} value={news?.id}>{(news?.result?.context || news?.inputText || 'Classified').substring(0, 30)} - {news?.createdAt ? new Date(news.createdAt).toLocaleDateString() : 'N/A'}</option>
                    ))}
                 </select>
               </div>

               {selectedDiffusionId && allNews.find(n => n.id === selectedDiffusionId) ? (() => {
                 const selected = allNews.find(n => n.id === selectedDiffusionId);
                 return (
                   <div className="space-y-8 lg:space-y-12">
                     <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-12">
                       <div className="royal-card p-6 lg:p-12 overflow-x-auto">
                          <h4 className="text-[10px] uppercase tracking-[0.4em] text-slate-500 font-bold mb-8">Propagation Dynamics</h4>
                          <DiffusionChart data={selected.result?.diffusion_data || []} height={350} />
                       </div>
                       <div className="royal-card p-6 lg:p-12 flex flex-col justify-between">
                          <div>
                            <div className="flex items-center justify-between mb-8">
                              <h4 className="text-[10px] uppercase tracking-[0.4em] text-slate-500 font-bold">Consensus Verdict</h4>
                              <span className={`px-4 py-1 text-[10px] font-bold tracking-[0.2em] rounded border ${selected?.result?.label === 'REAL' ? 'border-emerald-500/30 text-emerald-500 bg-emerald-500/5' : 'border-red-500/30 text-red-500 bg-red-500/5'}`}>
                                {selected?.result?.label || 'UNCERTAIN'}
                              </span>
                            </div>
                            <div className="mb-12">
                              <span className="text-4xl font-display font-black text-white">{selected?.result?.confidence?.toFixed(1) || '0.0'}%</span>
                              <span className="text-[10px] text-slate-500 uppercase tracking-widest ml-4">Algorithmic Confidence</span>
                            </div>
                          </div>
                          <div>
                            <h4 className="text-[10px] uppercase tracking-[0.4em] text-slate-500 font-bold mb-6">Model Validation</h4>
                            <ModelComparison models={selected.result?.model_results || []} showDetails={false} />
                          </div>
                       </div>
                     </div>

                     <div className="royal-card p-6 lg:p-12">
                        <h4 className="text-[10px] uppercase tracking-[0.4em] text-slate-500 font-bold mb-8">Origin Identification</h4>
                        {(!selected?.result?.source_links?.original && (!selected?.result?.source_links?.others || (selected.result?.source_links.others?.length || 0) === 0)) ? (
                          <div className="p-8 bg-slate-800/50 border border-white/5 rounded-xl text-center">
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">No trusted sources found for this news.</p>
                          </div>
                        ) : (
                          <div className="flex flex-col gap-6">
                            {selected.result?.source_links?.original && (
                              <a href={selected.result.source_links.original} target="_blank" rel="noopener noreferrer" className="p-6 bg-emerald-500/5 border border-emerald-500/20 rounded-xl flex items-center justify-between hover:bg-emerald-500/10 transition-colors group">
                                <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest">Primary Source</span>
                                <span className="text-xs font-mono text-emerald-400 truncate max-w-xl group-hover:text-emerald-300 transition-colors">{selected.result.source_links.original}</span>
                              </a>
                            )}
                             {(selected?.result?.source_links?.others?.length || 0) > 0 && (
                               <div className="p-6 border border-white/5 rounded-xl">
                                 <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-4 block">Secondary Sources</span>
                                 <div className="space-y-2">
                                   {(selected?.result?.source_links?.others || []).map((url: string, idx: number) => (
                                     <a key={idx} href={url} target="_blank" rel="noopener noreferrer" className="block text-xs font-mono text-blue-400 hover:text-blue-300 truncate">
                                       • {url}
                                     </a>
                                   ))}
                                 </div>
                               </div>
                             )}
                          </div>
                        )}
                     </div>
                   </div>
                 );
               })() : (
                 <div className="royal-card p-12 lg:p-24 flex flex-col items-center justify-center text-center">
                   <Share2 size={48} className="text-slate-700 mb-6" />
                   <h4 className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-2">No Archive Selected</h4>
                   <p className="text-[10px] text-slate-600 uppercase tracking-widest">Select an intelligence report from the dropdown above to view diffusion metrics.</p>
                 </div>
               )}
            </div>
          )}

          {activeTab === 'dossier' && latestAnalysis && (
            <div className="space-y-8 lg:space-y-12">
              <div className="royal-card p-6 lg:p-12">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 lg:mb-12">
                  <div>
                    <h3 className="text-2xl font-display font-extrabold text-white uppercase tracking-tight">Intelligence Dossier</h3>
                    <p className="text-slate-500 text-[10px] uppercase tracking-[0.2em] mt-2">Comprehensive Truth Verification Report</p>
                  </div>
                  <div className={`px-6 py-3 border rounded-xl flex items-center gap-3 ${
                    latestAnalysis.label === 'REAL' ? 'border-emerald-500/30 bg-emerald-500/5 text-emerald-500' : 'border-red-500/30 bg-red-500/5 text-red-500'
                  }`}>
                    {latestAnalysis.label === 'REAL' ? <ShieldCheck size={20} /> : <ShieldAlert size={20} />}
                    <span className="text-sm font-bold uppercase tracking-[0.3em]">{latestAnalysis.label} VERDICT</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
                  <div className="space-y-8 lg:space-y-12">
                    <section>
                       <h4 className="text-[10px] uppercase tracking-[0.4em] text-slate-500 font-bold mb-6">Contextual Analysis</h4>
                       <p className="text-sm text-slate-300 leading-relaxed bg-white/5 p-6 rounded-xl border border-white/5">
                         {latestAnalysis?.context || latestAnalysis?.data || 'Consolidating intelligence...'}
                       </p>
                     </section>

                     <section>
                       <h4 className="text-[10px] uppercase tracking-[0.4em] text-slate-500 font-bold mb-6">Geographic Propagation</h4>
                       <div className="flex items-center gap-4 bg-white/5 p-6 rounded-xl border border-white/5">
                         <Globe className="text-blue-400" size={24} />
                         <div>
                           <p className="text-xs font-bold text-white uppercase tracking-widest">{latestAnalysis?.location || 'Global Propagation'}</p>
                           <p className="text-[10px] text-slate-500 uppercase tracking-widest mt-1">Primary Origin/Trend Region</p>
                         </div>
                       </div>
                     </section>
                  </div>

                  <div className="space-y-8 lg:space-y-12">
                    <section>
                       <h4 className="text-[10px] uppercase tracking-[0.4em] text-slate-500 font-bold mb-6">Technical Backend (Propagation)</h4>
                       <div className="grid grid-cols-1 gap-4">
                         <BackendMetric label="Target Outlet" value={latestAnalysis?.technicalMetadata?.publication || 'Multi-Source Signal'} />
                         <BackendMetric label="Bot Activity Level" value={latestAnalysis?.technicalMetadata?.botActivity || 'Low (Organic)'} />
                          <BackendMetric label="Source Reliability" value={latestAnalysis?.technicalMetadata?.sourceReliability || 'Verified'} />
                       </div>
                     </section>

                    <section>
                       <h4 className="text-[10px] uppercase tracking-[0.4em] text-slate-500 font-bold mb-6">Identified Spreaders</h4>
                       <div className="flex flex-wrap gap-3">
                         {(latestAnalysis?.spreaders || []).map((spreader: string, i: number) => (
                           <a 
                             key={i} 
                             href={`https://x.com/search?q=${encodeURIComponent(spreader)}`}
                             target="_blank"
                             rel="noopener noreferrer"
                             className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg flex items-center gap-2 hover:border-blue-500/50 hover:bg-blue-500/5 transition-all group"
                           >
                             <Users size={12} className="text-blue-400 group-hover:scale-110 transition-transform" />
                             <span className="text-[10px] text-slate-300 font-bold uppercase tracking-widest group-hover:text-blue-400 transition-colors">{spreader}</span>
                           </a>
                         ))}
                       </div>
                     </section>
                  </div>
                </div>
              </div>

              <div className="space-y-8 lg:space-y-12">
                <div className="royal-card p-6 lg:p-12 overflow-x-auto">
                  <h4 className="text-[10px] uppercase tracking-[0.4em] text-slate-500 font-bold mb-8">Algorithmic Benchmarks</h4>
                  <ModelComparison models={latestAnalysis?.model_results || []} showDetails />
                </div>

                <div className="royal-card p-6 lg:p-12 overflow-x-auto">
                  <h4 className="text-[10px] uppercase tracking-[0.4em] text-slate-500 font-bold mb-8">Propagation Timeline</h4>
                  <DiffusionChart data={latestAnalysis?.diffusion_data || []} height={400} />
                </div>

                <div className="royal-card p-6 lg:p-12">
                  <h4 className="text-[10px] uppercase tracking-[0.4em] text-slate-500 font-bold mb-8">Verified Sources Archive</h4>
                  {(!latestAnalysis?.source_links?.original && (!latestAnalysis?.source_links?.others || (latestAnalysis.source_links.others?.length || 0) === 0)) ? (
                    <div className="p-12 bg-slate-900/50 border border-white/5 rounded-2xl text-center">
                      <FileText size={40} className="mx-auto text-slate-800 mb-6" />
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">No reliable sources found</p>
                      <p className="text-[9px] text-slate-600 uppercase tracking-widest">This news could not be correlated with a trusted news outlet.</p>
                    </div>
                  ) : (
                    <div className="space-y-10">
                      {latestAnalysis.source_links?.original && (
                        <div className="space-y-4">
                          <div className="flex items-center gap-3">
                            <ShieldCheck size={14} className="text-emerald-500" />
                            <h5 className="text-[9px] text-emerald-500 font-bold uppercase tracking-[0.2em]">Original Verified Source</h5>
                          </div>
                          <a href={latestAnalysis.source_links.original} target="_blank" rel="noopener noreferrer" className="block p-6 bg-emerald-500/5 border border-emerald-500/20 rounded-2xl hover:border-emerald-500/50 hover:bg-emerald-500/10 transition-all group relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                              <Share2 size={64} />
                            </div>
                            <div className="flex items-center justify-between relative z-10">
                              <p className="text-xs font-bold text-emerald-400 uppercase tracking-wider truncate max-w-2xl">{latestAnalysis.source_links.original}</p>
                              <div className="px-3 py-1 bg-emerald-500/20 rounded text-[8px] font-bold text-emerald-400 border border-emerald-500/30">VISIT SOURCE</div>
                            </div>
                          </a>
                        </div>
                      )}
                      
                       {(latestAnalysis?.source_links?.others?.length || 0) > 0 && (
                         <div className="space-y-4">
                           <div className="flex items-center gap-3">
                             <Database size={14} className="text-blue-500" />
                             <h5 className="text-[9px] text-blue-400 font-bold uppercase tracking-[0.2em]">Supporting Sources ({latestAnalysis.source_links?.others?.length})</h5>
                           </div>
                           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                             {(latestAnalysis?.source_links?.others || []).map((url: string, i: number) => (
                               <a href={url} key={i} target="_blank" rel="noopener noreferrer" className="block p-5 bg-white/5 border border-white/5 rounded-xl hover:border-blue-500/30 hover:bg-blue-500/5 transition-all group">
                                 <div className="flex items-center justify-between">
                                   <p className="text-[10px] text-slate-400 font-mono truncate max-w-xs">{url}</p>
                                   <Globe size={12} className="text-slate-600 group-hover:text-blue-400 transition-colors ml-4 shrink-0" />
                                 </div>
                               </a>
                             ))}
                           </div>
                         </div>
                       )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

        </div>
      </main>
    </div>
  );
}

function NavItem({ icon, label, active, onClick, disabled }: { icon: React.ReactNode, label: string, active?: boolean, onClick: () => void, disabled?: boolean }) {
  return (
    <button 
      onClick={onClick}
      disabled={disabled}
      className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-300 text-[10px] uppercase tracking-[0.2em] font-bold ${
        active 
          ? 'bg-blue-600/10 text-blue-400 border border-blue-500/20 shadow-2xl shadow-blue-500/5' 
          : disabled 
            ? 'text-slate-700 cursor-not-allowed' 
            : 'text-slate-500 hover:text-white hover:bg-white/5'
      }`}
    >
      {icon}
      {label}
    </button>
  );
}

function ArchStep({ number, title, desc }: { number: string, title: string, desc: string }) {
  return (
    <div className="relative">
      <div className="absolute -left-[37px] top-1 w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_10px_#3b82f6]"></div>
      <div className="flex gap-4">
        <span className="text-blue-500 font-display font-bold text-xs w-6">{number}</span>
        <div>
          <h4 className="text-[10px] uppercase tracking-[0.2em] font-bold text-white/80">{title}</h4>
          <p className="text-[10px] text-slate-500 tracking-wider mt-1">{desc}</p>
        </div>
      </div>
    </div>
  );
}

function BackendMetric({ label, value }: { label: string, value: string }) {
  return (
    <div className="p-4 bg-white/5 border border-white/5 rounded-xl flex items-center justify-between group hover:border-blue-500/30 transition-all">
      <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">{label}</span>
      <span className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">{value}</span>
    </div>
  );
}
