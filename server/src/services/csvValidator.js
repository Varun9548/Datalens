/**
 * CSV Validator
 * Checks file type, size, headers, empty files, and invalid/malformed rows.
 */

const validateCsvContent = (content, originalFilename, fileSize) => {
  const errors = [];
  const warnings = [];

  // Check file size (e.g. max 50MB)
  const MAX_SIZE = 50 * 1024 * 1024;
  if (fileSize > MAX_SIZE) {
    errors.push(`File size (${(fileSize / (1024 * 1024)).toFixed(2)} MB) exceeds the 50MB limit.`);
  }

  // Check extension
  if (originalFilename && !originalFilename.toLowerCase().endsWith('.csv')) {
    errors.push('Uploaded file must be a .csv file.');
  }

  // Check empty content
  if (!content || typeof content !== 'string' || content.trim().length === 0) {
    errors.push('The uploaded CSV file is completely empty.');
    return { isValid: false, errors, warnings };
  }

  // Split lines
  const lines = content.split(/\r?\n/).filter(line => line.trim() !== '');
  if (lines.length < 2) {
    errors.push('CSV must contain a header row and at least one data row.');
    return { isValid: false, errors, warnings };
  }

  // Check header line
  const headerLine = lines[0];
  const headers = headerLine.split(',').map(h => h.trim().replace(/^["']|["']$/g, ''));
  
  if (headers.length === 0 || headers.every(h => h === '')) {
    errors.push('CSV headers could not be found or all header names are empty.');
  }

  const emptyHeaderIndices = [];
  headers.forEach((h, idx) => {
    if (!h) emptyHeaderIndices.push(idx + 1);
  });
  if (emptyHeaderIndices.length > 0) {
    warnings.push(`Columns at positions [${emptyHeaderIndices.join(', ')}] have empty headers and will be auto-named.`);
  }

  // Check for duplicate header names
  const seenHeaders = new Set();
  const dupes = [];
  headers.forEach(h => {
    if (h) {
      if (seenHeaders.has(h.toLowerCase())) dupes.push(h);
      seenHeaders.add(h.toLowerCase());
    }
  });
  if (dupes.length > 0) {
    warnings.push(`Duplicate column headers detected: ${dupes.join(', ')}. They will be renamed uniquely.`);
  }

  // Check for malformed rows sample
  let malformedCount = 0;
  const expectedColCount = headers.length;
  // Inspect first 200 rows for integrity
  const sampleLimit = Math.min(lines.length, 200);
  for (let i = 1; i < sampleLimit; i++) {
    // Rough estimate (allowing quotes with commas)
    const line = lines[i];
    // Check unclosed quotes
    const quoteCount = (line.match(/"/g) || []).length;
    if (quoteCount % 2 !== 0) {
      malformedCount++;
    }
  }

  if (malformedCount > 0) {
    warnings.push(`Detected approximately ${malformedCount} potentially malformed rows with unbalanced quotes.`);
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    lineCount: lines.length,
    headerCount: headers.length
  };
};

module.exports = {
  validateCsvContent
};
