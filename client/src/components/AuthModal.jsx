import React, { useState, useEffect } from 'react';
import { X, Lock, Mail, User, Sparkles, Users, CheckCircle2, ShieldCheck, Database } from 'lucide-react';
import { authApi } from '../services/api';

export default function AuthModal({ isOpen, onClose, onAuthSuccess }) {
  const [activeTab, setActiveTab] = useState('login'); // 'login', 'signup', 'accounts'
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [registeredUsers, setRegisteredUsers] = useState([]);

  useEffect(() => {
    if (isOpen) {
      authApi.getUsers()
        .then((res) => setRegisteredUsers(res.data.users || []))
        .catch(() => {});
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      let res;
      if (activeTab === 'login') {
        res = await authApi.login({ email, password });
      } else {
        res = await authApi.register({ name, email, password });
      }

      localStorage.setItem('datalens_token', res.data.token);
      onAuthSuccess(res.data.user);
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || 'Authentication failed. Please check credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = async (targetEmail, targetPass) => {
    setLoading(true);
    setError(null);
    try {
      const res = await authApi.login({
        email: targetEmail,
        password: targetPass
      });
      localStorage.setItem('datalens_token', res.data.token);
      onAuthSuccess(res.data.user);
      onClose();
    } catch (err) {
      setError(`Login failed for ${targetEmail}.`);
    } finally {
      setLoading(false);
    }
  };

  const quickAccounts = [
    { label: 'Demo Analyst', email: 'demo@datalens.local', pass: 'demopass123', role: 'Analyst' },
    { label: 'Varun Gupta', email: 'varun@datalens.local', pass: 'varun123', role: 'Owner' },
    { label: 'Administrator', email: 'admin@datalens.local', pass: 'admin123', role: 'Admin' },
    { label: 'Data Scientist', email: 'analyst@datalens.local', pass: 'analyst123', role: 'Scientist' }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 pt-5 pb-3 flex items-center justify-between border-b border-slate-800">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Users className="w-5 h-5 text-indigo-400" />
              {activeTab === 'login' ? 'Sign In to DataLens' : activeTab === 'signup' ? 'Create New Account' : 'Registered People & Accounts'}
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Secure authentication with bcrypt hashing & JWT sessions
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-800 bg-slate-950/40 px-6 pt-2">
          <button
            onClick={() => { setActiveTab('login'); setError(null); }}
            className={`pb-2.5 px-3 text-xs font-semibold border-b-2 transition ${
              activeTab === 'login' ? 'border-indigo-500 text-indigo-400' : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Sign In
          </button>
          <button
            onClick={() => { setActiveTab('signup'); setError(null); }}
            className={`pb-2.5 px-3 text-xs font-semibold border-b-2 transition ${
              activeTab === 'signup' ? 'border-indigo-500 text-indigo-400' : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Create Account (Sign Up)
          </button>
          <button
            onClick={() => { setActiveTab('accounts'); setError(null); }}
            className={`pb-2.5 px-3 text-xs font-semibold border-b-2 transition ${
              activeTab === 'accounts' ? 'border-indigo-500 text-indigo-400' : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            All Accounts ({registeredUsers.length})
          </button>
        </div>

        <div className="p-6">
          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-xs">
              {error}
            </div>
          )}

          {activeTab === 'accounts' ? (
            <div className="space-y-4">
              <p className="text-xs text-slate-300">
                People who have registered accounts in the database:
              </p>
              <div className="max-h-64 overflow-y-auto space-y-2 pr-1">
                {registeredUsers.map((u) => (
                  <div
                    key={u.id}
                    className="p-3 bg-slate-800/60 border border-slate-700/60 rounded-xl flex items-center justify-between"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 rounded-full bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-xs font-bold text-indigo-300">
                        {u.name ? u.name[0].toUpperCase() : 'U'}
                      </div>
                      <div>
                        <p className="text-xs font-bold text-white">{u.name}</p>
                        <p className="text-[11px] text-slate-400">{u.email}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-700 text-slate-300">
                        {u.dataset_count || 0} datasets
                      </span>
                    </div>
                  </div>
                ))}
              </div>
              <button
                type="button"
                onClick={() => setActiveTab('signup')}
                className="w-full py-2 px-3 text-xs font-semibold bg-indigo-600/30 hover:bg-indigo-600/40 border border-indigo-500/40 text-indigo-300 rounded-xl transition"
              >
                + Register Another Person
              </button>
            </div>
          ) : (
            <>
              {/* Quick 1-Click Login Chips */}
              <div className="mb-5">
                <p className="text-[11px] font-semibold text-slate-400 mb-2 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                  <span>1-Click Instant Sign In as:</span>
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {quickAccounts.map((acc) => (
                    <button
                      key={acc.email}
                      type="button"
                      onClick={() => handleQuickLogin(acc.email, acc.pass)}
                      disabled={loading}
                      className="p-2 rounded-xl bg-slate-800/80 hover:bg-indigo-900/30 border border-slate-700 hover:border-indigo-500/50 text-left transition text-xs"
                    >
                      <div className="font-semibold text-white flex items-center justify-between">
                        <span>{acc.label}</span>
                        <span className="text-[9px] px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-300">{acc.role}</span>
                      </div>
                      <div className="text-[10px] text-slate-400 truncate mt-0.5">{acc.email}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-800" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-slate-900 px-3 text-slate-500">
                    {activeTab === 'login' ? 'Or enter credentials' : 'Fill account details'}
                  </span>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-3.5">
                {activeTab === 'signup' && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Full Name</label>
                    <div className="relative">
                      <User className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                      <input
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="e.g. Varun Gupta"
                        className="w-full pl-9 pr-4 py-2 bg-slate-800/80 border border-slate-700/80 rounded-xl text-sm text-white focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Email Address</label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="person@datalens.local"
                      className="w-full pl-9 pr-4 py-2 bg-slate-800/80 border border-slate-700/80 rounded-xl text-sm text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Password</label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                    <input
                      type="password"
                      required
                      minLength={6}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="At least 6 characters"
                      className="w-full pl-9 pr-4 py-2 bg-slate-800/80 border border-slate-700/80 rounded-xl text-sm text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold text-sm transition shadow-lg shadow-indigo-600/20"
                >
                  {loading ? 'Processing...' : activeTab === 'login' ? 'Sign In' : 'Create Account'}
                </button>
              </form>

              <div className="mt-4 text-center">
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab(activeTab === 'login' ? 'signup' : 'login');
                    setError(null);
                  }}
                  className="text-xs text-indigo-400 hover:text-indigo-300"
                >
                  {activeTab === 'login' ? "Don't have an account? Sign Up" : 'Already have an account? Sign In'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
