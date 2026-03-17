import React, { useEffect, useState } from 'react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend
} from 'recharts';

export default function DiffusionChart({ height = 350, data }: { height?: number, data?: any[] }) {
  const [localData, setLocalData] = useState<any[]>(data || []);

  useEffect(() => {
    if (data) {
      setLocalData(data);
    } else {
      fetch('/api/analytics/diffusion')
        .then(res => res.json())
        .then(setLocalData);
    }
  }, [data]);

  return (
    <div style={{ width: '100%', height }}>
      <ResponsiveContainer>
        <AreaChart data={localData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="colorReach" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2}/>
              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
            </linearGradient>
            <linearGradient id="colorDepth" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
              <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
            </linearGradient>
            <linearGradient id="colorVelocity" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.2}/>
              <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
          <XAxis 
            dataKey="time" 
            axisLine={false} 
            tickLine={false} 
            tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10, letterSpacing: '0.1em' }}
            dy={15}
          />
          <YAxis 
            axisLine={false} 
            tickLine={false} 
            tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10 }}
          />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: '#0F172A', 
              borderRadius: '12px', 
              border: '1px solid rgba(255,255,255,0.1)', 
              boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
              fontSize: '10px',
              textTransform: 'uppercase',
              letterSpacing: '0.1em'
            }} 
          />
          <Legend 
            verticalAlign="top" 
            height={48} 
            iconType="circle"
            wrapperStyle={{ 
              fontSize: '10px', 
              textTransform: 'uppercase', 
              letterSpacing: '0.2em',
              paddingBottom: '20px'
            }}
          />
          <Area 
            type="monotone" 
            dataKey="reach" 
            name="Total Reach"
            stroke="#3b82f6" 
            strokeWidth={2}
            fillOpacity={1} 
            fill="url(#colorReach)" 
          />
          <Area 
            type="monotone" 
            dataKey="depth" 
            name="Propagation Depth"
            stroke="#10b981" 
            strokeWidth={2}
            fillOpacity={1} 
            fill="url(#colorDepth)" 
          />
          <Area 
            type="monotone" 
            dataKey="velocity" 
            name="Spread Velocity/Hr"
            stroke="#8b5cf6" 
            strokeWidth={2}
            fillOpacity={1} 
            fill="url(#colorVelocity)" 
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
