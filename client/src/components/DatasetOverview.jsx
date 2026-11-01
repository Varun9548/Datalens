import React from 'react';
import {
  FileText,
  Layers,
  AlertTriangle,
  Copy,
  TrendingUp,
  Download,
  FileDown,
  Wand2,
  CheckCircle,
  IndianRupee
} from 'lucide-react';

export default function DatasetOverview({
  dataset,
  kpis,
  onOpenCleaner,
  onExportPdf,
  onExportCsv
}) {
  if (!dataset) return null;

  const pm = kpis?.primaryMetric;
  const isRevenueOrCurrency = pm?.columnName?.toLowerCase().includes('revenue') ||
                              pm?.columnName?.toLowerCase().includes('sales') ||
                              pm?.columnName?.toLowerCase().includes('price');

  const formatVal = (num) => {
    if (num === null || num === undefined || isNaN(num)) return 'N/A';
    if (isRevenueOrCurrency) {
      return `₹${Math.round(num).toLocaleString('en-IN')}`;
    }
    return Number(num).toLocaleString();
  };

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/60 p-4 sm:p-5 rounded-2xl border border-slate-800">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              Active Dataset
            </span>
            <span className="text-xs text-slate-400">
              Uploaded on {new Date(dataset.created_at || Date.now()).toLocaleDateString()}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white mt-1">
            {dataset.name || dataset.original_filename}
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Data Cleaner trigger */}
          <button
            onClick={onOpenCleaner}
            className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/40 text-indigo-300 hover:text-white text-xs sm:text-sm font-semibold transition"
          >
            <Wand2 className="w-4 h-4 text-indigo-400" />
            <span>Clean & Impute</span>
          </button>

          {/* Export CSV */}
          <button
            onClick={onExportCsv}
            className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs sm:text-sm font-medium transition"
          >
            <Download className="w-4 h-4 text-emerald-400" />
            <span>Export CSV</span>
          </button>

          {/* Export PDF Report */}
          <button
            onClick={onExportPdf}
            className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs sm:text-sm font-medium transition"
          >
            <FileDown className="w-4 h-4 text-purple-400" />
            <span>PDF Report</span>
          </button>
        </div>
      </div>

      {/* Primary KPI Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Rows */}
        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-center space-x-3.5 shadow-sm">
          <div className="w-11 h-11 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-medium">Total Rows</p>
            <p className="text-xl font-bold text-white">
              {(dataset.row_count || 0).toLocaleString()}
            </p>
          </div>
        </div>

        {/* Columns */}
        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-center space-x-3.5 shadow-sm">
          <div className="w-11 h-11 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-medium">Total Columns</p>
            <p className="text-xl font-bold text-white">
              {dataset.column_count || 0}
            </p>
          </div>
        </div>

        {/* Missing Values */}
        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-center space-x-3.5 shadow-sm">
          <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${
            (dataset.missing_percentage || 0) > 5
              ? 'bg-amber-500/10 text-amber-400'
              : 'bg-emerald-500/10 text-emerald-400'
          }`}>
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-medium">Missing Values</p>
            <p className="text-xl font-bold text-white">
              {dataset.missing_percentage || 0}%
            </p>
            <p className="text-[10px] text-slate-500">
              {dataset.missing_cells_count || 0} cells
            </p>
          </div>
        </div>

        {/* Duplicate Records */}
        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-center space-x-3.5 shadow-sm">
          <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${
            (dataset.duplicate_rows_count || 0) > 0
              ? 'bg-purple-500/10 text-purple-400'
              : 'bg-emerald-500/10 text-emerald-400'
          }`}>
            <Copy className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-medium">Duplicate Rows</p>
            <p className="text-xl font-bold text-white">
              {(dataset.duplicate_rows_count || 0).toLocaleString()}
            </p>
            <p className="text-[10px] text-slate-500">
              {dataset.duplicate_rows_count > 0 ? 'Remediation available' : 'Clean & Unique'}
            </p>
          </div>
        </div>
      </div>

      {/* Key Metric Spotlight Card (e.g. Revenue: Average ₹12,430, Max ₹98,000, Min ₹1,200) */}
      {pm && (
        <div className="p-5 rounded-2xl bg-gradient-to-br from-indigo-950/40 via-slate-900/80 to-purple-950/30 border border-indigo-500/20 shadow-lg">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
            <div className="flex items-center space-x-2">
              <TrendingUp className="w-5 h-5 text-indigo-400" />
              <h3 className="text-base font-bold text-white">
                Primary Metric Spotlight: <span className="text-indigo-300">{pm.columnName}</span>
              </h3>
            </div>
            <span className="text-xs text-indigo-400 font-semibold px-2 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/20">
              Auto-Calculated Statistics
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 pt-4">
            <div className="bg-slate-800/40 p-3 rounded-xl border border-slate-700/40">
              <p className="text-xs text-slate-400 font-medium">Average / Mean</p>
              <p className="text-lg font-bold text-white mt-0.5">{formatVal(pm.average)}</p>
            </div>
            <div className="bg-slate-800/40 p-3 rounded-xl border border-slate-700/40">
              <p className="text-xs text-slate-400 font-medium">Maximum</p>
              <p className="text-lg font-bold text-emerald-400 mt-0.5">{formatVal(pm.maximum)}</p>
            </div>
            <div className="bg-slate-800/40 p-3 rounded-xl border border-slate-700/40">
              <p className="text-xs text-slate-400 font-medium">Minimum</p>
              <p className="text-lg font-bold text-amber-400 mt-0.5">{formatVal(pm.minimum)}</p>
            </div>
            <div className="bg-slate-800/40 p-3 rounded-xl border border-slate-700/40">
              <p className="text-xs text-slate-400 font-medium">Median</p>
              <p className="text-lg font-bold text-indigo-300 mt-0.5">{formatVal(pm.median)}</p>
            </div>
            <div className="bg-slate-800/40 p-3 rounded-xl border border-slate-700/40">
              <p className="text-xs text-slate-400 font-medium">Std Deviation</p>
              <p className="text-lg font-bold text-purple-300 mt-0.5">{formatVal(pm.stdDev)}</p>
            </div>
            <div className="bg-slate-800/40 p-3 rounded-xl border border-slate-700/40">
              <p className="text-xs text-slate-400 font-medium">Range</p>
              <p className="text-lg font-bold text-slate-200 mt-0.5">{formatVal(pm.range)}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
