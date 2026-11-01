import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid
} from 'recharts';
import { BarChart3, LineChart as LineIcon, PieChart as PieIcon, Activity } from 'lucide-react';

const COLORS = [
  '#6366f1', // Indigo
  '#10b981', // Emerald
  '#f59e0b', // Amber
  '#ec4899', // Pink
  '#8b5cf6', // Purple
  '#06b6d4', // Cyan
  '#f97316'  // Orange
];

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-950 border border-slate-700 p-2.5 rounded-xl shadow-2xl text-xs">
        <p className="font-bold text-white mb-1">{label || payload[0].payload.name || payload[0].payload.date || 'Value'}</p>
        {payload.map((entry, index) => (
          <p key={index} style={{ color: entry.color || '#818cf8' }}>
            <span className="font-semibold">{entry.name || 'Metric'}: </span>
            {typeof entry.value === 'number' ? entry.value.toLocaleString() : entry.value}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export default function ChartGallery({ charts = [] }) {
  if (!charts || charts.length === 0) {
    return (
      <div className="p-8 text-center bg-slate-900 border border-slate-800 rounded-2xl text-slate-500">
        No automated charts available for this dataset schema.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-2">
        <BarChart3 className="w-5 h-5 text-indigo-400" />
        <h2 className="text-lg font-bold text-white">Automated Interactive Visualizations</h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {charts.map((chart) => {
          return (
            <div
              key={chart.id}
              className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col justify-between"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-white tracking-wide">{chart.title}</h3>
                <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  {chart.type}
                </span>
              </div>

              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  {chart.type === 'bar' && (
                    <BarChart data={chart.data} margin={{ top: 10, right: 10, left: 0, bottom: 25 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                      <XAxis
                        dataKey={chart.xAxis}
                        stroke="#64748b"
                        tick={{ fill: '#94a3b8', fontSize: 10 }}
                        angle={-25}
                        textAnchor="end"
                      />
                      <YAxis stroke="#64748b" tick={{ fill: '#94a3b8', fontSize: 10 }} />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey={chart.yAxis} fill="#6366f1" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  )}

                  {chart.type === 'line' && (
                    <LineChart data={chart.data} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                      <XAxis
                        dataKey={chart.xAxis}
                        stroke="#64748b"
                        tick={{ fill: '#94a3b8', fontSize: 10 }}
                        angle={-20}
                        textAnchor="end"
                      />
                      <YAxis stroke="#64748b" tick={{ fill: '#94a3b8', fontSize: 10 }} />
                      <Tooltip content={<CustomTooltip />} />
                      <Line
                        type="monotone"
                        dataKey={chart.yAxis}
                        stroke="#10b981"
                        strokeWidth={2.5}
                        dot={{ r: 3, fill: '#10b981' }}
                        activeDot={{ r: 5 }}
                      />
                    </LineChart>
                  )}

                  {chart.type === 'pie' && (
                    <PieChart margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                      <Pie
                        data={chart.data}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={85}
                        innerRadius={45}
                        paddingAngle={3}
                        label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                      >
                        {chart.data.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomTooltip />} />
                    </PieChart>
                  )}

                  {chart.type === 'histogram' && (
                    <BarChart data={chart.data} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                      <XAxis
                        dataKey={chart.xAxis}
                        stroke="#64748b"
                        tick={{ fill: '#94a3b8', fontSize: 10 }}
                        angle={-20}
                        textAnchor="end"
                      />
                      <YAxis stroke="#64748b" tick={{ fill: '#94a3b8', fontSize: 10 }} />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey={chart.yAxis} fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  )}

                  {chart.type === 'scatter' && (
                    <ScatterChart margin={{ top: 10, right: 10, left: 0, bottom: 10 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                      <XAxis
                        type="number"
                        dataKey={chart.xAxis}
                        name={chart.xLabel}
                        stroke="#64748b"
                        tick={{ fill: '#94a3b8', fontSize: 10 }}
                      />
                      <YAxis
                        type="number"
                        dataKey={chart.yAxis}
                        name={chart.yLabel}
                        stroke="#64748b"
                        tick={{ fill: '#94a3b8', fontSize: 10 }}
                      />
                      <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                      <Scatter data={chart.data} fill="#ec4899" />
                    </ScatterChart>
                  )}
                </ResponsiveContainer>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
