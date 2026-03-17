import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  Share2, 
  ShieldAlert, 
  Search,
  TrendingUp,
  Users,
  Database,
  FileText,
  Shield,
  Menu,
  X,
  LogIn,
  LogOut,
  History,
  Lock,
  Globe,
  ShieldCheck,
  Trash
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Link } from 'react-router-dom';
import StatsCard from '../components/StatsCard';
import DiffusionChart from '../components/DiffusionChart';
import ModelComparison from '../components/ModelComparison';
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
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [latestAnalysis, setLatestAnalysis] = useState<AnalysisResult | null>(null);
  const [allNews, setAllNews] = useState<any[]>([]);
  const [selectedDiffusionId, setSelectedDiffusionId] = useState<number | null>(null);

  useEffect(() => {
    fetch('/api/analytics/summary')
      .then(res => res.json())
      .then(setSummary);
    
    fetch('/api/news/all')
      .then(res => res.json())
      .then(setAllNews);
  }, []);

  const handleAnalysisComplete = (result: AnalysisResult) => {
    setLatestAnalysis(result);
    setActiveTab('dossier');
    // Refresh archive
    fetch('/api/news/all')
      .then(res => res.json())
      .then(setAllNews);
  };

  const handleDeleteReport = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this intelligence report?')) {
      try {
        await fetch(`/api/report/${id}`, { method: 'DELETE' });
        setAllNews(allNews.filter(n => n.id !== id));
        if (latestAnalysis && latestAnalysis.id === id) {
          setLatestAnalysis(null);
          setActiveTab('overview');
        }
      } catch (err) {
        console.error('Failed to delete report', err);
      }
    }
  };

  return (
    <div className="min-h-screen flex bg-[#020617] text-slate-200">
      {/* Sidebar */}
      <AnimatePresence mode="wait">
        {isSidebarOpen && (
          <motion.aside 
            initial={{ x: -260 }}
            animate={{ x: 0 }}
            exit={{ x: -260 }}
            className="w-64 bg-[#0F172A] border-r border-white/5 flex flex-col fixed inset-y-0 z-50 lg:relative"
          >
            <div className="p-8 flex items-center gap-3 border-b border-white/5">
              <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-2xl shadow-blue-500/20">
                <Shield className="text-white w-6 h-6" />
              </div>
              <span className="font-display font-extrabold text-lg text-white tracking-widest uppercase">Imperial</span>
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
              
              <div className="pt-4">
                <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500 font-bold mb-4">Personalized</p>
                <NavItem 
                  icon={user ? <History size={18} /> : <Lock size={18} />} 
                  label="My History" 
                  active={activeTab === 'history'} 
                  onClick={() => user ? setActiveTab('history') : null}
                  disabled={!user}
                />
              </div>
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
                  <LogIn size={16} /> Authenticate
                </Link>
              )}
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <header className="sticky top-0 z-40 bg-[#020617]/80 backdrop-blur-xl border-b border-white/5 px-8 py-6 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 hover:bg-white/5 rounded-lg transition-colors text-blue-400"
            >
              {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
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
              <Search className="absolute left-0 top-1/2 -translate-y-1/2 text-slate-600 w-4 h-4" />
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

        <div className="p-12 max-w-7xl mx-auto">
          {activeTab === 'overview' && (
            <div className="space-y-16">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatsCard 
                  title="Verified Records" 
                  value={summary?.totalNews || 0} 
                  icon={<Database className="text-blue-400" />} 
                  trend="+12% PERIOD"
                />
                <StatsCard 
                  title="Integrity Index" 
                  value={`${((summary?.averageCredibility || 0) * 100).toFixed(1)}%`} 
                  icon={<ShieldAlert className="text-emerald-500" />} 
                  trend="STABLE"
                />
                <StatsCard 
                  title="Active Sentinels" 
                  value={summary?.activeUsers || 0} 
                  icon={<Users className="text-indigo-400" />} 
                  trend="+5.2%"
                />
                <StatsCard 
                  title="Data Volume" 
                  value={summary?.dataProcessed || '0 TB'} 
                  icon={<TrendingUp className="text-amber-500" />} 
                  trend="LIVE STREAM"
                />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-16">
                <div className="lg:col-span-2 space-y-16">
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
                      <div className={`royal-card p-8 border-l-4 ${
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
                            <Users size={10} /> {latestAnalysis.spreaders.length} Spreaders
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
                    <div className="royal-card p-8">
                      <DiffusionChart />
                    </div>
                  </section>
                  
                  <section>
                    <div className="flex items-center gap-4 mb-8">
                      <h3 className="text-[10px] uppercase tracking-[0.4em] text-slate-500 font-bold">Algorithmic Prowess</h3>
                      <div className="h-px flex-1 bg-white/5"></div>
                    </div>
                    <div className="royal-card p-8">
                      <ModelComparison />
                    </div>
                  </section>
                </div>
                
                <div className="space-y-16">
                  <NewsUpload onAnalysisComplete={handleAnalysisComplete} />
                  
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
            <div className="space-y-12 perspective-1000">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h3 className="text-2xl font-display font-extrabold text-white uppercase tracking-tight">Intelligence Archive</h3>
                  <p className="text-slate-500 text-[10px] uppercase tracking-[0.2em] mt-2">3D Backend Data Visualization</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {allNews.map((item, i) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, rotateY: -20, translateZ: -100 }}
                    animate={{ opacity: 1, rotateY: 0, translateZ: 0 }}
                    transition={{ delay: i * 0.1, duration: 0.8 }}
                    whileHover={{ 
                      scale: 1.05, 
                      rotateX: 5, 
                      rotateY: -5,
                      boxShadow: "0 20px 40px rgba(59, 130, 246, 0.2)"
                    }}
                    className="royal-card p-8 cursor-pointer group relative overflow-hidden preserve-3d"
                    onClick={() => {
                      setLatestAnalysis({
                        label: item.label as 'REAL' | 'FAKE',
                        confidence: item.credibility_score,
                        context: item.context,
                        spreaders: item.spreaders,
                        location: item.location,
                        technicalMetadata: item.technicalMetadata,
                        sources: item.sources
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
                          item.label === 'REAL' ? 'border-emerald-500/30 text-emerald-500 bg-emerald-500/5' : 'border-red-500/30 text-red-500 bg-red-500/5'
                        }`}>
                          {item.label}
                        </span>
                        <span className="text-[8px] text-slate-500 font-mono">{new Date(item.timestamp).toLocaleDateString()}</span>
                      </div>

                      <h4 className="text-[10px] font-bold text-white uppercase tracking-wider line-clamp-2 mb-4 group-hover:text-blue-400 transition-colors">
                        {item.text}
                      </h4>

                      <div className="space-y-3 pt-4 border-t border-white/5">
                        <div className="flex justify-between items-center">
                          <span className="text-[8px] text-slate-500 uppercase tracking-widest">Location</span>
                          <span className="text-[8px] text-blue-400 font-bold uppercase">{item.location}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-[8px] text-slate-500 uppercase tracking-widest">Bot Activity</span>
                          <span className="text-[8px] text-slate-300 font-bold uppercase">{item.technicalMetadata?.botActivity}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-[8px] text-slate-500 uppercase tracking-widest">Spreaders</span>
                          <span className="text-[8px] text-slate-300 font-bold uppercase">{item.spreaders?.length || 0} Nodes</span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'models' && (
            <div className="royal-card p-12">
               <h3 className="text-xl font-display font-extrabold text-white mb-12 uppercase tracking-tight">Algorithmic Benchmarks</h3>
               <ModelComparison showDetails />
            </div>
          )}

          {activeTab === 'diffusion' && (
            <div className="space-y-12">
               <div className="royal-card p-12 flex flex-col md:flex-row md:items-center justify-between gap-6">
                 <div>
                   <h3 className="text-xl font-display font-extrabold text-white uppercase tracking-tight">Global Diffusion & Veracity</h3>
                   <p className="text-slate-500 text-[10px] uppercase tracking-[0.2em] mt-2">Select a case archive to query deep metrics</p>
                 </div>
                 <select 
                   value={selectedDiffusionId || ''} 
                   onChange={(e) => setSelectedDiffusionId(Number(e.target.value))}
                   className="bg-[#0F172A] border border-white/10 text-white text-xs font-bold uppercase tracking-widest rounded-xl px-4 py-3 outline-none focus:border-blue-500"
                 >
                   <option value="" disabled>Select Intelligence Report...</option>
                   {allNews.map(news => (
                     <option key={news.id} value={news.id}>{news.news_title || 'Classified'} - {new Date(news.timestamp).toLocaleDateString()}</option>
                   ))}
                 </select>
               </div>

               {selectedDiffusionId && allNews.find(n => n.id === selectedDiffusionId) ? (() => {
                 const selected = allNews.find(n => n.id === selectedDiffusionId);
                 return (
                   <div className="space-y-12">
                     <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                       <div className="royal-card p-12">
                          <h4 className="text-[10px] uppercase tracking-[0.4em] text-slate-500 font-bold mb-8">Propagation Dynamics</h4>
                          <DiffusionChart data={selected.diffusion_data} height={350} />
                       </div>
                       <div className="royal-card p-12 flex flex-col justify-between">
                          <div>
                            <div className="flex items-center justify-between mb-8">
                              <h4 className="text-[10px] uppercase tracking-[0.4em] text-slate-500 font-bold">Consensus Verdict</h4>
                              <span className={`px-4 py-1 text-[10px] font-bold tracking-[0.2em] rounded border ${selected.label === 'REAL' ? 'border-emerald-500/30 text-emerald-500 bg-emerald-500/5' : 'border-red-500/30 text-red-500 bg-red-500/5'}`}>
                                {selected.label}
                              </span>
                            </div>
                            <div className="mb-12">
                              <span className="text-4xl font-display font-black text-white">{selected.credibility_score?.toFixed(1) || '0.0'}%</span>
                              <span className="text-[10px] text-slate-500 uppercase tracking-widest ml-4">Algorithmic Confidence</span>
                            </div>
                          </div>
                          <div>
                            <h4 className="text-[10px] uppercase tracking-[0.4em] text-slate-500 font-bold mb-6">Model Validation</h4>
                            <ModelComparison models={selected.model_results} showDetails={false} />
                          </div>
                       </div>
                     </div>
                     
                     <div className="royal-card p-12">
                        <h4 className="text-[10px] uppercase tracking-[0.4em] text-slate-500 font-bold mb-8">Origin Identification</h4>
                        {(!selected.source_links?.original && (!selected.source_links?.others || selected.source_links.others.length === 0)) ? (
                          <div className="p-8 bg-slate-800/50 border border-white/5 rounded-xl text-center">
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">No trusted sources found for this news.</p>
                          </div>
                        ) : (
                          <div className="flex flex-col gap-6">
                            {selected.source_links?.original && (
                              <a href={selected.source_links.original} target="_blank" rel="noopener noreferrer" className="p-6 bg-emerald-500/5 border border-emerald-500/20 rounded-xl flex items-center justify-between hover:bg-emerald-500/10 transition-colors group">
                                <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest">Primary Source</span>
                                <span className="text-xs font-mono text-emerald-400 truncate max-w-xl group-hover:text-emerald-300 transition-colors">{selected.source_links.original}</span>
                              </a>
                            )}
                            {selected.source_links?.others?.length > 0 && (
                              <div className="p-6 border border-white/5 rounded-xl">
                                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-4 block">Secondary Sources</span>
                                <div className="space-y-2">
                                  {selected.source_links.others.map((url: string, idx: number) => (
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
                 <div className="royal-card p-24 flex flex-col items-center justify-center text-center">
                   <Share2 size={48} className="text-slate-700 mb-6" />
                   <h4 className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-2">No Archive Selected</h4>
                   <p className="text-[10px] text-slate-600 uppercase tracking-widest">Select an intelligence report from the dropdown above to view diffusion metrics.</p>
                 </div>
               )}
            </div>
          )}

          {activeTab === 'dossier' && latestAnalysis && (
            <div className="space-y-12">
              <div className="royal-card p-12">
                <div className="flex items-center justify-between mb-12">
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

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                  <div className="space-y-12">
                    <section>
                      <h4 className="text-[10px] uppercase tracking-[0.4em] text-slate-500 font-bold mb-6">Contextual Analysis</h4>
                      <p className="text-sm text-slate-300 leading-relaxed bg-white/5 p-6 rounded-xl border border-white/5">
                        {latestAnalysis.context}
                      </p>
                    </section>

                    <section>
                      <h4 className="text-[10px] uppercase tracking-[0.4em] text-slate-500 font-bold mb-6">Geographic Propagation</h4>
                      <div className="flex items-center gap-4 bg-white/5 p-6 rounded-xl border border-white/5">
                        <Globe className="text-blue-400" size={24} />
                        <div>
                          <p className="text-xs font-bold text-white uppercase tracking-widest">{latestAnalysis.location}</p>
                          <p className="text-[10px] text-slate-500 uppercase tracking-widest mt-1">Primary Origin/Trend Region</p>
                        </div>
                      </div>
                    </section>
                  </div>

                  <div className="space-y-12">
                    <section>
                      <h4 className="text-[10px] uppercase tracking-[0.4em] text-slate-500 font-bold mb-6">Technical Backend (Propagation)</h4>
                      <div className="grid grid-cols-1 gap-4">
                        <BackendMetric label="Propagation Pattern" value={latestAnalysis.technicalMetadata.propagationPattern} />
                        <BackendMetric label="Bot Activity Level" value={latestAnalysis.technicalMetadata.botActivity} />
                        <BackendMetric label="Source Reliability" value={latestAnalysis.technicalMetadata.sourceReliability} />
                      </div>
                    </section>

                    <section>
                      <h4 className="text-[10px] uppercase tracking-[0.4em] text-slate-500 font-bold mb-6">Identified Spreaders</h4>
                      <div className="flex flex-wrap gap-3">
                        {latestAnalysis.spreaders.map((spreader, i) => (
                          <div key={i} className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg flex items-center gap-2">
                            <Users size={12} className="text-blue-400" />
                            <span className="text-[10px] text-slate-300 font-bold uppercase tracking-widest">{spreader}</span>
                          </div>
                        ))}
                      </div>
                    </section>
                  </div>
                </div>
              </div>

              <div className="space-y-12">
                <div className="royal-card p-12">
                  <h4 className="text-[10px] uppercase tracking-[0.4em] text-slate-500 font-bold mb-8">Algorithmic Benchmarks</h4>
                  <ModelComparison models={latestAnalysis.model_results} showDetails />
                </div>

                <div className="royal-card p-12">
                  <h4 className="text-[10px] uppercase tracking-[0.4em] text-slate-500 font-bold mb-8">Propagation Timeline</h4>
                  <DiffusionChart data={latestAnalysis.diffusion_data} height={400} />
                </div>

                <div className="royal-card p-12">
                  <h4 className="text-[10px] uppercase tracking-[0.4em] text-slate-500 font-bold mb-8">Verified Sources Archive</h4>
                  {(!latestAnalysis.source_links?.original && (!latestAnalysis.source_links?.others || latestAnalysis.source_links.others.length === 0)) ? (
                    <div className="p-8 bg-red-500/10 border border-red-500/20 rounded-xl text-center">
                      <p className="text-xs font-bold text-red-400 uppercase tracking-widest">No trusted sources found for this news.</p>
                    </div>
                  ) : (
                    <div className="space-y-8">
                      {latestAnalysis.source_links?.original && (
                        <div>
                          <h5 className="text-[9px] text-emerald-500 font-bold uppercase tracking-[0.2em] mb-4">Original Verified Source</h5>
                          <a href={latestAnalysis.source_links.original} target="_blank" rel="noopener noreferrer" className="block p-6 bg-emerald-500/5 border border-emerald-500/20 rounded-xl hover:border-emerald-500/50 transition-all group">
                            <div className="flex items-center justify-between">
                              <p className="text-xs font-bold text-emerald-400 uppercase tracking-wider truncate max-w-2xl">{latestAnalysis.source_links.original}</p>
                              <Share2 size={14} className="text-emerald-500/50 group-hover:text-emerald-400 transition-colors ml-4 shrink-0" />
                            </div>
                          </a>
                        </div>
                      )}
                      
                      {latestAnalysis.source_links?.others && latestAnalysis.source_links.others.length > 0 && (
                        <div>
                          <h5 className="text-[9px] text-blue-400 font-bold uppercase tracking-[0.2em] mb-4">Other Propagating Sources</h5>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {latestAnalysis.source_links.others.map((url, i) => (
                              <a href={url} key={i} target="_blank" rel="noopener noreferrer" className="block p-4 bg-white/5 border border-white/5 rounded-xl hover:border-blue-500/30 transition-all group">
                                <div className="flex items-center justify-between">
                                  <p className="text-[10px] text-slate-300 font-mono truncate max-w-xs">{url}</p>
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

          {activeTab === 'history' && user && (
            <div className="royal-card p-12">
               <div className="flex items-center justify-between mb-12">
                 <h3 className="text-xl font-display font-extrabold text-white uppercase tracking-tight">Personalized History</h3>
                 <span className="text-[10px] font-bold text-blue-400 uppercase tracking-widest px-3 py-1 bg-blue-400/10 border border-blue-400/20 rounded-lg">
                   Authenticated: {user.email}
                 </span>
               </div>
               <div className="space-y-6">
                 {allNews.map((item) => (
                   <div key={item.id} className="p-6 bg-white/5 border border-white/5 rounded-xl flex items-center justify-between group hover:border-blue-500/30 transition-all">
                     <div className="flex items-center gap-4">
                       <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${item.label === 'REAL' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}`}>
                         <FileText size={20} />
                       </div>
                       <div>
                         <h4 className="text-sm font-bold text-white uppercase tracking-wider">{item.news_title || 'Classified Analysis'}</h4>
                         <p className="text-[10px] text-slate-500 uppercase tracking-widest mt-1">Processed {new Date(item.timestamp).toLocaleDateString()} • Credibility: {item.credibility_score?.toFixed(1) || '0.0'}%</p>
                       </div>
                     </div>
                     <div className="flex items-center gap-4">
                       <button onClick={() => {
                         setLatestAnalysis(item);
                         setActiveTab('dossier');
                       }} className="text-[10px] font-bold text-slate-400 uppercase tracking-widest hover:text-blue-400 transition-colors">
                         View Report
                       </button>
                       <button onClick={() => handleDeleteReport(item.id)} className="p-2 text-slate-500 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors">
                         <Trash size={16} />
                       </button>
                     </div>
                   </div>
                 ))}
                 {allNews.length === 0 && (
                   <p className="text-slate-500 text-sm py-8 uppercase tracking-widest">No reports archived in your history.</p>
                 )}
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
