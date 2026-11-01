const { cleanNumeric } = require('./typeDetector');

/**
 * Statistical analysis engine
 */
const calculatePercentile = (sortedArray, p) => {
  if (sortedArray.length === 0) return 0;
  if (p <= 0) return sortedArray[0];
  if (p >= 1) return sortedArray[sortedArray.length - 1];

  const index = (sortedArray.length - 1) * p;
  const lower = Math.floor(index);
  const upper = Math.ceil(index);
  const weight = index - lower;

  if (lower === upper) return sortedArray[lower];
  return sortedArray[lower] * (1 - weight) + sortedArray[upper] * weight;
};

const calculateColumnStats = (columnName, values, dataType) => {
  const totalCount = values.length;
  let missingCount = 0;
  const validValues = [];

  values.forEach(v => {
    if (v === null || v === undefined || String(v).trim() === '' || String(v).toLowerCase() === 'na' || String(v).toLowerCase() === 'null') {
      missingCount++;
    } else {
      validValues.push(v);
    }
  });

  const missingPercentage = totalCount > 0 ? Number(((missingCount / totalCount) * 100).toFixed(2)) : 0;
  const uniqueSet = new Set(validValues.map(v => String(v).trim()));
  const uniqueCount = uniqueSet.size;

  // Frequency distribution for categorical / text / boolean
  const frequencyMap = {};
  validValues.forEach(val => {
    const key = String(val).trim();
    frequencyMap[key] = (frequencyMap[key] || 0) + 1;
  });

  const sortedFrequencies = Object.entries(frequencyMap)
    .map(([val, freq]) => ({
      value: val,
      count: freq,
      percentage: totalCount > 0 ? Number(((freq / totalCount) * 100).toFixed(2)) : 0
    }))
    .sort((a, b) => b.count - a.count);

  const mode = sortedFrequencies.length > 0 ? sortedFrequencies[0].value : null;

  if (dataType === 'number' || dataType === 'decimal') {
    const numbers = validValues
      .map(cleanNumeric)
      .filter(n => !isNaN(n))
      .sort((a, b) => a - b);

    if (numbers.length === 0) {
      return {
        count: totalCount,
        validCount: 0,
        missingCount,
        missingPercentage,
        uniqueCount,
        mode
      };
    }

    const n = numbers.length;
    const sum = numbers.reduce((acc, curr) => acc + curr, 0);
    const mean = Number((sum / n).toFixed(2));
    const min = numbers[0];
    const max = numbers[n - 1];
    const range = Number((max - min).toFixed(2));
    const median = Number(calculatePercentile(numbers, 0.5).toFixed(2));

    // Sample variance & standard deviation
    let variance = 0;
    if (n > 1) {
      const sumSquaredDiffs = numbers.reduce((acc, curr) => acc + Math.pow(curr - mean, 2), 0);
      variance = Number((sumSquaredDiffs / (n - 1)).toFixed(2));
    }
    const stdDev = Number(Math.sqrt(variance).toFixed(2));

    const p25 = Number(calculatePercentile(numbers, 0.25).toFixed(2));
    const p50 = median;
    const p75 = Number(calculatePercentile(numbers, 0.75).toFixed(2));
    const p90 = Number(calculatePercentile(numbers, 0.90).toFixed(2));

    // Calculate histogram bins (7 bins)
    const binCount = Math.min(8, Math.max(4, Math.ceil(Math.sqrt(n))));
    const binStep = (max - min) / binCount || 1;
    const bins = [];
    for (let i = 0; i < binCount; i++) {
      const start = Number((min + i * binStep).toFixed(1));
      const end = Number((min + (i + 1) * binStep).toFixed(1));
      const count = numbers.filter(num => (i === binCount - 1 ? num >= start && num <= end : num >= start && num < end)).length;
      bins.push({
        range: `${start} - ${end}`,
        count,
        binStart: start,
        binEnd: end
      });
    }

    return {
      count: totalCount,
      validCount: n,
      missingCount,
      missingPercentage,
      uniqueCount,
      mean,
      median,
      min,
      max,
      range,
      variance,
      stdDev,
      percentiles: {
        p25,
        p50,
        p75,
        p90
      },
      mode,
      histogram: bins,
      topValues: sortedFrequencies.slice(0, 10)
    };
  }

  return {
    count: totalCount,
    validCount: validValues.length,
    missingCount,
    missingPercentage,
    uniqueCount,
    mode,
    topValues: sortedFrequencies.slice(0, 10)
  };
};

module.exports = {
  calculateColumnStats,
  calculatePercentile
};
