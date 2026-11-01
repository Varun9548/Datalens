import React from 'react';
import { BarChart3, Database, History, User, LogOut, Sparkles } from 'lucide-react';

export default function Navbar({ user, onOpenAuth, onLogout, onToggleHistory, datasetCount }) {
  return (
    <header className="border-b border-slate-800/80 bg-slate-950/70 backdrop-blur-md sticky top-0 z-30 px-4 sm:px-6 py-3.5">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-purple-500 flex items-center justify-center shadow-lg shadow-indigo-500/20 ring-1 ring-white/20">
            <BarChart3 className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
                DataLens
              </span>
              <span className="text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                100% Free & Local
              </span>
            </div>
            <p className="text-xs text-slate-400">CSV Upload → Interactive Analytics Engine</p>
          </div>
        </div>

        {/* Actions & User */}
        <div className="flex items-center space-x-3">
          {/* History Button */}
          <button
            onClick={onToggleHistory}
            className="flex items-center space-x-2 px-3.5 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700/80 text-slate-200 text-sm font-medium transition border border-slate-700/60"
            title="View upload history"
          >
            <History className="w-4 h-4 text-indigo-400" />
            <span className="hidden sm:inline">History</span>
            {datasetCount > 0 && (
              <span className="bg-indigo-500/30 text-indigo-300 text-xs px-1.5 py-0.5 rounded-full font-semibold">
                {datasetCount}
              </span>
            )}
          </button>

          {/* User Auth Section */}
          {user ? (
            <div className="flex items-center space-x-2 bg-slate-800/60 border border-slate-700/60 pl-3 pr-2 py-1.5 rounded-lg">
              <div className="w-6 h-6 rounded-full bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-xs font-bold text-indigo-300">
                {user.name ? user.name[0].toUpperCase() : 'U'}
              </div>
              <span className="text-xs font-medium text-slate-200 hidden md:inline max-w-[120px] truncate">
                {user.name}
              </span>
              <button
                onClick={onLogout}
                className="p-1 hover:text-red-400 text-slate-400 transition ml-1"
                title="Sign out"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              onClick={onOpenAuth}
              className="flex items-center space-x-2 px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold shadow-md shadow-indigo-600/20 transition"
            >
              <User className="w-4 h-4" />
              <span>Sign In / Demo</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
