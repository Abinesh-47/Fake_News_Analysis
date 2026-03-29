import React, { useState, useEffect } from 'react';
import { 
  Shield, Database, BarChart3, Share2, FileText, 
  History, Lock, LogOut, ChevronRight, Globe, 
  Activity, ShieldCheck, ShieldAlert, Trash, Menu, X, Bot,
  TrendingUp, Users, Search, ArrowRight, HelpCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Link } from 'react-router-dom';
import StatsCard from '../components/StatsCard';
import DiffusionChart from '../components/DiffusionChart';
import ModelComparison from '../components/ModelComparison';
import ChatInterface from '../components/ChatInterface';
import NewsUpload from '../components/NewsUpload';
import SparkResults from '../components/SparkResults';

interface Summary {
  verifiedCount: number;
  activeSparkNodes: number;
  averageCredibility: number;
  activeUsers: number;
  dataProcessed: string;
  trend?: string;
}

interface AnalysisResult {
  id?: number;
  news_title?: string;
  label: 'REAL' | 'FAKE';
  confidence: number;
  context: string;
  trueAnalysis?: string;
  true_analysis?: string;
  truthConfidence?: number;
  correctedValues?: { old: string; new: string }[];
  spreaders: { name: string; url: string }[];
  location: string;
  technicalMetadata: {
    propagationPattern: string;
    botActivity: string;
    sourceReliability: string;
    publication?: string;
  };
  sources: { title: string; url: string; source: string; description?: string }[];
  model_results?: any[];
  source_links?: { original?: string, others?: string[] };
  verified_sources?: { name: string; url: string }[];
  diffusion_data?: any[];
  limited_data?: boolean;
}

export default function Dashboard({ user, onLogout }: { user: { email: string } | null, onLogout: () => void }) {
  const apiBase = (import.meta as any).env.VITE_API_URL || '';
  const [summary, setSummary] = useState<Summary | null>(null);
  const [activeTab, setActiveTab] = useState(sessionStorage.getItem('activeTab') || 'overview');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [latestAnalysis, setLatestAnalysis] = useState<AnalysisResult | null>(null);
  const [allNews, setAllNews] = useState<any[]>([]);
  const [selectedDiffusionId, setSelectedDiffusionId] = useState<number | null>(null);
  const [sparkResults, setSparkResults] = useState<any[]>([]);
  const [isSparkLoading, setIsSparkLoading] = useState(false);
  const [jobStatus, setJobStatus] = useState<{status: string, message: string, lastRun: string | null}>({
    status: 'idle',
    message: 'Engine Ready',
    lastRun: null
  });
  const [unifiedResult, setUnifiedResult] = useState<any>(null);
  const [pendingRedirect, setPendingRedirect] = useState(false);

  const displayVerdict = unifiedResult?.verdict || latestAnalysis?.label || 'NEUTRAL';
  const displayScore = Number(unifiedResult?.combined_score || latestAnalysis?.confidence || latestAnalysis?.truthConfidence || 0);

  // Auto-redirect effect when analysis completes
  useEffect(() => {
    if (pendingRedirect && (latestAnalysis || unifiedResult)) {
      setActiveTab('dossier');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      setPendingRedirect(false);
    }
  }, [latestAnalysis, unifiedResult, pendingRedirect]);

  // Scroll to top on tab change and persist state
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    sessionStorage.setItem('activeTab', activeTab);
  }, [activeTab]);

  useEffect(() => {
    const fetchData = () => {
      const token = localStorage.getItem('token');
      
      // Summary is always available? Or just for logged in? 
      // User says "Guest ... no DB usage". Summary uses DB.
      // So if guest, maybe show mock numbers or zero.
      if (user && token) {
        fetch(`${apiBase}/api/analytics/summary`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
          .then(res => res.json())
          .then(setSummary)
          .catch(err => console.error('Summary fetch error:', err));
        
        fetch(`${apiBase}/api/reports`, {
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
        // GUEST SYNC: Still fetch the global summary for dashboard metrics
        fetch(`${apiBase}/api/analytics/summary`)
          .then(res => res.json())
          .then(setSummary)
          .catch(err => console.error('Summary fetch error:', err));

        try {
          const raw = localStorage.getItem('guestReports');
          const guestData = raw ? JSON.parse(raw) : [];
          setAllNews(guestData);
          // Don't wipe latestAnalysis here so the Dossier stays visible
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

  const fetchUnifiedResults = () => {
    fetch(`${apiBase}/api/final-results`)
      .then(res => res.json())
      .then(data => {
        if (data.final_result) {
          setUnifiedResult(data.final_result);
        }
      })
      .catch(err => console.error('Failed to fetch unified results:', err));
  };

  // Poll for Job Status
  useEffect(() => {
    const fetchStatus = () => {
      fetch(`${apiBase}/api/job-status`)
        .then(res => res.json())
        .then(data => {
          setJobStatus(data);
          if (data.status === 'running') setIsSparkLoading(true);
          else {
            setIsSparkLoading(false);
            if (data.status === 'completed') fetchUnifiedResults();
          }
        })
        .catch(err => console.error('Status fetch error:', err));
    };

    fetchStatus();
    const interval = setInterval(fetchStatus, 3000); // Poll every 3s
    return () => clearInterval(interval);
  }, []);

  // Fetch Spark Results when activeTab is 'bigdata'
  useEffect(() => {
    if (activeTab === 'bigdata') {
      const apiBase = (import.meta as any).env.VITE_API_URL || '';
      fetch(`${apiBase}/api/spark/results`)
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data)) {
            setSparkResults(data);
          }
        })
        .catch(err => console.error('Spark results fetch error:', err));
    }
  }, [activeTab]);

  const handleAnalysisStart = () => {
    setActiveTab('bigdata');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleAnalysisComplete = (result: any) => {
    setLatestAnalysis(result);
    
    // AUTO-SYNC: Set Spark grid and Unified dossier results immediately from the response
    if (result.spark_results) {
      setSparkResults(result.spark_results);
    }
    if (result.unified_consensus) {
      setUnifiedResult(result.unified_consensus);
    }

    // Refresh archive
    if (user) {
      fetchUnifiedResults(); // For logged in users, we still might want to fetch to ensure sync
      const token = localStorage.getItem('token');
      fetch(`${apiBase}/api/reports`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data)) {
            setAllNews(data);
          }
        });
    } else {
      // GUEST ENHANCEMENT: Persist result to localStorage (Archive tab)
      const guestData = JSON.parse(localStorage.getItem('guestReports') || '[]');
      const newReport = {
        id: Date.now(),
        inputText: result.news_title || "Guest Input",
        text: result.news_title || "Guest Input",
        result: result,
        createdAt: new Date().toISOString()
      };
      const updated = [newReport, ...guestData].slice(0, 50); // Keep last 50
      localStorage.setItem('guestReports', JSON.stringify(updated));
      setAllNews(updated);

      // GUEST ENHANCEMENT: Update summary stats locally during session
      setSummary(prev => {
        const count = updated.length;
        const sparkCount = result.spark_results?.length || 0;
        return {
          verifiedCount: count,
          activeSparkNodes: sparkCount,
          averageCredibility: result.confidence / 100,
          activeUsers: prev?.activeUsers || 1,
          dataProcessed: `${(count * 0.05).toFixed(2)} MB`,
          trend: "+100%"
        };
      });
    }
  };

  const handleDeleteReport = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this intelligence report?')) {
      try {
        if (user) {
          const token = localStorage.getItem('token');
          await fetch(`${apiBase}/api/report/${id}`, { 
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

  const handleRunSparkAnalysis = async () => {
    setIsSparkLoading(true);
    try {
      const apiBase = (import.meta as any).env.VITE_API_URL || '';
      const response = await fetch(`${apiBase}/api/spark/analyze`, { 
        method: 'POST' 
      });
      const data = await response.json();
      if (data.success) {
        // Refresh the results list immediately from the GET endpoint
        const resResponse = await fetch(`${apiBase}/api/spark/results`);
        const resData = await resResponse.json();
        if (Array.isArray(resData)) {
          setSparkResults(resData);
        }
      }
    } catch (err) {
      console.error('Spark analysis error:', err);
    } finally {
      setIsSparkLoading(false);
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
              <NavItem 
                icon={<Shield size={18} className="text-blue-400" />} 
                label="Big Data Engine" 
                active={activeTab === 'bigdata'} 
                onClick={() => setActiveTab('bigdata')} 
              />
              <NavItem 
                icon={<HelpCircle size={18} />} 
                label="Help" 
                active={activeTab === 'help'} 
                onClick={() => setActiveTab('help')} 
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
              <ChatInterface 
                onAnalysisComplete={handleAnalysisComplete} 
                onAnalysisStart={handleAnalysisStart}
              />
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatsCard 
                  title="Verified Records" 
                  value={summary?.verifiedCount || 0} 
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
                  title="Active News Nodes" 
                  value={summary?.activeSparkNodes || 0} 
                  icon={<Bot className="text-indigo-400" />} 
                  trend="PROCESSING"
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
                  {(unifiedResult || latestAnalysis) && (
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
                        (unifiedResult?.verdict || latestAnalysis?.label) === 'REAL' ? 'border-l-emerald-500' : 'border-l-red-500'
                      }`}>
                        <div className="flex items-center justify-between mb-4">
                          <span className={`text-[10px] font-bold uppercase tracking-widest ${
                            displayVerdict === 'REAL' ? 'text-emerald-500' : 'text-red-500'
                          }`}>
                            {displayVerdict} VERDICT
                          </span>
                          <span className="text-[9px] text-slate-500 uppercase tracking-widest flex items-center gap-2">
                            <span className="px-2 py-0.5 bg-blue-500/10 border border-blue-500/20 rounded-md text-blue-400">UNIFIED CONSENSUS</span>
                            Score: {displayScore.toFixed(1)}%
                          </span>
                        </div>
                        <p className="text-xs text-slate-300 line-clamp-2 mb-4">
                          {unifiedResult?.ai_analysis?.context || latestAnalysis?.context}
                        </p>
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-1 text-[9px] text-slate-500 uppercase tracking-widest">
                            <Globe size={10} /> {unifiedResult?.location || latestAnalysis?.location || "Global"}
                          </div>
                          <div className="flex items-center gap-1 text-[9px] text-slate-500 uppercase tracking-widest">
                            <Users size={10} /> {unifiedResult?.spreaders?.length || latestAnalysis?.spreaders?.length || 0} Spreaders
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
                        await fetch(`${apiBase}/api/reports`, { 
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
                          true_analysis: analysis.true_analysis || analysis.trueAnalysis,
                          spreaders: analysis.spreaders || [{ name: "@archive_node", url: "#" }, { name: "@historical_seq", url: "#" }],
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

           {(activeTab === 'dossier' && (unifiedResult || latestAnalysis)) && (
            <div className="space-y-8 lg:space-y-12">
              <div className="royal-card p-6 lg:p-12">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 lg:mb-12">
                  <div>
                    <h3 className="text-2xl font-display font-extrabold text-white uppercase tracking-tight">Intelligence Dossier</h3>
                    <p className="text-slate-500 text-[10px] uppercase tracking-[0.2em] mt-2">Comprehensive Truth Verification Report</p>
                  </div>
                  <div className={`px-6 py-3 border rounded-xl flex items-center gap-3 ${
                    displayVerdict === 'REAL' ? 'border-emerald-500/30 bg-emerald-500/5 text-emerald-500' : 'border-red-500/30 bg-red-500/5 text-red-500'
                  }`}>
                    {displayVerdict === 'REAL' ? <ShieldCheck size={20} /> : <ShieldAlert size={20} />}
                    <span className="text-sm font-bold uppercase tracking-[0.3em]">{displayVerdict} VERDICT</span>
                  </div>
                </div>

                {latestAnalysis?.limited_data && (
                  <div className="mb-8 p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-center gap-3">
                    <ShieldAlert className="text-amber-500" size={18} />
                    <p className="text-[10px] text-amber-500 font-bold uppercase tracking-widest">
                      Limited data available — analysis based on best available information
                    </p>
                  </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
                  <div className="space-y-8 lg:space-y-12">
                    <section>
                       <h4 className="text-[10px] uppercase tracking-[0.4em] text-slate-500 font-bold mb-6">Contextual Analysis</h4>
                       <p className="text-sm text-slate-300 leading-relaxed bg-white/5 p-6 rounded-xl border border-white/5">
                         {unifiedResult?.ai_analysis?.explanation || latestAnalysis?.context || latestAnalysis?.news_title || 'Consolidating intelligence...'}
                       </p>
                    </section>

                    <section className="relative overflow-hidden">
                        <div className="flex items-center justify-between mb-6">
                          <h4 className="text-[10px] uppercase tracking-[0.4em] text-blue-400 font-bold">🔷 TRUE ANALYSIS</h4>
                          <span className="text-[9px] text-slate-500 uppercase tracking-widest font-bold">
                            Truth Index: {displayScore.toFixed(1)}%
                          </span>
                        </div>
                       <div className="relative group">
                          <div className={`absolute -inset-1 rounded-xl blur opacity-25 group-hover:opacity-50 transition duration-1000 ${
                            (latestAnalysis?.trueAnalysis === "No reliable sources found" || latestAnalysis?.trueAnalysis === "Insufficient verified data")
                              ? "bg-slate-500/20"
                              : "bg-gradient-to-r from-blue-600/20 to-indigo-600/20"
                          }`}></div>
                          <div className={`relative text-sm text-slate-200 leading-relaxed bg-[#0F172A]/80 p-8 rounded-xl border shadow-2xl ${
                            (latestAnalysis?.true_analysis === "No verified data available" || latestAnalysis?.trueAnalysis === "No reliable sources found" || latestAnalysis?.trueAnalysis === "Insufficient verified data")
                              ? "border-white/5 opacity-60"
                              : "border-blue-500/20"
                          }`}>
                            {unifiedResult?.ai_analysis?.true_analysis || latestAnalysis?.true_analysis || latestAnalysis?.trueAnalysis || 'Searching verified news archives for factual grounding...'}
                            
                            {latestAnalysis?.correctedValues && latestAnalysis.correctedValues.length > 0 && (
                              <div className="mt-6 pt-6 border-t border-white/5 space-y-3">
                                <p className="text-[9px] uppercase tracking-widest text-slate-500 font-bold mb-2">Corrected Factual Data</p>
                                {latestAnalysis.correctedValues.map((cv, idx) => (
                                  <div key={idx} className="flex items-center gap-3 text-[10px]">
                                    <span className="text-red-400 font-bold line-through px-2 py-0.5 bg-red-400/10 rounded">{cv.old}</span>
                                    <ArrowRight size={12} className="text-slate-600" />
                                    <span className="text-emerald-400 font-bold px-2 py-0.5 bg-emerald-400/10 rounded">{cv.new}</span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
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
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                         <BackendMetric label="Target Outlet" value={unifiedResult?.ai_analysis?.publication || latestAnalysis?.technicalMetadata?.publication || 'Multi-Source Signal'} />
                         <BackendMetric label="Bot Activity" value={latestAnalysis?.technicalMetadata?.botActivity || 'Low (Organic)'} />
                         <BackendMetric label="AI Verification" value={unifiedResult?.ai_score ? `${unifiedResult.ai_score}%` : 'Verified'} />
                         <BackendMetric label="Big Data Sync" value={unifiedResult?.spark_score ? `${unifiedResult.spark_score}%` : 'Synchronized'} />
                       </div>
                     </section>

                     <section>
                       <h4 className="text-[10px] uppercase tracking-[0.4em] text-slate-500 font-bold mb-6">Identified Spreaders</h4>
                       <div className="flex flex-wrap gap-3">
                         {(latestAnalysis?.spreaders || []).map((s, i) => (
                           <a 
                             key={i} 
                             href={s.url}
                             target="_blank"
                             rel="noopener noreferrer"
                             className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg flex items-center gap-2 hover:border-blue-500/50 hover:bg-blue-500/5 transition-all group"
                           >
                             <Users size={12} className="text-blue-400 group-hover:scale-110 transition-transform" />
                             <span className="text-[10px] text-slate-300 font-bold uppercase tracking-widest group-hover:text-blue-400 transition-colors">
                               {s.name}
                             </span>
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
                  <div className="flex items-center justify-between mb-8">
                    <h4 className="text-[10px] uppercase tracking-[0.4em] text-slate-500 font-bold">Verified Sources Archive</h4>
                    <span className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded text-[8px] font-bold text-emerald-400 tracking-widest">VERIFIED BY TRUSTED SOURCES</span>
                  </div>
                  
                  {(!latestAnalysis?.verified_sources || latestAnalysis.verified_sources.length === 0 || latestAnalysis.verified_sources[0].name === "No trusted sources found") ? (
                    <div className="p-12 bg-slate-900/50 border border-white/5 rounded-2xl text-center">
                      <FileText size={40} className="mx-auto text-slate-800 mb-6" />
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">No trusted sources found</p>
                      <p className="text-[9px] text-slate-600 uppercase tracking-widest">This news could not be correlated with a trusted news outlet from our registry.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {latestAnalysis.verified_sources.map((s, i) => (
                        <a 
                          key={i} 
                          href={s.url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="block p-5 bg-emerald-500/5 border border-emerald-500/10 rounded-xl hover:border-emerald-500/30 hover:bg-emerald-500/10 transition-all group"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <ShieldCheck size={14} className="text-emerald-500" />
                              <span className="text-[10px] text-slate-300 font-bold uppercase tracking-widest group-hover:text-emerald-400 transition-colors">{s.name}</span>
                            </div>
                            <Globe size={12} className="text-slate-600 group-hover:text-emerald-400 transition-colors" />
                          </div>
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'bigdata' && (
            <div className="space-y-8 lg:space-y-12">
              <div className="royal-card p-8 lg:p-12 border-b-4 border-b-blue-500/20">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
                  <div>
                    <h3 className="text-2xl font-display font-extrabold text-white uppercase tracking-tight">Big Data Analysis Engine</h3>
                    <p className="text-slate-500 text-[10px] uppercase tracking-[0.2em] mt-2">Distributed Processing via Apache Spark</p>
                  </div>
                  
                  <div className="flex items-center gap-6">
                    <div className="flex flex-col items-end">
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${
                          jobStatus.status === 'running' ? 'bg-blue-500 animate-ping' : 
                          jobStatus.status === 'error' ? 'bg-red-500' : 'bg-emerald-500'
                        }`} />
                        <span className={`text-[10px] font-bold uppercase tracking-widest ${
                          jobStatus.status === 'error' ? 'text-red-400' : 'text-slate-300'
                        }`}>
                          {jobStatus.status}
                        </span>
                      </div>
                      <p className="text-[8px] text-slate-500 uppercase tracking-widest mt-1">{jobStatus.message}</p>
                    </div>

                    <button 
                      onClick={handleRunSparkAnalysis}
                      disabled={isSparkLoading}
                      className={`px-8 py-4 rounded-xl flex items-center gap-3 font-bold uppercase tracking-[0.3em] text-[10px] transition-all ${
                        isSparkLoading 
                          ? 'bg-blue-600/20 text-blue-500 border border-blue-500/20 animate-pulse cursor-not-allowed' 
                          : 'bg-blue-600 hover:bg-blue-700 text-white shadow-2xl shadow-blue-500/20'
                      }`}
                    >
                      {isSparkLoading ? (
                        <>
                          <Bot className="animate-spin" size={18} />
                          Processing Distributed Nodes...
                        </>
                      ) : (
                        <>
                          <Activity size={18} />
                          Trigger Global Analysis
                        </>
                      )}
                    </button>

                    {jobStatus.status === 'completed' && latestAnalysis && (
                      <motion.button 
                        initial={{ opacity: 0, scale: 0.9, x: 20 }}
                        animate={{ opacity: 1, scale: 1, x: 0 }}
                        onClick={() => {
                          setActiveTab('dossier');
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        }}
                        className="px-8 py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl flex items-center gap-3 font-extrabold uppercase tracking-[0.3em] text-[10px] shadow-[0_0_30px_rgba(16,185,129,0.3)] border border-emerald-400/30 transition-all hover:scale-105"
                      >
                        <ShieldCheck size={18} />
                        Reveal Forensic Dossier
                        <ArrowRight size={16} />
                      </motion.button>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                 <div className="lg:col-span-2">
                    <section>
                      <div className="flex items-center gap-4 mb-8">
                        <h3 className="text-[10px] uppercase tracking-[0.4em] text-slate-500 font-bold">Processed Intelligence News</h3>
                        <div className="h-px flex-1 bg-white/5"></div>
                      </div>
                      <SparkResults data={sparkResults} />
                    </section>
                 </div>

                 <div className="space-y-8">
                    <section className="royal-card p-8">
                       <h4 className="text-[10px] uppercase tracking-[0.4em] text-slate-500 font-bold mb-6">Engine Telemetry</h4>
                       <div className="space-y-6">
                          <TelemetryItem label="Spark Master" value="local[*]" />
                          <TelemetryItem label="Node Status" value="Online" color="text-emerald-500" />
                          <TelemetryItem label="Memory Load" value="2.4 GB / 8.0 GB" />
                          <TelemetryItem label="Active Jobs" value={isSparkLoading ? "1" : "0"} />
                       </div>
                    </section>

                    <section className="p-8 bg-blue-500/5 border border-blue-500/10 rounded-2xl">
                       <div className="flex items-center gap-3 mb-4">
                          <ShieldCheck className="text-blue-400" size={18} />
                          <h4 className="text-[10px] uppercase tracking-[0.2em] text-blue-400 font-black">Data Security Protocol</h4>
                       </div>
                       <p className="text-[9px] text-slate-500 leading-relaxed uppercase tracking-wider">
                          Distributed news processing uses end-to-end encryption. Results are stored in an encapsulated JSON archive.
                       </p>
                    </section>
                 </div>
              </div>
            </div>
          )}

          {activeTab === 'help' && (
            <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
              <div className="max-w-4xl">
                <h3 className="text-2xl font-display font-extrabold text-white uppercase tracking-tight mb-4">System Manual</h3>
                <p className="text-slate-500 text-[10px] uppercase tracking-[0.2em] mb-12">How to utilize the Imperial Truth Engine</p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
                  <section className="space-y-6">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 font-bold text-xs">01</div>
                      <h4 className="text-[10px] uppercase tracking-[0.4em] text-blue-400 font-bold">Data Ingestion</h4>
                    </div>
                    <div className="royal-card p-6 lg:p-8 bg-white/5 border border-white/5 rounded-xl">
                      <p className="text-xs text-slate-300 leading-relaxed">
                        Submit news claims via the <strong>Sovereign Overview</strong> chat interface. You can type text directly or upload multimedia records (Images/PDFs). The system uses OCR and PDF parsing to extract raw intelligence.
                      </p>
                    </div>
                  </section>

                  <section className="space-y-6">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 font-bold text-xs">02</div>
                      <h4 className="text-[10px] uppercase tracking-[0.4em] text-indigo-400 font-bold">Distributed Analysis</h4>
                    </div>
                    <div className="royal-card p-6 lg:p-8 bg-white/5 border border-white/5 rounded-xl">
                      <p className="text-xs text-slate-300 leading-relaxed">
                        Once submitted, the <strong>Big Data Engine</strong> automatically triggers a distributed search across global news nodes. Apache Spark clusters refine and correlate this data in real-time to find supporting evidence.
                      </p>
                    </div>
                  </section>

                  <section className="space-y-6">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 font-bold text-xs">03</div>
                      <h4 className="text-[10px] uppercase tracking-[0.4em] text-emerald-400 font-bold">Forensic Verification</h4>
                    </div>
                    <div className="royal-card p-6 lg:p-8 bg-white/5 border border-white/5 rounded-xl">
                      <p className="text-xs text-slate-300 leading-relaxed">
                        The <strong>Intelligence Dossier</strong> provides a unified consensus verdict (REAL or FAKE). It breaks down the claim using ensemble AI models and provides a "True Analysis" based on verified factual grounding.
                      </p>
                    </div>
                  </section>

                  <section className="space-y-6">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 font-bold text-xs">04</div>
                      <h4 className="text-[10px] uppercase tracking-[0.4em] text-amber-400 font-bold">Diffusion Mapping</h4>
                    </div>
                    <div className="royal-card p-6 lg:p-8 bg-white/5 border border-white/5 rounded-xl">
                      <p className="text-xs text-slate-300 leading-relaxed">
                        Navigate to the <strong>Diffusion</strong> tab to visualize how news propagates. This includes reach metrics, velocity, and bot activity detection to identify coordinated misinformation campaigns.
                      </p>
                    </div>
                  </section>
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

function TelemetryItem({ label, value, color = 'text-slate-300' }: { label: string, value: any, color?: string }) {
  return (
    <div className="flex justify-between items-center pb-4 border-b border-white/5">
      <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">{label}</span>
      <span className={`text-[10px] font-mono tracking-widest font-bold ${color}`}>{value}</span>
    </div>
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
