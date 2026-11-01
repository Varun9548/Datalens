import React, { useState, useMemo } from 'react';
import {
  Search,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Eye,
  EyeOff,
  Filter,
  CheckSquare,
  Square
} from 'lucide-react';

export default function DataTable({
  rows = [],
  columns = [],
  headers = [],
  pagination = {},
  onPageChange,
  onLimitChange,
  onSearchChange,
  onSortChange,
  onFilterChange,
  sortCol,
  sortDir
}) {
  const [searchInput, setSearchInput] = useState('');
  const [visibleColumns, setVisibleColumns] = useState(() =>
    headers.reduce((acc, h) => {
      acc[h] = true;
      return acc;
    }, {})
  );
  const [showColPicker, setShowColPicker] = useState(false);

  // Sync visible columns when headers change
  React.useEffect(() => {
    setVisibleColumns((prev) => {
      const next = { ...prev };
      headers.forEach((h) => {
        if (next[h] === undefined) next[h] = true;
      });
      return next;
    });
  }, [headers]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    onSearchChange(searchInput);
  };

  const toggleColumn = (colName) => {
    setVisibleColumns((prev) => ({
      ...prev,
      [colName]: !prev[colName]
    }));
  };

  const toggleAllColumns = (selectAll) => {
    const next = {};
    headers.forEach((h) => {
      next[h] = selectAll;
    });
    setVisibleColumns(next);
  };

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

  const displayedHeaders = headers.filter((h) => visibleColumns[h] !== false);

  const [showFilters, setShowFilters] = useState(false);
  const [columnFilters, setColumnFilters] = useState({});

  const handleColumnFilterChange = (colName, val) => {
    const nextFilters = { ...columnFilters, [colName]: val };
    if (!val) {
      delete nextFilters[colName];
    }
    setColumnFilters(nextFilters);
    if (onFilterChange) {
      onFilterChange(nextFilters);
    }
  };

  const clearAllFilters = () => {
    setColumnFilters({});
    if (onFilterChange) {
      onFilterChange({});
    }
  };

  const activeFilterCount = Object.keys(columnFilters).length;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
      {/* Top Bar: Search, Filter Toggle, Column Manager, Rows Per Page */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Search */}
        <form onSubmit={handleSearchSubmit} className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search rows across all columns..."
            className="w-full pl-9 pr-20 py-2 bg-slate-800/90 border border-slate-700/80 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
          <button
            type="submit"
            className="absolute right-1.5 top-1.5 px-2.5 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold"
          >
            Find
          </button>
        </form>

        <div className="flex items-center space-x-2 self-end sm:self-auto">
          {/* Column Filter Toggle */}
          <button
            type="button"
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center space-x-1.5 px-3 py-2 border rounded-xl text-xs font-semibold transition ${
              showFilters || activeFilterCount > 0
                ? 'bg-indigo-600/20 border-indigo-500 text-indigo-300'
                : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-200'
            }`}
          >
            <Filter className="w-3.5 h-3.5" />
            <span>Filters</span>
            {activeFilterCount > 0 && (
              <span className="bg-indigo-500 text-white text-[10px] px-1.5 py-0.2 rounded-full font-bold">
                {activeFilterCount}
              </span>
            )}
          </button>

          {activeFilterCount > 0 && (
            <button
              type="button"
              onClick={clearAllFilters}
              className="px-2.5 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-400 hover:text-white rounded-xl text-xs font-semibold transition"
            >
              Clear
            </button>
          )}

          {/* Column Visibility Selector Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowColPicker(!showColPicker)}
              className="flex items-center space-x-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-xs font-semibold text-slate-200"
            >
              <Eye className="w-3.5 h-3.5 text-indigo-400" />
              <span>Columns ({displayedHeaders.length}/{headers.length})</span>
            </button>

            {showColPicker && (
              <div className="absolute right-0 mt-2 w-64 p-3 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl z-20 max-h-72 overflow-y-auto">
                <div className="flex justify-between items-center pb-2 mb-2 border-b border-slate-800 text-[11px] font-semibold text-slate-400">
                  <span>Toggle Columns</span>
                  <div className="space-x-2">
                    <button
                      type="button"
                      onClick={() => toggleAllColumns(true)}
                      className="text-indigo-400 hover:underline"
                    >
                      All
                    </button>
                    <span>•</span>
                    <button
                      type="button"
                      onClick={() => toggleAllColumns(false)}
                      className="text-slate-400 hover:underline"
                    >
                      None
                    </button>
                  </div>
                </div>
                <div className="space-y-1.5">
                  {headers.map((h) => (
                    <label
                      key={h}
                      className="flex items-center space-x-2 text-xs text-slate-300 hover:text-white cursor-pointer select-none"
                    >
                      <input
                        type="checkbox"
                        checked={visibleColumns[h] !== false}
                        onChange={() => toggleColumn(h)}
                        className="rounded bg-slate-800 border-slate-700 text-indigo-600 focus:ring-0"
                      />
                      <span className="truncate">{h}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Rows per page */}
          <select
            value={pagination.limit || 25}
            onChange={(e) => onLimitChange(Number(e.target.value))}
            className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs font-semibold text-slate-200 focus:outline-none"
          >
            <option value="10">10 / page</option>
            <option value="25">25 / page</option>
            <option value="50">50 / page</option>
            <option value="100">100 / page</option>
          </select>
        </div>
      </div>

      {/* Table Container */}
      <div className="overflow-x-auto rounded-xl border border-slate-800/90 max-h-[550px] overflow-y-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead className="sticky top-0 bg-slate-950/95 backdrop-blur-sm z-10 border-b border-slate-800">
            <tr>
              <th className="py-3 px-3.5 text-slate-400 font-bold uppercase tracking-wider w-12 text-center">
                #
              </th>
              {displayedHeaders.map((colName) => {
                const colMeta = columns.find((c) => c.column_name === colName);
                const isSorted = sortCol === colName;
                return (
                  <th
                    key={colName}
                    onClick={() => onSortChange(colName)}
                    className="py-3 px-4 text-slate-300 font-semibold cursor-pointer hover:bg-slate-800/60 transition select-none whitespace-nowrap"
                  >
                    <div className="flex items-center space-x-2">
                      <span>{colName}</span>
                      {colMeta && (
                        <span
                          className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider ${getBadgeClass(
                            colMeta.data_type
                          )}`}
                        >
                          {colMeta.data_type}
                        </span>
                      )}
                      <span className="text-slate-500">
                        {isSorted ? (
                          sortDir === 'asc' ? (
                            <ArrowUp className="w-3.5 h-3.5 text-indigo-400" />
                          ) : (
                            <ArrowDown className="w-3.5 h-3.5 text-indigo-400" />
                          )
                        ) : (
                          <ArrowUpDown className="w-3 h-3 opacity-40 hover:opacity-100" />
                        )}
                      </span>
                    </div>
                  </th>
                );
              })}
            </tr>
            {showFilters && (
              <tr className="bg-slate-950/80 border-b border-slate-800">
                <th className="py-2 px-2 text-center text-[10px] text-slate-500 font-normal">
                  Filter:
                </th>
                {displayedHeaders.map((colName) => {
                  const colMeta = columns.find((c) => c.column_name === colName);
                  const isCat = colMeta?.data_type === 'categorical';
                  const topValues = colMeta?.stats?.topValues || [];

                  return (
                    <th key={`filter-${colName}`} className="py-2 px-3 font-normal">
                      {isCat && topValues.length > 0 ? (
                        <select
                          value={columnFilters[colName] || ''}
                          onChange={(e) => handleColumnFilterChange(colName, e.target.value)}
                          className="w-full bg-slate-900 border border-slate-700/80 rounded px-2 py-1 text-[11px] text-white focus:outline-none focus:border-indigo-500"
                        >
                          <option value="">All {colName}</option>
                          {topValues.map((tv) => (
                            <option key={tv.value} value={tv.value}>
                              {tv.value} ({tv.count})
                            </option>
                          ))}
                        </select>
                      ) : (
                        <input
                          type="text"
                          placeholder={`Filter ${colName}...`}
                          value={columnFilters[colName] || ''}
                          onChange={(e) => handleColumnFilterChange(colName, e.target.value)}
                          className="w-full bg-slate-900 border border-slate-700/80 rounded px-2 py-1 text-[11px] text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500"
                        />
                      )}
                    </th>
                  );
                })}
              </tr>
            )}
          </thead>
          <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
            {rows.length === 0 ? (
              <tr>
                <td
                  colSpan={displayedHeaders.length + 1}
                  className="py-8 text-center text-slate-500 italic"
                >
                  No records found matching query.
                </td>
              </tr>
            ) : (
              rows.map((row, rIdx) => {
                const globalRowNumber = ((pagination.currentPage || 1) - 1) * (pagination.limit || 25) + rIdx + 1;
                return (
                  <tr
                    key={rIdx}
                    className="hover:bg-indigo-950/20 transition duration-75 group"
                  >
                    <td className="py-2.5 px-3 text-center text-slate-500 group-hover:text-slate-400 font-sans text-xs">
                      {globalRowNumber}
                    </td>
                    {displayedHeaders.map((h) => {
                      const val = row[h];
                      const isMissing =
                        val === null ||
                        val === undefined ||
                        String(val).trim() === '' ||
                        String(val).toLowerCase() === 'na' ||
                        String(val).toLowerCase() === 'null';

                      return (
                        <td
                          key={h}
                          className={`py-2.5 px-4 whitespace-nowrap ${
                            isMissing
                              ? 'text-red-400/70 italic bg-red-500/5'
                              : 'text-slate-300'
                          }`}
                        >
                          {isMissing ? '<empty>' : String(val)}
                        </td>
                      );
                    })}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 text-xs text-slate-400">
        <div>
          Showing{' '}
          <span className="font-bold text-white">
            {rows.length > 0 ? ((pagination.currentPage - 1) * pagination.limit + 1) : 0}
          </span>{' '}
          to{' '}
          <span className="font-bold text-white">
            {Math.min(pagination.currentPage * pagination.limit, pagination.totalRows || 0)}
          </span>{' '}
          of <span className="font-bold text-white">{(pagination.totalRows || 0).toLocaleString()}</span> records
        </div>

        <div className="flex items-center space-x-1.5">
          <button
            onClick={() => onPageChange(pagination.currentPage - 1)}
            disabled={pagination.currentPage <= 1}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed text-slate-200 transition"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <span className="px-3 py-1 font-semibold text-white bg-slate-800 rounded-lg">
            Page {pagination.currentPage} of {pagination.totalPages || 1}
          </span>

          <button
            onClick={() => onPageChange(pagination.currentPage + 1)}
            disabled={pagination.currentPage >= pagination.totalPages}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed text-slate-200 transition"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
