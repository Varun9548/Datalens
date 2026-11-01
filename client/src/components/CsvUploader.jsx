import React, { useState, useRef } from 'react';
import { UploadCloud, FileSpreadsheet, Sparkles, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { datasetsApi } from '../services/api';

export default function CsvUploader({ onDatasetLoaded }) {
  const [isDragging, setIsDragging] = useState(false);
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState(null);
  const [warnings, setWarnings] = useState([]);
  const fileInputRef = useRef(null);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const validateAndSetFile = (selectedFile) => {
    setError(null);
    setWarnings([]);

    if (!selectedFile) return;

    if (!selectedFile.name.toLowerCase().endsWith('.csv')) {
      setError('Please select a valid .csv file.');
      return;
    }

    if (selectedFile.size > 50 * 1024 * 1024) {
      setError('File exceeds the 50MB limit.');
      return;
    }

    if (selectedFile.size === 0) {
      setError('Selected file is empty (0 bytes).');
      return;
    }

    setFile(selectedFile);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInputChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setUploading(true);
    setError(null);
    setWarnings([]);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await datasetsApi.upload(formData, (progressEvent) => {
        const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        setUploadProgress(percent);
      });

      if (res.data.warnings && res.data.warnings.length > 0) {
        setWarnings(res.data.warnings);
      }

      onDatasetLoaded(res.data.dataset);
      setFile(null);
    } catch (err) {
      const msg = err.response?.data?.error || err.response?.data?.errors?.join(', ') || 'Upload failed.';
      setError(msg);
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleLoadSample = async () => {
    setUploading(true);
    setError(null);
    setWarnings([]);

    try {
      const res = await datasetsApi.loadSample();
      onDatasetLoaded(res.data.dataset);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load sample dataset.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto my-6 p-6 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <UploadCloud className="w-6 h-6 text-indigo-400" />
            Upload CSV for Instant Analysis
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Auto-detects data types, computes statistics, checks missing values, and generates dashboards
          </p>
        </div>

        {/* 1-Click Sample Dataset Button */}
        <button
          type="button"
          onClick={handleLoadSample}
          disabled={uploading}
          className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600/30 to-teal-600/30 hover:from-emerald-600/40 hover:to-teal-600/40 border border-emerald-500/40 text-emerald-300 font-semibold text-xs sm:text-sm transition shadow-sm self-start sm:self-auto"
        >
          <Sparkles className="w-4 h-4 text-emerald-400" />
          <span>Load Sample (sales.csv)</span>
        </button>
      </div>

      {/* Drag & Drop Zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
          isDragging
            ? 'border-indigo-500 bg-indigo-500/10'
            : file
            ? 'border-emerald-500/60 bg-emerald-500/5'
            : 'border-slate-700/80 hover:border-slate-500 hover:bg-slate-800/40'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv"
          onChange={handleFileInputChange}
          className="hidden"
        />

        {file ? (
          <div className="flex flex-col items-center">
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center mb-3">
              <FileSpreadsheet className="w-8 h-8" />
            </div>
            <p className="font-semibold text-white text-base">{file.name}</p>
            <p className="text-xs text-slate-400 mt-1">
              {(file.size / 1024).toFixed(1)} KB • Ready for automated parsing & analytics
            </p>
          </div>
        ) : (
          <div className="flex flex-col items-center">
            <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center mb-3">
              <UploadCloud className="w-8 h-8" />
            </div>
            <p className="font-semibold text-slate-200 text-base">
              Drop your CSV file here or <span className="text-indigo-400 underline">browse</span>
            </p>
            <p className="text-xs text-slate-400 mt-1.5">
              Supports standard comma-separated CSV files up to 50MB (handles ₹, $, €, dates, & percentages)
            </p>
          </div>
        )}
      </div>

      {/* Upload Action Bar */}
      {file && (
        <div className="mt-4 flex items-center justify-between bg-slate-800/60 p-3 rounded-xl border border-slate-700/60">
          <div className="text-xs text-slate-300">
            Selected: <span className="font-semibold text-white">{file.name}</span>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => setFile(null)}
              className="px-3 py-1.5 text-xs text-slate-400 hover:text-white transition"
            >
              Cancel
            </button>
            <button
              onClick={handleUpload}
              disabled={uploading}
              className="px-5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs sm:text-sm flex items-center space-x-2 transition shadow-md shadow-indigo-600/30"
            >
              {uploading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Analyzing ({uploadProgress}%)...</span>
                </>
              ) : (
                <span>Analyze Dataset</span>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Alerts */}
      {error && (
        <div className="mt-4 p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs sm:text-sm flex items-start space-x-2.5">
          <AlertCircle className="w-5 h-5 flex-shrink-0 text-red-400" />
          <div>
            <p className="font-semibold">Upload Error</p>
            <p className="mt-0.5">{error}</p>
          </div>
        </div>
      )}

      {warnings.length > 0 && (
        <div className="mt-4 p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-start space-x-2.5">
          <AlertCircle className="w-5 h-5 flex-shrink-0 text-amber-400" />
          <div>
            <p className="font-semibold">Notice</p>
            <ul className="list-disc list-inside mt-0.5 space-y-0.5">
              {warnings.map((w, idx) => (
                <li key={idx}>{w}</li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
