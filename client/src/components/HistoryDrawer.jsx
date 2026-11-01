import React from 'react';
import { X, History, Trash2, ExternalLink, Calendar, Database, Layers } from 'lucide-react';
import { datasetsApi } from '../services/api';

export default function HistoryDrawer({
  isOpen,
  onClose,
  datasets = [],
  currentDatasetId,
  onSelectDataset,
  onDatasetDeleted
}) {
  if (!isOpen) return null;

  const handleDelete = async (e, id) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this dataset from history?')) {
      try {
        await datasetsApi.delete(id);
        onDatasetDeleted(id);
      } catch (err) {
        alert('Failed to delete dataset: ' + (err.response?.data?.error || err.message));
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-slate-900 border-l border-slate-800 shadow-2xl flex flex-col">
          {/* Header */}
          <div className="p-6 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <History className="w-5 h-5 text-indigo-400" />
              <h2 className="text-lg font-bold text-white">Upload History</h2>
            </div>
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Dataset list */}
          <div className="flex-1 overflow-y-auto p-6 space-y-3.5">
            {datasets.length === 0 ? (
              <div className="text-center py-12 text-slate-500 text-sm">
                <Database className="w-10 h-10 mx-auto mb-2 opacity-30" />
                No datasets in history yet. Upload a CSV or load the sample dataset to get started!
              </div>
            ) : (
              datasets.map((ds) => {
                const isActive = ds.id === currentDatasetId;
                return (
                  <div
                    key={ds.id}
                    onClick={() => {
                      onSelectDataset(ds.id);
                      onClose();
                    }}
                    className={`p-4 rounded-xl border cursor-pointer transition ${
                      isActive
                        ? 'bg-indigo-600/15 border-indigo-500 shadow-md shadow-indigo-600/10'
                        : 'bg-slate-800/50 hover:bg-slate-800/80 border-slate-700/60'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="font-bold text-sm text-white truncate max-w-[240px]">
                        {ds.name || ds.original_filename}
                      </h4>
                      <button
                        onClick={(e) => handleDelete(e, ds.id)}
                        className="text-slate-500 hover:text-red-400 transition p-1"
                        title="Delete dataset"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-2 mt-3 text-xs text-slate-400">
                      <div className="flex items-center space-x-1.5">
                        <Layers className="w-3.5 h-3.5 text-slate-500" />
                        <span>{(ds.row_count || 0).toLocaleString()} rows • {ds.column_count || 0} cols</span>
                      </div>
                      <div className="flex items-center space-x-1.5">
                        <Calendar className="w-3.5 h-3.5 text-slate-500" />
                        <span>{new Date(ds.created_at || Date.now()).toLocaleDateString()}</span>
                      </div>
                    </div>

                    <div className="mt-2.5 flex items-center justify-between text-[11px]">
                      <span className="text-slate-500">
                        Missing: <span className="text-slate-300 font-semibold">{ds.missing_percentage || 0}%</span>
                      </span>
                      {isActive ? (
                        <span className="text-indigo-400 font-bold uppercase tracking-wider">Active</span>
                      ) : (
                        <span className="text-indigo-400 hover:underline flex items-center space-x-0.5">
                          <span>Switch to dashboard</span>
                          <ExternalLink className="w-3 h-3" />
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
