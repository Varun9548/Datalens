import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid
} from 'recharts';
import { Sliders, RefreshCw, BarChart2 } from 'lucide-react';

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#06b6d4', '#f97316'];

export default function ChartCustomizer({ columns = [], rows = [] }) {
  const numericCols = useMemo(
    () => columns.filter((c) => c.data_type === 'number' || c.data_type === 'decimal'),
    [columns]
  );
  const groupableCols = useMemo(
    () => columns.filter((c) => c.data_type === 'categorical' || c.data_type === 'date/time' || c.data_type === 'text'),
    [columns]
  );

  const [chartType, setChartType] = useState('bar');
  const [xAxisCol, setXAxisCol] = useState(groupableCols[0]?.column_name || columns[0]?.column_name || '');
  const [yAxisCol, setYAxisCol] = useState(numericCols[0]?.column_name || '');
  const [aggregation, setAggregation] = useState('sum'); // sum, avg, count, max, min

  // Calculate customized chart data
  const customData = useMemo(() => {
    if (!xAxisCol || rows.length === 0) return [];

    const grouped = {};
    const countMap = {};

    rows.forEach((row) => {
      const key = String(row[xAxisCol] || 'Unassigned');
      let val = 0;
      if (yAxisCol) {
        let rawVal = row[yAxisCol];
        if (typeof rawVal === 'string') {
          rawVal = Number(rawVal.replace(/^[₹$€£¥]\s?/, '').replace(/,/g, '').replace(/%$/, ''));
        }
        val = !isNaN(rawVal) && rawVal !== null ? Number(rawVal) : 0;
      }

      if (!grouped[key]) {
        grouped[key] = aggregation === 'min' ? val : (aggregation === 'max' ? val : val);
        countMap[key] = 1;
      } else {
        countMap[key]++;
        if (aggregation === 'sum' || aggregation === 'avg') {
          grouped[key] += val;
        } else if (aggregation === 'max') {
          grouped[key] = Math.max(grouped[key], val);
        } else if (aggregation === 'min') {
          grouped[key] = Math.min(grouped[key], val);
        } else if (aggregation === 'count') {
          grouped[key] = countMap[key];
        }
      }
    });

    if (aggregation === 'avg') {
      Object.keys(grouped).forEach((k) => {
        grouped[k] = Number((grouped[k] / countMap[k]).toFixed(2));
      });
    }

    return Object.entries(grouped)
      .map(([name, value]) => ({ name, value: Number(value.toFixed(2)) }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 15);
  }, [rows, xAxisCol, yAxisCol, aggregation]);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Sliders className="w-5 h-5 text-indigo-400" />
          <h3 className="text-base font-bold text-white">Interactive Custom Chart Studio</h3>
        </div>
        <span className="text-xs text-slate-400">Compose on the fly</span>
      </div>

      {/* Control Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-950/60 p-3 rounded-xl border border-slate-800">
        <div>
          <label className="block text-[11px] font-semibold text-slate-400 mb-1">Chart Type</label>
          <select
            value={chartType}
            onChange={(e) => setChartType(e.target.value)}
            className="w-full px-2.5 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white focus:outline-none"
          >
            <option value="bar">Bar Chart</option>
            <option value="line">Line Chart</option>
            <option value="area">Area Chart</option>
            <option value="pie">Donut / Pie</option>
          </select>
        </div>

        <div>
          <label className="block text-[11px] font-semibold text-slate-400 mb-1">X-Axis (Group By)</label>
          <select
            value={xAxisCol}
            onChange={(e) => setXAxisCol(e.target.value)}
            className="w-full px-2.5 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white focus:outline-none"
          >
            {columns.map((c) => (
              <option key={c.column_name} value={c.column_name}>
                {c.column_name} ({c.data_type})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-[11px] font-semibold text-slate-400 mb-1">Y-Axis (Metric)</label>
          <select
            value={yAxisCol}
            onChange={(e) => setYAxisCol(e.target.value)}
            className="w-full px-2.5 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white focus:outline-none"
          >
            {numericCols.map((c) => (
              <option key={c.column_name} value={c.column_name}>
                {c.column_name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-[11px] font-semibold text-slate-400 mb-1">Aggregation</label>
          <select
            value={aggregation}
            onChange={(e) => setAggregation(e.target.value)}
            className="w-full px-2.5 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white focus:outline-none"
          >
            <option value="sum">Sum</option>
            <option value="avg">Average</option>
            <option value="count">Count Records</option>
            <option value="max">Maximum</option>
            <option value="min">Minimum</option>
          </select>
        </div>
      </div>

      {/* Dynamic Chart Display */}
      <div className="h-72 w-full pt-2">
        <ResponsiveContainer width="100%" height="100%">
          {chartType === 'bar' && (
            <BarChart data={customData} margin={{ top: 10, right: 10, left: 0, bottom: 25 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
              <XAxis dataKey="name" stroke="#64748b" tick={{ fill: '#94a3b8', fontSize: 10 }} angle={-25} textAnchor="end" />
              <YAxis stroke="#64748b" tick={{ fill: '#94a3b8', fontSize: 10 }} />
              <Tooltip
                contentStyle={{ backgroundColor: '#020617', borderColor: '#334155', borderRadius: '0.75rem', fontSize: '12px' }}
              />
              <Bar dataKey="value" fill="#818cf8" radius={[4, 4, 0, 0]} />
            </BarChart>
          )}

          {chartType === 'line' && (
            <LineChart data={customData} margin={{ top: 10, right: 10, left: 0, bottom: 25 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
              <XAxis dataKey="name" stroke="#64748b" tick={{ fill: '#94a3b8', fontSize: 10 }} angle={-25} textAnchor="end" />
              <YAxis stroke="#64748b" tick={{ fill: '#94a3b8', fontSize: 10 }} />
              <Tooltip
                contentStyle={{ backgroundColor: '#020617', borderColor: '#334155', borderRadius: '0.75rem', fontSize: '12px' }}
              />
              <Line type="monotone" dataKey="value" stroke="#38bdf8" strokeWidth={2.5} />
            </LineChart>
          )}

          {chartType === 'area' && (
            <AreaChart data={customData} margin={{ top: 10, right: 10, left: 0, bottom: 25 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
              <XAxis dataKey="name" stroke="#64748b" tick={{ fill: '#94a3b8', fontSize: 10 }} angle={-25} textAnchor="end" />
              <YAxis stroke="#64748b" tick={{ fill: '#94a3b8', fontSize: 10 }} />
              <Tooltip
                contentStyle={{ backgroundColor: '#020617', borderColor: '#334155', borderRadius: '0.75rem', fontSize: '12px' }}
              />
              <Area type="monotone" dataKey="value" stroke="#c084fc" fill="#c084fc" fillOpacity={0.25} />
            </AreaChart>
          )}

          {chartType === 'pie' && (
            <PieChart>
              <Pie
                data={customData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={95}
                innerRadius={50}
                paddingAngle={3}
                label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
              >
                {customData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ backgroundColor: '#020617', borderColor: '#334155', borderRadius: '0.75rem', fontSize: '12px' }}
              />
            </PieChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  );
}
