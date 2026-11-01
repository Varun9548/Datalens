/**
 * Type Detector for CSV Columns
 * Identifies: number, decimal, categorical, text, date/time, boolean
 */

const isBooleanValue = (val) => {
  if (val === null || val === undefined || val === '') return false;
  const str = String(val).trim().toLowerCase();
  return ['true', 'false', 'yes', 'no', 't', 'f', 'y', 'n'].includes(str);
};

const isDateValue = (val) => {
  if (!val || typeof val !== 'string') return false;
  const s = val.trim();
  if (s.length < 6 || s.length > 35) return false;
  
  // Strict check for common date patterns:
  // 1. YYYY-MM-DD or YYYY/MM/DD or YYYY.MM.DD (with optional time)
  // 2. DD-MM-YYYY or DD/MM/YYYY
  // 3. MM/DD/YYYY
  // 4. ISO strings (e.g. 2025-05-12T10:00:00Z)
  const isIsoOrStandard = /^\d{4}[-/.]\d{1,2}[-/.]\d{1,2}/.test(s);
  const isDayFirstOrMonthFirst = /^\d{1,2}[-/.]\d{1,2}[-/.]\d{2,4}/.test(s);
  const isNamedMonth = /^(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]* \d{1,2},? \d{4}/i.test(s);

  if (!isIsoOrStandard && !isDayFirstOrMonthFirst && !isNamedMonth) {
    return false;
  }

  const parsed = Date.parse(s);
  return !isNaN(parsed);
};

const cleanNumeric = (val) => {
  if (val === null || val === undefined) return NaN;
  let str = String(val).trim();
  // Remove currency signs (₹, $, €, £, ¥), thousands separators (,), and percent (%)
  str = str.replace(/^[₹$€£¥]\s?/, '').replace(/,/g, '').replace(/%$/, '').trim();
  if (str === '') return NaN;
  const num = Number(str);
  return num;
};

const detectColumnType = (columnName, sampleValues) => {
  const nonNulls = sampleValues
    .map(v => (v !== null && v !== undefined ? String(v).trim() : ''))
    .filter(v => v !== '');

  if (nonNulls.length === 0) {
    return 'text';
  }

  // Check for Boolean
  const boolMatches = nonNulls.filter(isBooleanValue).length;
  if (boolMatches / nonNulls.length >= 0.9) {
    return 'boolean';
  }

  // Check for Date/Time
  const dateMatches = nonNulls.filter(isDateValue).length;
  if (dateMatches / nonNulls.length >= 0.8) {
    return 'date/time';
  }

  // Check for Number / Decimal
  const numericCount = nonNulls.filter(v => !isNaN(cleanNumeric(v))).length;
  if (numericCount / nonNulls.length >= 0.85) {
    const hasDecimals = nonNulls.some(v => {
      const num = cleanNumeric(v);
      return !isNaN(num) && !Number.isInteger(num);
    });
    return hasDecimals ? 'decimal' : 'number';
  }

  // Categorical vs Text check
  const uniqueCount = new Set(nonNulls).size;
  const ratio = uniqueCount / nonNulls.length;

  if (uniqueCount <= 30 || ratio <= 0.25) {
    return 'categorical';
  }

  return 'text';
};

module.exports = {
  detectColumnType,
  cleanNumeric,
  isDateValue,
  isBooleanValue
};
