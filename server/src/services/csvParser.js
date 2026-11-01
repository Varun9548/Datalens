const Papa = require('papaparse');
const { detectColumnType, cleanNumeric } = require('./typeDetector');
const { calculateColumnStats } = require('./statsEngine');
const { recommendCharts } = require('./chartRecommender');

const parseAndAnalyzeCsv = (csvString, filename) => {
  // Strip BOM if present
  const cleanCsv = csvString.replace(/^\uFEFF/, '');

  const parseResult = Papa.parse(cleanCsv, {
    header: true,
    skipEmptyLines: 'greedy',
    dynamicTyping: false // keep raw strings for reliable type detection & currency cleaning
  });

  if (parseResult.errors && parseResult.errors.length > 0) {
    console.warn('[PapaParse] Warnings/errors during parsing:', parseResult.errors.slice(0, 5));
  }

  const rawHeaders = parseResult.meta.fields || [];
  // Ensure headers are unique and non-empty
  const headers = [];
  const headerCount = {};
  rawHeaders.forEach((h, idx) => {
    let cleanHeader = (h || '').trim();
    if (!cleanHeader) cleanHeader = `Column_${idx + 1}`;
    if (headerCount[cleanHeader]) {
      headerCount[cleanHeader]++;
      cleanHeader = `${cleanHeader}_${headerCount[cleanHeader]}`;
    } else {
      headerCount[cleanHeader] = 1;
    }
    headers.push(cleanHeader);
  });

  const rows = parseResult.data || [];
  const rowCount = rows.length;
  const columnCount = headers.length;

  // Detect duplicate rows
  const rowHashes = new Set();
  let duplicateRowsCount = 0;
  rows.forEach(r => {
    const serialized = headers.map(h => String(r[h] ?? '')).join('|||');
    if (rowHashes.has(serialized)) {
      duplicateRowsCount++;
    } else {
      rowHashes.add(serialized);
    }
  });

  // Calculate missing cells and column statistics
  let totalMissingCells = 0;
  const totalCells = rowCount * columnCount;

  const columnAnalysis = headers.map((colName, index) => {
    const values = rows.map(r => r[colName]);
    const sampleValues = values.slice(0, 1000); // representative sample
    const detectedType = detectColumnType(colName, sampleValues);
    const stats = calculateColumnStats(colName, values, detectedType);

    totalMissingCells += stats.missingCount;

    return {
      order_index: index,
      column_name: colName,
      data_type: detectedType,
      missing_count: stats.missingCount,
      unique_count: stats.uniqueCount,
      stats
    };
  });

  const missingPercentage = totalCells > 0 ? Number(((totalMissingCells / totalCells) * 100).toFixed(2)) : 0;

  // Find primary revenue/amount/metric column for executive KPIs
  const numericColumns = columnAnalysis.filter(c => c.data_type === 'number' || c.data_type === 'decimal');
  const revenuePriorities = ['revenue', 'sales', 'turnover', 'amount', 'total', 'profit', 'price', 'income'];
  let revenueCol = null;

  for (const prio of revenuePriorities) {
    revenueCol = numericColumns.find(c => c.column_name.toLowerCase().includes(prio));
    if (revenueCol) break;
  }
  if (!revenueCol && numericColumns.length > 0) {
    revenueCol = numericColumns[0];
  }

  let primaryMetricKPI = null;
  if (revenueCol && revenueCol.stats) {
    const s = revenueCol.stats;
    primaryMetricKPI = {
      columnName: revenueCol.column_name,
      average: s.mean,
      maximum: s.max,
      minimum: s.min,
      range: s.range,
      stdDev: s.stdDev,
      median: s.median,
      sum: Number((s.mean * s.validCount).toFixed(2))
    };
  }

  const kpis = {
    rowCount,
    columnCount,
    missingCellsCount: totalMissingCells,
    missingPercentage,
    duplicateRowsCount,
    primaryMetric: primaryMetricKPI
  };

  const charts = recommendCharts(columnAnalysis, rows);

  return {
    headers,
    rows,
    rowCount,
    columnCount,
    missingCellsCount: totalMissingCells,
    missingPercentage,
    duplicateRowsCount,
    columns: columnAnalysis,
    kpis,
    charts
  };
};

module.exports = {
  parseAndAnalyzeCsv
};
