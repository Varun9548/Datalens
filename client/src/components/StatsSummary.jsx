import React, { useState } from 'react';
import { Table, Search, Info } from 'lucide-react';

export default function StatsSummary({ columns = [] }) {
  const [filterText, setFilterText] = useState('');

  const filteredColumns = columns.filter((c) =>
    c.column_name.toLowerCase().includes(filterText.toLowerCase()) ||
    c.data_type.toLowerCase().includes(filterText.toLowerCase())
  );

  const getBadgeClass = (type) => {
    switch (type) {
      case 'number':
        return 'badge-number';
      case 'decimal':
        return 'badge-decimal';
      case 'categorical':
        return 'badge-categorical';
      case 'date/time':
        return 'badge-datetime';
      case 'boolean':
        return 'badge-boolean';
      default:
        return 'badge-text';
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center space-x-2">
          <Table className="w-5 h-5 text-indigo-400" />
          <h2 className="text-lg font-bold text-white">Statistical Analysis & Column Summary</h2>
        </div>

        {/* Filter input */}
        <div className="relative max-w-xs w-full">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
          <input
            type="text"
            value={filterText}
            onChange={(e) => setFilterText(e.target.value)}
            placeholder="Filter columns or types..."
            className="w-full pl-9 pr-3 py-1.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
          />
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-800/80">
        <table className="w-full text-left text-xs border-collapse">
          <thead className="bg-slate-950/80 text-slate-400 font-bold uppercase tracking-wider border-b border-slate-800">
            <tr>
              <th className="py-3 px-3.5">Column</th>
              <th className="py-3 px-3.5">Type</th>
              <th className="py-3 px-3.5">Missing</th>
              <th className="py-3 px-3.5">Unique</th>
              <th className="py-3 px-3.5">Mean / Mode</th>
              <th className="py-3 px-3.5">Median</th>
              <th className="py-3 px-3.5">Min - Max</th>
              <th className="py-3 px-3.5">Std Dev</th>
              <th className="py-3 px-3.5">Q1 / Q3 (IQR)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
            {filteredColumns.map((col, idx) => {
              const s = col.stats || {};
              const isNumeric = col.data_type === 'number' || col.data_type === 'decimal';

              return (
                <tr key={idx} className="hover:bg-slate-800/40 transition">
                  <td className="py-3 px-3.5 font-sans font-semibold text-slate-200">
                    {col.column_name}
                  </td>
                  <td className="py-3 px-3.5 font-sans">
                    <span
                      className={`text-[9px] px-2 py-0.5 rounded font-bold uppercase tracking-wider ${getBadgeClass(
                        col.data_type
                      )}`}
                    >
                      {col.data_type}
                    </span>
                  </td>
                  <td className="py-3 px-3.5 text-slate-300">
                    <span className={col.missing_count > 0 ? 'text-amber-400 font-semibold' : 'text-slate-400'}>
                      {col.missing_count || 0}
                    </span>{' '}
                    <span className="text-[10px] text-slate-500">
                      ({s.missingPercentage || 0}%)
                    </span>
                  </td>
                  <td className="py-3 px-3.5 text-slate-300">
                    {(col.unique_count || 0).toLocaleString()}
                  </td>
                  <td className="py-3 px-3.5 text-slate-300">
                    {isNumeric ? (
                      s.mean !== undefined ? Number(s.mean).toLocaleString() : '-'
                    ) : (
                      <span className="font-sans text-xs text-indigo-300 truncate max-w-[120px] inline-block">
                        {s.mode || '-'}
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-3.5 text-slate-300">
                    {isNumeric && s.median !== undefined ? Number(s.median).toLocaleString() : '-'}
                  </td>
                  <td className="py-3 px-3.5 text-slate-300">
                    {isNumeric && s.min !== undefined && s.max !== undefined ? (
                      `${Number(s.min).toLocaleString()} → ${Number(s.max).toLocaleString()}`
                    ) : (
                      '-'
                    )}
                  </td>
                  <td className="py-3 px-3.5 text-slate-300">
                    {isNumeric && s.stdDev !== undefined ? Number(s.stdDev).toLocaleString() : '-'}
                  </td>
                  <td className="py-3 px-3.5 text-slate-400 text-[10px]">
                    {isNumeric && s.percentiles ? (
                      `${s.percentiles.p25} / ${s.percentiles.p75}`
                    ) : (
                      '-'
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
