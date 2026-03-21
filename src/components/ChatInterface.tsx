import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Share2, AlertCircle, Loader2, Upload, Paperclip } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  analysis?: any;
}

interface ChatInterfaceProps {
  onAnalysisComplete: (result: any) => void;
  isUploading?: boolean;
}

export default function ChatInterface({ onAnalysisComplete }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const sendToEngine = async (file?: File, text?: string) => {
    if (isLoading) return;
    
    setIsLoading(true);
    setError(null);

    // Initial UI update
    if (file) {
      setMessages(prev => [...(prev || []), { 
        role: 'assistant', 
        content: `🔍 **Extracting text from file...**` 
      }]);
    } else if (text) {
      setMessages(prev => [...(prev || []), { role: 'user', content: text }]);
      setInput('');
    }

    try {
      const formData = new FormData();
      if (file) {
        formData.append("file", file);
      } else if (text) {
        formData.append("text", text);
      } else {
        throw new Error("Empty input");
      }

      const token = localStorage.getItem('token');
      const res = await fetch("/api/upload", {
        method: "POST",
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
        body: formData
      });

      const result = await res.json();
      
      if (!res.ok || !result.success) {
        throw new Error(result.error || "Neural process failed");
      }

      // Final UI update: Remove loading message and replace with structured result
      if (result.success) {
        const { analysis } = result;
        const sourceCount = analysis.technicalMetadata?.sourceCount || 0;
        const originalSource = analysis.source_links?.original;
        
        let formattedMsg = `
[EXTRACTED CONTEXT] 
${result.data.substring(0, 500)}${result.data.length > 500 ? '...' : ''}

[SENTINEL ANALYSIS]
# VERDICT: ${analysis.label} VERDICT
# CONFIDENCE: ${analysis.confidence.toFixed(1)}%
# TARGET OUTLET: ${analysis.technicalMetadata?.publication || "Identified"}

${analysis.context}

[STRATEGIC GROUNDING]
# ORIGIN: ${originalSource ? originalSource : "Projected Signal (Pending Search)"}
# CONTEXTUAL NODES: ${sourceCount > 0 ? sourceCount : 'Deep Search Active'}
# TELEMETRY: ${sourceCount > 0 ? 'Verified Diffusion' : 'Social Signal Projection'}

[ALGORITHMIC BENCHMARKS]
${analysis.model_results?.map((m: any) => `- ${m.name}: ${(m.accuracy * 100).toFixed(1)}%`).join('\n') || 'Benchmarking in progress...'}
          `;

        const assistantMessage: Message = {
          role: 'assistant',
          content: formattedMsg,
          analysis: analysis
        };
        setMessages(prev => {
          const history = (prev || []).filter(m => !m.content.includes("Extracting text"));
          return [...history, assistantMessage];
        });
      }

      if (onAnalysisComplete && result.analysis) {
        onAnalysisComplete(result.analysis);
      }

    } catch (err) {
      console.error("Neural Error:", err);
      setError("⚠️ Failed to process input");
      // Stop infinite loading
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) sendToEngine(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSend = () => {
    if (input.trim()) sendToEngine(undefined, input.trim());
  };

  return (
    <div className="flex flex-col h-[600px] bg-slate-900/50 backdrop-blur-xl rounded-2xl border border-white/5 overflow-hidden shadow-2xl">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-slate-500 space-y-4">
            <Bot size={48} className="opacity-20" />
            <p className="text-xs uppercase tracking-[0.2em] font-medium">Awaiting Intel or Record Upload</p>
          </div>
        )}
        
        <AnimatePresence>
          {messages.map((msg, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-[85%] p-4 rounded-2xl ${
                msg.role === 'user' 
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' 
                  : 'bg-white/5 border border-white/10 text-slate-200'
              }`}>
                <div className="flex items-center gap-2 mb-2 opacity-50">
                  {msg.role === 'user' ? <User size={12} /> : <Bot size={12} />}
                  <span className="text-[10px] uppercase font-bold tracking-widest">
                    {msg.role === 'user' ? 'Direct Input' : 'Imperial Sentinel'}
                  </span>
                </div>
                <div className="text-sm leading-relaxed whitespace-pre-wrap font-medium">
                  {msg.content}
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        
        {isLoading && !messages.some(m => m.content.includes("Extracting")) && (
          <div className="flex justify-start">
            <div className="bg-white/5 border border-white/10 p-4 rounded-2xl flex items-center gap-3">
              <Loader2 size={16} className="text-blue-400 animate-spin" />
              <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400">Synchronizing...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Error State */}
      {error && (
        <div className="px-4 py-2 bg-red-500/10 border-t border-red-500/20 flex items-center gap-2">
          <AlertCircle size={14} className="text-red-400" />
          <span className="text-[10px] font-bold text-red-400 uppercase tracking-widest">{error}</span>
        </div>
      )}

      {/* Input Area */}
      <div className="p-4 bg-[#0F172A]/80 border-t border-white/5">
        <div className="relative group">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSend())}
            placeholder="ENTER INTEL OR UPLOAD MULTIMEDIA RECORD..."
            className="w-full bg-slate-900/50 border border-white/10 rounded-xl py-4 pl-12 pr-12 text-sm text-slate-200 placeholder:text-slate-600 focus:border-blue-500/50 outline-none transition-all resize-none min-h-[60px] max-h-[200px]"
          />
          
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="absolute left-3 top-1/2 -translate-y-1/2 p-2 hover:bg-white/5 rounded-lg transition-colors text-slate-500 hover:text-blue-400"
          >
            <Paperclip size={18} />
          </button>
          
          <button 
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-2 hover:bg-blue-500/10 rounded-lg transition-colors text-slate-500 hover:text-blue-400 disabled:opacity-30"
          >
            <Send size={18} />
          </button>
        </div>
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileUpload}
          accept="image/*,.pdf"
          className="hidden"
        />
      </div>
    </div>
  );
}
