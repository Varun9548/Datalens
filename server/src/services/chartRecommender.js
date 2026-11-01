/**
 * Chart Recommender
 * Automatically constructs optimal charts from columns, data types, and statistics.
 */

const recommendCharts = (columns, rows) => {
  const charts = [];

  const numericCols = columns.filter(c => c.data_type === 'number' || c.data_type === 'decimal');
  const catCols = columns.filter(c => c.data_type === 'categorical');
  const dateCols = columns.filter(c => c.data_type === 'date/time');

  // 1. Primary Category vs Numeric Bar Chart
  if (catCols.length > 0 && numericCols.length > 0) {
    const primaryCat = catCols[0].column_name;
    // Prefer columns with names like Revenue, Sales, Amount, Total, Profit
    const revenueKeywords = ['revenue', 'sales', 'amount', 'total', 'profit', 'price', 'income'];
    const primaryNum = numericCols.find(c => 
      revenueKeywords.some(k => c.column_name.toLowerCase().includes(k))
    )?.column_name || numericCols[0].column_name;

    // Aggregate by category
    const catAggregation = {};
    rows.forEach(r => {
      const catVal = String(r[primaryCat] || 'Unassigned');
      let numVal = r[primaryNum];
      if (typeof numVal === 'string') {
        numVal = Number(numVal.replace(/^[₹$€£¥]\s?/, '').replace(/,/g, ''));
      }
      if (!isNaN(numVal) && numVal !== null) {
        catAggregation[catVal] = (catAggregation[catVal] || 0) + Number(numVal);
      }
    });

    const barData = Object.entries(catAggregation)
      .map(([name, val]) => ({ name, value: Number(val.toFixed(2)) }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10);

    charts.push({
      id: 'bar-category-metric',
      type: 'bar',
      title: `${primaryNum} by ${primaryCat}`,
      xAxis: 'name',
      yAxis: 'value',
      data: barData,
      metricName: primaryNum,
      categoryName: primaryCat
    });
  }

  // 2. Line Chart: Time series (Date/Time vs Numeric)
  if (dateCols.length > 0 && numericCols.length > 0) {
    const primaryDate = dateCols[0].column_name;
    const primaryNum = numericCols.find(c => 
      ['revenue', 'sales', 'amount', 'profit', 'total'].some(k => c.column_name.toLowerCase().includes(k))
    )?.column_name || numericCols[0].column_name;

    const timeSeriesMap = {};
    rows.forEach(r => {
      const dateVal = r[primaryDate];
      if (!dateVal) return;
      // Group by date or month
      const parsedDate = new Date(dateVal);
      if (isNaN(parsedDate.getTime())) return;
      const key = parsedDate.toISOString().split('T')[0];

      let numVal = r[primaryNum];
      if (typeof numVal === 'string') {
        numVal = Number(numVal.replace(/^[₹$€£¥]\s?/, '').replace(/,/g, ''));
      }
      if (!isNaN(numVal) && numVal !== null) {
        timeSeriesMap[key] = (timeSeriesMap[key] || 0) + Number(numVal);
      }
    });

    const lineData = Object.entries(timeSeriesMap)
      .map(([date, value]) => ({ date, value: Number(value.toFixed(2)) }))
      .sort((a, b) => (a.date > b.date ? 1 : -1))
      .slice(0, 30); // reasonable display limit

    if (lineData.length > 1) {
      charts.push({
        id: 'line-timeseries',
        type: 'line',
        title: `${primaryNum} Trend over Time`,
        xAxis: 'date',
        yAxis: 'value',
        data: lineData,
        metricName: primaryNum,
        dateName: primaryDate
      });
    }
  }

  // 3. Pie / Donut Chart: Categorical Share
  if (catCols.length > 0) {
    // Pick first or second category
    const catCol = catCols.length > 1 ? catCols[1] : catCols[0];
    const catName = catCol.column_name;
    const countMap = {};
    rows.forEach(r => {
      const val = String(r[catName] || 'Unknown');
      countMap[val] = (countMap[val] || 0) + 1;
    });

    const sortedEntries = Object.entries(countMap).sort((a, b) => b[1] - a[1]);
    const topEntries = sortedEntries.slice(0, 6);
    const otherCount = sortedEntries.slice(6).reduce((acc, curr) => acc + curr[1], 0);

    const pieData = topEntries.map(([name, count]) => ({ name, value: count }));
    if (otherCount > 0) {
      pieData.push({ name: 'Other', value: otherCount });
    }

    charts.push({
      id: 'pie-distribution',
      type: 'pie',
      title: `${catName} Distribution`,
      data: pieData,
      categoryName: catName
    });
  }

  // 4. Histogram for primary numeric column
  if (numericCols.length > 0) {
    const numCol = numericCols.find(c => 
      ['revenue', 'sales', 'amount', 'profit', 'total', 'price'].some(k => c.column_name.toLowerCase().includes(k))
    ) || numericCols[0];

    const stats = numCol.stats ? (typeof numCol.stats === 'string' ? JSON.parse(numCol.stats) : numCol.stats) : null;
    if (stats && stats.histogram && stats.histogram.length > 0) {
      charts.push({
        id: 'histogram-distribution',
        type: 'histogram',
        title: `${numCol.column_name} Frequency Distribution`,
        xAxis: 'range',
        yAxis: 'count',
        data: stats.histogram,
        metricName: numCol.column_name
      });
    }
  }

  // 5. Scatter Plot: Correlation between two numeric variables
  if (numericCols.length >= 2) {
    const colX = numericCols[0].column_name;
    const colY = numericCols[1].column_name;

    const scatterData = [];
    const sampleLimit = Math.min(rows.length, 100);
    for (let i = 0; i < sampleLimit; i++) {
      let valX = rows[i][colX];
      let valY = rows[i][colY];
      if (typeof valX === 'string') valX = Number(valX.replace(/^[₹$€£¥]\s?/, '').replace(/,/g, ''));
      if (typeof valY === 'string') valY = Number(valY.replace(/^[₹$€£¥]\s?/, '').replace(/,/g, ''));

      if (!isNaN(valX) && valX !== null && !isNaN(valY) && valY !== null) {
        scatterData.push({ x: Number(valX), y: Number(valY), id: i + 1 });
      }
    }

    if (scatterData.length > 5) {
      charts.push({
        id: 'scatter-correlation',
        type: 'scatter',
        title: `${colX} vs ${colY} Correlation`,
        xAxis: 'x',
        yAxis: 'y',
        data: scatterData,
        xLabel: colX,
        yLabel: colY
      });
    }
  }

  return charts;
};

module.exports = {
  recommendCharts
};
