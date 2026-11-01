import React, { useState } from 'react';
import { X, Trash2, Wand2, Copy, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import { datasetsApi } from '../services/api';

export default function DataCleaner({ isOpen, onClose, dataset, columns, onDatasetUpdated }) {
  const [activeTab, setActiveTab] = useState('impute'); // 'impute', 'duplicates', 'drop'
  const [selectedColumn, setSelectedColumn] = useState('');
  const [strategy, setStrategy] = useState('median');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  if (!isOpen || !dataset) return null;

  const handleAction = async (actionPayload) => {
    setLoading(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const res = await datasetsApi.clean(dataset.id, actionPayload);
      setSuccessMsg(res.data.message);
      onDatasetUpdated(res.data.dataset);
      setTimeout(() => {
        setSuccessMsg(null);
      }, 3000);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to clean dataset.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center space-x-2">
            <Wand2 className="w-5 h-5 text-indigo-400" />
            <h3 className="text-base font-bold text-white">Data Quality & Remediation</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-slate-800 bg-slate-950/40 px-6 pt-2">
          <button
            onClick={() => setActiveTab('impute')}
            className={`pb-3 px-3 text-xs font-semibold border-b-2 transition ${
              activeTab === 'impute'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Impute Missing Values
          </button>
          <button
            onClick={() => setActiveTab('duplicates')}
            className={`pb-3 px-3 text-xs font-semibold border-b-2 transition ${
              activeTab === 'duplicates'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Deduplication ({dataset.duplicate_rows_count || 0})
          </button>
          <button
            onClick={() => setActiveTab('drop')}
            className={`pb-3 px-3 text-xs font-semibold border-b-2 transition ${
              activeTab === 'drop'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Drop Incomplete Rows
          </button>
        </div>

        {/* Tab Contents */}
        <div className="p-6">
          {error && (
            <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center space-x-2">
              <CheckCircle className="w-4 h-4 flex-shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {activeTab === 'impute' && (
            <div className="space-y-4">
              <p className="text-xs text-slate-300">
                Replace missing values with statistically computed approximations so no records are discarded.
              </p>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5">Target Column</label>
                <select
                  value={selectedColumn}
                  onChange={(e) => setSelectedColumn(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="">All Columns with Missing Values</option>
                  {columns
                    .filter((c) => (c.missing_count || 0) > 0)
                    .map((c) => (
                      <option key={c.column_name} value={c.column_name}>
                        {c.column_name} ({c.missing_count} missing, {c.data_type})
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5">Imputation Strategy</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'median', label: 'Median', desc: 'Best for skewed numeric data' },
                    { id: 'mean', label: 'Mean', desc: 'Average for symmetric numbers' },
                    { id: 'mode', label: 'Mode', desc: 'Most frequent category/value' },
                    { id: 'zero', label: 'Zero / Constant', desc: 'Fill with 0' }
                  ].map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => setStrategy(s.id)}
                      className={`p-2.5 rounded-xl text-left border transition ${
                        strategy === s.id
                          ? 'bg-indigo-600/20 border-indigo-500 text-white'
                          : 'bg-slate-800/60 border-slate-700/60 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <p className="text-xs font-bold">{s.label}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">{s.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={() => handleAction({ action: 'impute', column: selectedColumn || undefined, strategy })}
                disabled={loading}
                className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold text-xs transition flex items-center justify-center space-x-2"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
                <span>Execute Imputation</span>
              </button>
            </div>
          )}

          {activeTab === 'duplicates' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-purple-500/10 border border-purple-500/20">
                <div className="flex items-center space-x-2 text-purple-300 font-bold text-sm">
                  <Copy className="w-4 h-4" />
                  <span>Detected Duplicates: {dataset.duplicate_rows_count || 0}</span>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  Rows having identical values across every column will be consolidated into a single record.
                </p>
              </div>

              <button
                onClick={() => handleAction({ action: 'drop_duplicates' })}
                disabled={loading || (dataset.duplicate_rows_count || 0) === 0}
                className="w-full py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-semibold text-xs transition flex items-center justify-center space-x-2"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                <span>Remove All Duplicate Rows</span>
              </button>
            </div>
          )}

          {activeTab === 'drop' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20">
                <p className="text-xs font-semibold text-red-300">Caution: Irreversible Row Removal</p>
                <p className="text-xs text-slate-400 mt-1">
                  This will discard every row that has any blank, NA, or null values.
                </p>
              </div>

              <button
                onClick={() => handleAction({ action: 'drop_missing' })}
                disabled={loading || (dataset.missing_cells_count || 0) === 0}
                className="w-full py-2.5 rounded-xl bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white font-semibold text-xs transition flex items-center justify-center space-x-2"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                <span>Drop Rows with Missing Values</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
