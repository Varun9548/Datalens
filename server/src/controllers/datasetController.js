const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const path = require('path');
const Papa = require('papaparse');
const { query } = require('../config/database');
const { validateCsvContent } = require('../services/csvValidator');
const { parseAndAnalyzeCsv } = require('../services/csvParser');

// Ingest and persist parsed dataset
const persistDataset = async (userId, originalFilename, csvString) => {
  const analysis = parseAndAnalyzeCsv(csvString, originalFilename);
  const datasetId = uuidv4();
  const datasetName = originalFilename.replace(/\.csv$/i, '');
  const fileSize = Buffer.byteLength(csvString, 'utf8');

  // Insert dataset
  await query(
    `INSERT INTO datasets (
      id, user_id, name, original_filename, file_size, row_count, column_count,
      missing_cells_count, missing_percentage, duplicate_rows_count, raw_data
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
    [
      datasetId,
      userId,
      datasetName,
      originalFilename,
      fileSize,
      analysis.rowCount,
      analysis.columnCount,
      analysis.missingCellsCount,
      analysis.missingPercentage,
      analysis.duplicateRowsCount,
      JSON.stringify(analysis.rows)
    ]
  );

  // Insert columns
  for (const col of analysis.columns) {
    const colId = uuidv4();
    await query(
      `INSERT INTO dataset_columns (
        id, dataset_id, column_name, data_type, missing_count, unique_count, stats, order_index
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        colId,
        datasetId,
        col.column_name,
        col.data_type,
        col.missing_count,
        col.unique_count,
        JSON.stringify(col.stats),
        col.order_index
      ]
    );
  }

  // Insert analysis results
  const analysisId = uuidv4();
  await query(
    `INSERT INTO analysis_results (
      id, dataset_id, user_id, kpis, charts_config
    ) VALUES ($1, $2, $3, $4, $5)`,
    [
      analysisId,
      datasetId,
      userId,
      JSON.stringify(analysis.kpis),
      JSON.stringify(analysis.charts)
    ]
  );

  return {
    id: datasetId,
    name: datasetName,
    original_filename: originalFilename,
    file_size: fileSize,
    row_count: analysis.rowCount,
    column_count: analysis.columnCount,
    missing_cells_count: analysis.missingCellsCount,
    missing_percentage: analysis.missingPercentage,
    duplicate_rows_count: analysis.duplicateRowsCount,
    columns: analysis.columns,
    kpis: analysis.kpis,
    charts: analysis.charts,
    previewRows: analysis.rows.slice(0, 25),
    headers: analysis.headers
  };
};

// Upload handler
const uploadDataset = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Please select a CSV file to upload.' });
    }

    const csvContent = req.file.buffer.toString('utf8');
    const validation = validateCsvContent(csvContent, req.file.originalname, req.file.size);

    if (!validation.isValid) {
      return res.status(400).json({
        error: 'Validation failed.',
        errors: validation.errors,
        warnings: validation.warnings
      });
    }

    const userId = req.user?.id || 'demo-user-id';
    const dataset = await persistDataset(userId, req.file.originalname, csvContent);

    res.status(201).json({
      message: 'CSV uploaded and analyzed successfully',
      dataset,
      warnings: validation.warnings
    });
  } catch (err) {
    console.error('[DatasetController.uploadDataset] Error:', err);
    res.status(500).json({ error: 'Failed to upload and parse CSV: ' + err.message });
  }
};

// Load bundled sample dataset (sales.csv)
const loadSampleDataset = async (req, res) => {
  try {
    const samplePath = path.resolve(__dirname, '../../samples/sales.csv');
    if (!fs.existsSync(samplePath)) {
      return res.status(404).json({ error: 'Sample dataset file not found.' });
    }

    const csvContent = fs.readFileSync(samplePath, 'utf8');
    const userId = req.user?.id || 'demo-user-id';
    const dataset = await persistDataset(userId, 'sales.csv', csvContent);

    res.status(201).json({
      message: 'Sample sales.csv loaded and analyzed successfully',
      dataset
    });
  } catch (err) {
    console.error('[DatasetController.loadSampleDataset] Error:', err);
    res.status(500).json({ error: 'Failed to load sample dataset: ' + err.message });
  }
};

// List user datasets (History)
const listDatasets = async (req, res) => {
  try {
    const userId = req.user?.id || 'demo-user-id';
    const result = await query(
      `SELECT id, name, original_filename, file_size, row_count, column_count,
              missing_cells_count, missing_percentage, duplicate_rows_count, created_at, updated_at
       FROM datasets
       WHERE user_id = $1
       ORDER BY created_at DESC`,
      [userId]
    );

    res.json({ datasets: result.rows });
  } catch (err) {
    console.error('[DatasetController.listDatasets] Error:', err);
    res.status(500).json({ error: 'Failed to retrieve datasets history.' });
  }
};

// Get single dataset with columns, analysis, and paginated rows
const getDatasetById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id || 'demo-user-id';

    const dsRes = await query('SELECT * FROM datasets WHERE id = $1 AND user_id = $2', [id, userId]);
    if (dsRes.rows.length === 0) {
      return res.status(404).json({ error: 'Dataset not found.' });
    }

    const dataset = dsRes.rows[0];
    const columnsRes = await query(
      'SELECT * FROM dataset_columns WHERE dataset_id = $1 ORDER BY order_index ASC',
      [id]
    );

    const columns = columnsRes.rows.map(col => ({
      ...col,
      stats: col.stats ? JSON.parse(col.stats) : null
    }));

    const analysisRes = await query('SELECT * FROM analysis_results WHERE dataset_id = $1', [id]);
    let kpis = null;
    let charts = [];
    if (analysisRes.rows.length > 0) {
      kpis = analysisRes.rows[0].kpis ? JSON.parse(analysisRes.rows[0].kpis) : null;
      charts = analysisRes.rows[0].charts_config ? JSON.parse(analysisRes.rows[0].charts_config) : [];
    }

    const allRows = dataset.raw_data ? JSON.parse(dataset.raw_data) : [];
    const headers = columns.map(c => c.column_name);

    // Support filtering, searching, and pagination
    let filteredRows = [...allRows];
    const search = req.query.search ? String(req.query.search).trim().toLowerCase() : '';
    if (search) {
      filteredRows = filteredRows.filter(row =>
        Object.values(row).some(val => String(val).toLowerCase().includes(search))
      );
    }

    // Column-level filters
    if (req.query.filters) {
      try {
        const colFilters = typeof req.query.filters === 'string' ? JSON.parse(req.query.filters) : req.query.filters;
        Object.entries(colFilters).forEach(([col, filterVal]) => {
          if (filterVal === undefined || filterVal === null || filterVal === '') return;
          if (typeof filterVal === 'object') {
            if (filterVal.min !== undefined && filterVal.min !== '') {
              filteredRows = filteredRows.filter(r => {
                const n = Number(String(r[col] || '').replace(/^[₹$€£¥]\s?/, '').replace(/,/g, ''));
                return !isNaN(n) && n >= Number(filterVal.min);
              });
            }
            if (filterVal.max !== undefined && filterVal.max !== '') {
              filteredRows = filteredRows.filter(r => {
                const n = Number(String(r[col] || '').replace(/^[₹$€£¥]\s?/, '').replace(/,/g, ''));
                return !isNaN(n) && n <= Number(filterVal.max);
              });
            }
          } else {
            const strVal = String(filterVal).trim().toLowerCase();
            filteredRows = filteredRows.filter(r => {
              const cellVal = String(r[col] || '').trim().toLowerCase();
              return cellVal === strVal || cellVal.includes(strVal);
            });
          }
        });
      } catch (e) {
        console.warn('Failed to parse column filters:', e.message);
      }
    }

    // Sort
    const sortCol = req.query.sortCol;
    const sortDir = req.query.sortDir === 'desc' ? -1 : 1;
    if (sortCol) {
      filteredRows.sort((a, b) => {
        const valA = a[sortCol];
        const valB = b[sortCol];
        if (valA === valB) return 0;
        if (valA === null || valA === undefined) return 1;
        if (valB === null || valB === undefined) return -1;
        const numA = Number(String(valA).replace(/^[₹$€£¥]\s?/, '').replace(/,/g, ''));
        const numB = Number(String(valB).replace(/^[₹$€£¥]\s?/, '').replace(/,/g, ''));
        if (!isNaN(numA) && !isNaN(numB)) {
          return (numA - numB) * sortDir;
        }
        return String(valA).localeCompare(String(valB)) * sortDir;
      });
    }

    const page = parseInt(req.query.page || '1', 10);
    const limit = parseInt(req.query.limit || '25', 10);
    const startIndex = (page - 1) * limit;
    const paginatedRows = filteredRows.slice(startIndex, startIndex + limit);

    res.json({
      dataset: {
        id: dataset.id,
        name: dataset.name,
        original_filename: dataset.original_filename,
        file_size: dataset.file_size,
        row_count: dataset.row_count,
        column_count: dataset.column_count,
        missing_cells_count: dataset.missing_cells_count,
        missing_percentage: dataset.missing_percentage,
        duplicate_rows_count: dataset.duplicate_rows_count,
        created_at: dataset.created_at,
        updated_at: dataset.updated_at
      },
      columns,
      kpis,
      charts,
      headers,
      pagination: {
        totalRows: filteredRows.length,
        totalPages: Math.ceil(filteredRows.length / limit) || 1,
        currentPage: page,
        limit
      },
      rows: paginatedRows
    });
  } catch (err) {
    console.error('[DatasetController.getDatasetById] Error:', err);
    res.status(500).json({ error: 'Failed to fetch dataset details.' });
  }
};

// Data Cleaning & Remediation
const cleanDataset = async (req, res) => {
  try {
    const { id } = req.params;
    const { action, column, strategy } = req.body; // action: 'drop_missing', 'drop_duplicates', 'impute'
    const userId = req.user?.id || 'demo-user-id';

    const dsRes = await query('SELECT * FROM datasets WHERE id = $1 AND user_id = $2', [id, userId]);
    if (dsRes.rows.length === 0) {
      return res.status(404).json({ error: 'Dataset not found.' });
    }

    const dataset = dsRes.rows[0];
    let rows = dataset.raw_data ? JSON.parse(dataset.raw_data) : [];
    if (rows.length === 0) {
      return res.status(400).json({ error: 'Dataset is empty.' });
    }

    const columnsRes = await query('SELECT * FROM dataset_columns WHERE dataset_id = $1 ORDER BY order_index ASC', [id]);
    const columns = columnsRes.rows.map(c => ({ ...c, stats: c.stats ? JSON.parse(c.stats) : null }));
    const headers = columns.map(c => c.column_name);

    if (action === 'drop_missing') {
      const beforeCount = rows.length;
      rows = rows.filter(row => {
        return headers.every(h => {
          const val = row[h];
          return val !== null && val !== undefined && String(val).trim() !== '' && String(val).toLowerCase() !== 'na' && String(val).toLowerCase() !== 'null';
        });
      });
      console.log(`[Clean] Dropped ${beforeCount - rows.length} rows with missing values.`);
    } else if (action === 'drop_duplicates') {
      const beforeCount = rows.length;
      const seen = new Set();
      const uniqueRows = [];
      rows.forEach(r => {
        const hash = headers.map(h => String(r[h] ?? '')).join('|||');
        if (!seen.has(hash)) {
          seen.add(hash);
          uniqueRows.push(r);
        }
      });
      rows = uniqueRows;
      console.log(`[Clean] Dropped ${beforeCount - rows.length} duplicate rows.`);
    } else if (action === 'impute') {
      // Impute missing values for specific column or all columns
      const targetColumns = column ? [column] : headers;

      targetColumns.forEach(targetCol => {
        const colMeta = columns.find(c => c.column_name === targetCol);
        if (!colMeta) return;

        let fillValue = null;
        if (strategy === 'mean' && colMeta.stats && colMeta.stats.mean !== undefined) {
          fillValue = String(colMeta.stats.mean);
        } else if (strategy === 'median' && colMeta.stats && colMeta.stats.median !== undefined) {
          fillValue = String(colMeta.stats.median);
        } else if (strategy === 'mode' && colMeta.stats && colMeta.stats.mode !== null) {
          fillValue = String(colMeta.stats.mode);
        } else if (strategy === 'zero') {
          fillValue = '0';
        } else if (strategy === 'unknown') {
          fillValue = 'Unknown';
        } else {
          // Default fallback
          if (colMeta.data_type === 'number' || colMeta.data_type === 'decimal') {
            fillValue = colMeta.stats?.median !== undefined ? String(colMeta.stats.median) : '0';
          } else {
            fillValue = colMeta.stats?.mode || 'Unknown';
          }
        }

        rows.forEach(row => {
          const val = row[targetCol];
          if (val === null || val === undefined || String(val).trim() === '' || String(val).toLowerCase() === 'na' || String(val).toLowerCase() === 'null') {
            row[targetCol] = fillValue;
          }
        });
      });
    } else {
      return res.status(400).json({ error: 'Invalid cleaning action. Supported: drop_missing, drop_duplicates, impute' });
    }

    // Convert updated rows back to CSV string and re-analyze
    const csvString = Papa.unparse(rows);
    const analysis = parseAndAnalyzeCsv(csvString, dataset.original_filename);

    // Update datasets table
    await query(
      `UPDATE datasets
       SET row_count = $1, column_count = $2, missing_cells_count = $3,
           missing_percentage = $4, duplicate_rows_count = $5, raw_data = $6, updated_at = CURRENT_TIMESTAMP
       WHERE id = $7`,
      [
        analysis.rowCount,
        analysis.columnCount,
        analysis.missingCellsCount,
        analysis.missingPercentage,
        analysis.duplicateRowsCount,
        JSON.stringify(analysis.rows),
        id
      ]
    );

    // Delete existing columns and insert recalculated columns
    await query('DELETE FROM dataset_columns WHERE dataset_id = $1', [id]);
    for (const col of analysis.columns) {
      const colId = uuidv4();
      await query(
        `INSERT INTO dataset_columns (
          id, dataset_id, column_name, data_type, missing_count, unique_count, stats, order_index
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [
          colId,
          id,
          col.column_name,
          col.data_type,
          col.missing_count,
          col.unique_count,
          JSON.stringify(col.stats),
          col.order_index
        ]
      );
    }

    // Update analysis results
    await query(
      `UPDATE analysis_results
       SET kpis = $1, charts_config = $2
       WHERE dataset_id = $3`,
      [
        JSON.stringify(analysis.kpis),
        JSON.stringify(analysis.charts),
        id
      ]
    );

    res.json({
      message: 'Dataset cleaned and re-analyzed successfully',
      dataset: {
        id,
        name: dataset.name,
        original_filename: dataset.original_filename,
        row_count: analysis.rowCount,
        column_count: analysis.columnCount,
        missing_cells_count: analysis.missingCellsCount,
        missing_percentage: analysis.missingPercentage,
        duplicate_rows_count: analysis.duplicateRowsCount,
        columns: analysis.columns,
        kpis: analysis.kpis,
        charts: analysis.charts,
        previewRows: analysis.rows.slice(0, 25),
        headers: analysis.headers
      }
    });
  } catch (err) {
    console.error('[DatasetController.cleanDataset] Error:', err);
    res.status(500).json({ error: 'Failed to clean dataset: ' + err.message });
  }
};

// Delete dataset
const deleteDataset = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id || 'demo-user-id';

    await query('DELETE FROM analysis_results WHERE dataset_id = $1', [id]);
    await query('DELETE FROM dataset_columns WHERE dataset_id = $1', [id]);
    const result = await query('DELETE FROM datasets WHERE id = $1 AND user_id = $2', [id, userId]);

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Dataset not found or already deleted.' });
    }

    res.json({ message: 'Dataset deleted successfully', id });
  } catch (err) {
    console.error('[DatasetController.deleteDataset] Error:', err);
    res.status(500).json({ error: 'Failed to delete dataset.' });
  }
};

// Export cleaned/current CSV
const exportDatasetCsv = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id || 'demo-user-id';

    const dsRes = await query('SELECT name, original_filename, raw_data FROM datasets WHERE id = $1 AND user_id = $2', [id, userId]);
    if (dsRes.rows.length === 0) {
      return res.status(404).json({ error: 'Dataset not found.' });
    }

    const { name, original_filename, raw_data } = dsRes.rows[0];
    const rows = raw_data ? JSON.parse(raw_data) : [];
    const csvOutput = Papa.unparse(rows);

    const downloadName = `${name}_cleaned.csv`;
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${downloadName}"`);
    res.send(csvOutput);
  } catch (err) {
    console.error('[DatasetController.exportDatasetCsv] Error:', err);
    res.status(500).json({ error: 'Failed to export CSV.' });
  }
};

module.exports = {
  uploadDataset,
  loadSampleDataset,
  listDatasets,
  getDatasetById,
  cleanDataset,
  deleteDataset,
  exportDatasetCsv
};
