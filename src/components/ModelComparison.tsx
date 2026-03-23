import React, { useEffect, useState } from 'react';

interface ModelMetric {
  name: string;
  accuracy: number;
  precision: number;
  recall: number;
  f1: number;
}

export default function ModelComparison({ showDetails = false, models }: { showDetails?: boolean, models?: ModelMetric[] }) {
  const apiBase = import.meta.env.VITE_API_URL || '';
  const [localModels, setLocalModels] = useState<ModelMetric[]>(models || []);

  useEffect(() => {
    if (models && models.length > 0) {
      setLocalModels(models);
    } else {
      fetch(`${apiBase}/api/models/comparison`)
        .then(res => res.json())
        .then(setLocalModels);
    }
  }, [models]);

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left">
        <thead>
          <tr className="border-b border-white/5">
            <th className="pb-6 pr-4 text-[9px] font-bold text-slate-500 uppercase tracking-[0.3em]">Algorithm</th>
            <th className="pb-6 pr-4 text-[9px] font-bold text-slate-500 uppercase tracking-[0.3em]">Accuracy</th>
            {showDetails && (
              <>
                <th className="pb-6 pr-4 text-[9px] font-bold text-slate-500 uppercase tracking-[0.3em]">Precision</th>
                <th className="pb-6 pr-4 text-[9px] font-bold text-slate-500 uppercase tracking-[0.3em]">Recall</th>
                <th className="pb-6 pr-4 text-[9px] font-bold text-slate-500 uppercase tracking-[0.3em]">F1-Score</th>
              </>
            )}
            <th className="pb-6 text-[9px] font-bold text-slate-500 uppercase tracking-[0.3em]">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/5">
          {localModels.map((model) => (
            <tr key={model.name} className="group hover:bg-white/5 transition-all duration-500">
              <td className="py-6 pr-4 font-bold text-white text-sm uppercase tracking-wider">{model.name}</td>
              <td className="py-6 pr-4">
                <div className="flex items-center gap-6">
                  <div className="flex-1 h-px w-24 lg:w-32 bg-white/5 overflow-hidden">
                    <div 
                      className="h-full bg-blue-500 shadow-[0_0_10px_#3b82f6]" 
                      style={{ width: `${(model.accuracy || model.confidence) * 100}%` }}
                    />
                  </div>
                  <span className="text-[10px] font-bold text-slate-400 tracking-widest">{((model.accuracy || model.confidence) * 100).toFixed(1)}%</span>
                </div>
              </td>
              {showDetails && (
                <>
                  <td className="py-6 pr-4 text-[10px] text-slate-500 tracking-widest">{((model.precision || model.confidence || model.accuracy) * 100).toFixed(1)}%</td>
                  <td className="py-6 pr-4 text-[10px] text-slate-500 tracking-widest">{((model.recall || model.confidence || model.accuracy) * 100).toFixed(1)}%</td>
                  <td className="py-6 pr-4 text-[10px] text-slate-500 tracking-widest">{((model.f1 || model.confidence || model.accuracy) * 100).toFixed(1)}%</td>
                </>
              )}
              <td className="py-6">
                <span className={`px-3 py-1 border text-[8px] font-bold tracking-[0.2em] rounded-md ${
                  model.accuracy > 0.9 ? 'border-emerald-500/30 text-emerald-500' : 'border-blue-500/30 text-blue-400'
                }`}>
                  {model.accuracy > 0.9 ? 'OPTIMIZED' : 'TRAINED'}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
