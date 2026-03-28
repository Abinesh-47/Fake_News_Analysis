import React from 'react';
import { Shield, ExternalLink, Calendar, User } from 'lucide-react';
import { motion } from 'motion/react';

interface SparkResult {
  title: string;
  content: string;
  author: string;
  date: string | number;
  credibility_score: number;
}

interface SparkResultsProps {
  data: SparkResult[];
}

export default function SparkResults({ data }: SparkResultsProps) {
  if (!data || data.length === 0) {
    return (
      <div className="p-12 text-center royal-card border-dashed">
        <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">No Big Data analysis results found.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {data.map((item, index) => (
          <motion.div 
            key={index}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.1 }}
            className="royal-card p-6 border-l-4 border-l-blue-500/50 hover:shadow-[0_0_30px_rgba(59,130,246,0.1)] transition-all group"
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`px-2 py-1 rounded text-[8px] font-black tracking-widest uppercase ${
                item.credibility_score > 35 ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'
              }`}>
                Score: {item.credibility_score}%
              </div>
              <Shield size={14} className={item.credibility_score > 35 ? 'text-emerald-500' : 'text-amber-500'} />
            </div>

            <h4 className="text-[10px] font-bold text-white uppercase tracking-wider mb-4 line-clamp-2 group-hover:text-blue-400 transition-colors">
              {item.title}
            </h4>

            <div className="space-y-3 pt-4 border-t border-white/5">
              <div className="flex items-center gap-2 text-[9px] text-slate-500 uppercase tracking-widest">
                <User size={10} /> {item.author || "Unknown"}
              </div>
              <div className="flex items-center gap-2 text-[9px] text-slate-500 uppercase tracking-widest">
                <Calendar size={10} /> {typeof item.date === 'number' ? new Date(item.date).toLocaleDateString() : item.date}
              </div>
            </div>

            <div className="mt-6">
               <button className="w-full py-2 bg-blue-500/5 hover:bg-blue-500/10 border border-blue-500/20 rounded-lg text-[9px] font-bold text-blue-400 uppercase tracking-widest transition-all">
                  Inspect Original Source
               </button>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
