import React, { useState, useEffect, useCallback } from 'react';
import Navbar from './components/Navbar';
import AuthModal from './components/AuthModal';
import CsvUploader from './components/CsvUploader';
import DatasetOverview from './components/DatasetOverview';
import DataCleaner from './components/DataCleaner';
import DataTable from './components/DataTable';
import ChartGallery from './components/ChartGallery';
import ChartCustomizer from './components/ChartCustomizer';
import StatsSummary from './components/StatsSummary';
import HistoryDrawer from './components/HistoryDrawer';
import { authApi, datasetsApi } from './services/api';
import { exportPdfReport } from './services/exportService';
import {
  LayoutDashboard,
  Table as TableIcon,
  PieChart as ChartIcon,
  Sliders,
  Sparkles,
  Loader2
} from 'lucide-react';

export default function App() {
  const [user, setUser] = useState(null);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isCleanerOpen, setIsCleanerOpen] = useState(false);

  // Active dataset state
  const [dataset, setDataset] = useState(null);
  const [columns, setColumns] = useState([]);
  const [kpis, setKpis] = useState(null);
  const [charts, setCharts] = useState([]);
  const [headers, setHeaders] = useState([]);
  const [rows, setRows] = useState([]);
  const [pagination, setPagination] = useState({ currentPage: 1, limit: 25, totalPages: 1, totalRows: 0 });

  // Table query state
  const [searchQuery, setSearchQuery] = useState('');
  const [sortCol, setSortCol] = useState(null);
  const [sortDir, setSortDir] = useState('asc');
  const [columnFilters, setColumnFilters] = useState({});

  // History datasets list
  const [datasetsList, setDatasetsList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeViewTab, setActiveViewTab] = useState('dashboard'); // 'dashboard', 'table', 'custom_chart', 'stats'

  // Fetch current user & datasets list on mount
  const refreshHistory = useCallback(async () => {
    try {
      const res = await datasetsApi.list();
      setDatasetsList(res.data.datasets || []);
      return res.data.datasets || [];
    } catch (err) {
      console.warn('Failed to load datasets list:', err);
      return [];
    }
  }, []);

  // Fetch single dataset by ID with pagination, search, sorting, and column filters
  const fetchDatasetDetails = useCallback(async (id, page = 1, limit = 25, search = '', sort = null, dir = 'asc', filters = {}) => {
    setLoading(true);
    try {
      const res = await datasetsApi.getById(id, {
        page,
        limit,
        search,
        sortCol: sort,
        sortDir: dir,
        filters: Object.keys(filters).length > 0 ? JSON.stringify(filters) : undefined
      });

      const d = res.data;
      setDataset(d.dataset);
      setColumns(d.columns || []);
      setKpis(d.kpis);
      setCharts(d.charts || []);
      setHeaders(d.headers || []);
      setRows(d.rows || []);
      setPagination(d.pagination || { currentPage: 1, limit: 25, totalPages: 1, totalRows: 0 });
    } catch (err) {
      console.error('Failed to fetch dataset:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('datalens_token');
    if (token) {
      authApi.me()
        .then((res) => setUser(res.data.user))
        .catch(() => localStorage.removeItem('datalens_token'));
    }

    // Load history and automatically select first dataset or load sample
    refreshHistory().then(async (list) => {
      if (list && list.length > 0) {
        fetchDatasetDetails(list[0].id);
      } else {
        // Auto load sample dataset on initial launch for immediate analytics preview
        try {
          const sampleRes = await datasetsApi.loadSample();
          await refreshHistory();
          fetchDatasetDetails(sampleRes.data.dataset.id);
        } catch (e) {
          console.warn('Auto sample load error:', e);
        }
      }
    });
  }, [refreshHistory, fetchDatasetDetails]);

  // Handle pagination & table changes
  const handlePageChange = (newPage) => {
    if (dataset) {
      fetchDatasetDetails(dataset.id, newPage, pagination.limit, searchQuery, sortCol, sortDir, columnFilters);
    }
  };

  const handleLimitChange = (newLimit) => {
    if (dataset) {
      fetchDatasetDetails(dataset.id, 1, newLimit, searchQuery, sortCol, sortDir, columnFilters);
    }
  };

  const handleSearchChange = (query) => {
    setSearchQuery(query);
    if (dataset) {
      fetchDatasetDetails(dataset.id, 1, pagination.limit, query, sortCol, sortDir, columnFilters);
    }
  };

  const handleSortChange = (colName) => {
    const nextDir = sortCol === colName && sortDir === 'asc' ? 'desc' : 'asc';
    setSortCol(colName);
    setSortDir(nextDir);
    if (dataset) {
      fetchDatasetDetails(dataset.id, 1, pagination.limit, searchQuery, colName, nextDir, columnFilters);
    }
  };

  const handleFilterChange = (newFilters) => {
    setColumnFilters(newFilters);
    if (dataset) {
      fetchDatasetDetails(dataset.id, 1, pagination.limit, searchQuery, sortCol, sortDir, newFilters);
    }
  };

  const handleDatasetLoaded = (newDs) => {
    refreshHistory();
    fetchDatasetDetails(newDs.id);
    setActiveViewTab('dashboard');
  };

  const handleDatasetDeleted = (deletedId) => {
    refreshHistory().then((list) => {
      if (dataset?.id === deletedId) {
        if (list.length > 0) {
          fetchDatasetDetails(list[0].id);
        } else {
          setDataset(null);
          setColumns([]);
          setKpis(null);
          setCharts([]);
          setHeaders([]);
          setRows([]);
        }
      }
    });
  };

  const handleExportPdf = () => {
    if (dataset) {
      exportPdfReport(dataset, columns, kpis);
    }
  };

  const handleExportCsv = () => {
    if (dataset) {
      window.open(datasetsApi.getExportUrl(dataset.id), '_blank');
    }
  };

  const handleAuthSuccess = async (u) => {
    setUser(u);
    const list = await refreshHistory();
    if (list && list.length > 0) {
      fetchDatasetDetails(list[0].id);
    } else {
      setDataset(null);
      setColumns([]);
      setKpis(null);
      setCharts([]);
      setHeaders([]);
      setRows([]);
    }
  };

  const handleLogout = async () => {
    localStorage.removeItem('datalens_token');
    setUser(null);
    const list = await refreshHistory();
    if (list && list.length > 0) {
      fetchDatasetDetails(list[0].id);
    } else {
      setDataset(null);
      setColumns([]);
      setKpis(null);
      setCharts([]);
      setHeaders([]);
      setRows([]);
    }
  };

  return (
    <div className="min-h-screen bg-[#090d16] text-slate-100 flex flex-col selection:bg-indigo-500 selection:text-white">
      {/* Top Navigation */}
      <Navbar
        user={user}
        onOpenAuth={() => setIsAuthOpen(true)}
        onLogout={handleLogout}
        onToggleHistory={() => setIsHistoryOpen(true)}
        datasetCount={datasetsList.length}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-8 space-y-8">
        {/* CSV Upload Bar */}
        <CsvUploader onDatasetLoaded={handleDatasetLoaded} />

        {loading && !dataset ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400">
            <Loader2 className="w-10 h-10 animate-spin text-indigo-500 mb-3" />
            <p className="font-semibold text-sm">Processing and generating analytics...</p>
          </div>
        ) : dataset ? (
          <div className="space-y-6">
            {/* Overview & KPI Cards */}
            <DatasetOverview
              dataset={dataset}
              kpis={kpis}
              onOpenCleaner={() => setIsCleanerOpen(true)}
              onExportPdf={handleExportPdf}
              onExportCsv={handleExportCsv}
            />

            {/* Dashboard Tabs */}
            <div className="flex items-center space-x-1 border-b border-slate-800 bg-slate-950/60 p-1.5 rounded-2xl">
              <button
                onClick={() => setActiveViewTab('dashboard')}
                className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition ${
                  activeViewTab === 'dashboard'
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <LayoutDashboard className="w-4 h-4" />
                <span>Dashboard & Charts</span>
              </button>

              <button
                onClick={() => setActiveViewTab('table')}
                className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition ${
                  activeViewTab === 'table'
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <TableIcon className="w-4 h-4" />
                <span>Data Table</span>
              </button>

              <button
                onClick={() => setActiveViewTab('custom_chart')}
                className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition ${
                  activeViewTab === 'custom_chart'
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <Sliders className="w-4 h-4" />
                <span>Custom Chart Studio</span>
              </button>

              <button
                onClick={() => setActiveViewTab('stats')}
                className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition ${
                  activeViewTab === 'stats'
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <ChartIcon className="w-4 h-4" />
                <span>Statistical Summary</span>
              </button>
            </div>

            {/* Active Tab View */}
            <div className="animate-fade-in">
              {activeViewTab === 'dashboard' && (
                <div className="space-y-6">
                  <ChartGallery charts={charts} />
                </div>
              )}

              {activeViewTab === 'table' && (
                <DataTable
                  rows={rows}
                  columns={columns}
                  headers={headers}
                  pagination={pagination}
                  onPageChange={handlePageChange}
                  onLimitChange={handleLimitChange}
                  onSearchChange={handleSearchChange}
                  onSortChange={handleSortChange}
                  onFilterChange={handleFilterChange}
                  sortCol={sortCol}
                  sortDir={sortDir}
                />
              )}

              {activeViewTab === 'custom_chart' && (
                <ChartCustomizer columns={columns} rows={rows} />
              )}

              {activeViewTab === 'stats' && (
                <StatsSummary columns={columns} />
              )}
            </div>
          </div>
        ) : (
          <div className="text-center py-20 bg-slate-900/40 border border-dashed border-slate-800 rounded-3xl p-8">
            <Sparkles className="w-12 h-12 text-indigo-400 mx-auto mb-3 opacity-60" />
            <h3 className="text-xl font-bold text-white">No Dataset Loaded</h3>
            <p className="text-sm text-slate-400 mt-1 max-w-md mx-auto">
              Upload a custom CSV file or click "Load Sample (sales.csv)" above to generate interactive analytics, KPI cards, and charts.
            </p>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950/60 py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>DataLens • Upload CSV → Interactive Analytics</span>
          <span className="text-slate-400">100% Free & Open-Source • No Paid Services Required</span>
        </div>
      </footer>

      {/* Modals & Drawers */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onAuthSuccess={handleAuthSuccess}
      />

      <HistoryDrawer
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        datasets={datasetsList}
        currentDatasetId={dataset?.id}
        onSelectDataset={(id) => fetchDatasetDetails(id)}
        onDatasetDeleted={handleDatasetDeleted}
      />

      <DataCleaner
        isOpen={isCleanerOpen}
        onClose={() => setIsCleanerOpen(false)}
        dataset={dataset}
        columns={columns}
        onDatasetUpdated={(updatedDs) => fetchDatasetDetails(updatedDs.id)}
      />
    </div>
  );
}
