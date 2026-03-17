import React, { useState } from 'react';
import { Upload, FileText, CheckCircle2, AlertCircle, ShieldCheck, Globe, Users, Info, Database } from 'lucide-react';

interface AnalysisResult {
  title?: string;
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
  source_links?: any;
  diffusion_data?: any[];
}

export default function NewsUpload({ onAnalysisComplete, user }: { onAnalysisComplete?: (result: AnalysisResult) => void, user?: { email: string } | null }) {
  const [text, setText] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleAnalyze = async () => {
    if (!text) return;
    setAnalyzing(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch('/api/ai/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });

      if (!response.ok) {
        const errorBody = await response.json().catch(() => null);
        throw new Error(errorBody?.error || 'OpenAI analysis failed');
      }

      const analysis = await response.json();

      const finalResult = {
        ...analysis,
        news_title: analysis.title || 'Classified Analysis',
        sources: analysis.sources || [],
      };

      // Save to backend
      await fetch('/api/news/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text,
          user_id: user?.email,
          ...finalResult
        })
      });

      setResult(finalResult);
      if (onAnalysisComplete) onAnalysisComplete(finalResult);
    } catch (err) {
      console.error('Analysis failed:', err);
      setError('Imperial Intelligence failed to reach the archives. Please try again.');
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div className="royal-card p-6 lg:p-8">
      <div className="flex items-center gap-3 mb-8">
        <ShieldCheck className="text-blue-400 w-4 h-4" />
        <h3 className="text-[10px] uppercase tracking-[0.4em] text-slate-500 font-bold">Imperial Truth Analysis</h3>
      </div>
      
      <div className="space-y-8">
        <div className="relative">
          <textarea 
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="SUBMIT CONTENT FOR GLOBAL VERIFICATION..."
            className="w-full h-48 p-6 bg-black/20 border border-white/5 rounded-xl text-[10px] tracking-[0.2em] focus:border-blue-500 outline-none resize-none transition-all placeholder:text-slate-700"
          />
          <div className="absolute bottom-4 right-4 text-[8px] text-slate-700 tracking-[0.2em] uppercase font-bold">
            Powered by OpenAI
          </div>
        </div>
        
        <div className="flex items-center gap-6">
          <button 
            onClick={handleAnalyze}
            disabled={analyzing || !text}
            className="flex-1 bg-blue-600 text-white font-bold py-4 rounded-xl text-[10px] tracking-[0.3em] uppercase hover:bg-blue-700 transition-all duration-500 disabled:opacity-20 flex items-center justify-center gap-3 shadow-2xl shadow-blue-500/20"
          >
            {analyzing ? (
              <>
                <div className="w-3 h-3 border border-white/30 border-t-white rounded-full animate-spin" />
                QUERYING ARCHIVES...
              </>
            ) : (
              <>
                <Globe size={14} />
                VERIFY AUTHENTICITY
              </>
            )}
          </button>
          
          <button className="p-4 border border-white/5 rounded-xl hover:border-blue-500/30 transition-all text-slate-600 hover:text-blue-400">
            <Upload size={14} />
          </button>
        </div>

        {error && (
          <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-[10px] font-bold uppercase tracking-widest">
            {error}
          </div>
        )}

        {result && (
          <div className={`space-y-6 p-8 rounded-xl border ${
            result.label === 'REAL' ? 'border-emerald-500/20 bg-emerald-500/5' : 'border-red-500/20 bg-red-500/5'
          }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {result.label === 'REAL' ? (
                  <CheckCircle2 className="text-emerald-500 w-5 h-5" />
                ) : (
                  <AlertCircle className="text-red-500 w-5 h-5" />
                )}
                <span className={`text-[10px] font-bold tracking-[0.3em] uppercase ${
                  result.label === 'REAL' ? 'text-emerald-500' : 'text-red-500'
                }`}>
                  {result.label} VERDICT
                </span>
              </div>
              <span className="text-[9px] font-bold text-slate-500 tracking-[0.2em]">CONFIDENCE: {result.confidence.toFixed(1)}%</span>
            </div>

            <div className="w-full h-px bg-white/5 overflow-hidden">
              <div 
                className={`h-full transition-all duration-1000 ${
                  result.label === 'REAL' ? 'bg-emerald-500' : 'bg-red-500'
                }`}
                style={{ width: `${result.confidence}%` }}
              />
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Globe size={12} className="text-blue-400" />
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Primary Location</span>
                  </div>
                  <p className="text-[10px] text-slate-300 font-bold uppercase tracking-widest bg-white/5 p-3 rounded-lg border border-white/5">
                    {result.location}
                  </p>
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Database size={12} className="text-blue-400" />
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Propagation Pattern</span>
                  </div>
                  <p className="text-[10px] text-slate-300 font-bold uppercase tracking-widest bg-white/5 p-3 rounded-lg border border-white/5">
                    {result.technicalMetadata.propagationPattern}
                  </p>
                </div>
              </div>

              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Info size={12} className="text-blue-400" />
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Context & Details</span>
                </div>
                <p className="text-[10px] text-slate-300 leading-relaxed tracking-wide">
                  {result.context}
                </p>
              </div>

              {result.spreaders && result.spreaders.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Users size={12} className="text-blue-400" />
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Known Spreaders / Sources</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {result.spreaders.map((spreader, i) => (
                      <span key={i} className="px-2 py-1 bg-white/5 border border-white/10 rounded text-[8px] text-slate-400 font-bold uppercase tracking-widest">
                        {spreader}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {result.sources && result.sources.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Globe size={12} className="text-blue-400" />
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Grounding Sources</span>
                  </div>
                  <div className="space-y-2">
                    {result.sources.map((source, i) => (
                      <a 
                        key={i} 
                        href={source.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="block text-[9px] text-blue-400 hover:text-blue-300 transition-colors truncate"
                      >
                        • {source.title}
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
