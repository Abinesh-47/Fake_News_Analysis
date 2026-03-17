import React from 'react';
import { motion } from 'motion/react';

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  trend: string;
}

export default function StatsCard({ title, value, icon, trend }: StatsCardProps) {
  return (
    <motion.div 
      whileHover={{ y: -4, backgroundColor: 'rgba(255, 255, 255, 0.02)' }}
      className="royal-card p-6 lg:p-8 transition-all duration-500"
    >
      <div className="flex items-start justify-between mb-8">
        <div className="w-10 h-10 bg-blue-600/10 border border-blue-500/20 rounded-lg flex items-center justify-center text-blue-400">
          {icon}
        </div>
        <span className={`text-[9px] font-bold tracking-[0.2em] px-2 py-1 uppercase rounded-md ${
          trend.includes('+') ? 'bg-emerald-500/10 text-emerald-500' : 'text-slate-500'
        }`}>
          {trend}
        </span>
      </div>
      <h4 className="text-slate-500 text-[9px] font-bold uppercase tracking-[0.3em] mb-2">{title}</h4>
      <p className="text-2xl font-display font-extrabold text-white tracking-tight">{value}</p>
    </motion.div>
  );
}
