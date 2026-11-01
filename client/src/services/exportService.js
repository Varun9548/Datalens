import jsPDF from 'jspdf';
import 'jspdf-autotable';

export const exportPdfReport = (dataset, columns, kpis) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();

  // Header Banner
  doc.setFillColor(30, 41, 59); // Slate 800
  doc.rect(0, 0, pageWidth, 40, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.text('DataLens Analytics Report', 14, 20);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(148, 163, 184); // Slate 400
  const dateStr = new Date().toLocaleString();
  doc.text(`Dataset: ${dataset.name || dataset.original_filename}   |   Generated: ${dateStr}`, 14, 30);

  let currentY = 50;

  // Executive KPI Summary Box
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('1. Dataset Overview & Health Metrics', 14, currentY);
  currentY += 8;

  const overviewData = [
    ['Total Rows', (dataset.row_count || 0).toLocaleString()],
    ['Total Columns', (dataset.column_count || 0).toString()],
    ['Missing Values', `${dataset.missing_percentage || 0}% (${dataset.missing_cells_count || 0} cells)`],
    ['Duplicate Rows', (dataset.duplicate_rows_count || 0).toString()],
    ['File Size', dataset.file_size ? `${(dataset.file_size / 1024).toFixed(1)} KB` : 'N/A']
  ];

  doc.autoTable({
    startY: currentY,
    head: [['Metric', 'Value']],
    body: overviewData,
    theme: 'striped',
    headStyles: { fillColor: [79, 70, 229] },
    styles: { fontSize: 10, cellPadding: 4 },
    margin: { left: 14, right: 14 }
  });

  currentY = doc.lastAutoTable.finalY + 14;

  // Primary Metric Highlights if available
  if (kpis && kpis.primaryMetric) {
    const pm = kpis.primaryMetric;
    doc.setTextColor(15, 23, 42);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text(`2. Key Metric Analysis: ${pm.columnName}`, 14, currentY);
    currentY += 8;

    const metricData = [
      ['Average / Mean', pm.average ? `₹${pm.average.toLocaleString('en-IN')}` : 'N/A'],
      ['Maximum Value', pm.maximum ? `₹${pm.maximum.toLocaleString('en-IN')}` : 'N/A'],
      ['Minimum Value', pm.minimum ? `₹${pm.minimum.toLocaleString('en-IN')}` : 'N/A'],
      ['Median (50th %)', pm.median ? `₹${pm.median.toLocaleString('en-IN')}` : 'N/A'],
      ['Standard Deviation', pm.stdDev ? `₹${pm.stdDev.toLocaleString('en-IN')}` : 'N/A'],
      ['Range (Max - Min)', pm.range ? `₹${pm.range.toLocaleString('en-IN')}` : 'N/A']
    ];

    doc.autoTable({
      startY: currentY,
      head: [['Statistical Indicator', 'Value']],
      body: metricData,
      theme: 'grid',
      headStyles: { fillColor: [16, 185, 129] },
      styles: { fontSize: 10, cellPadding: 4 },
      margin: { left: 14, right: 14 }
    });

    currentY = doc.lastAutoTable.finalY + 14;
  }

  // Column Schema & Statistical Breakdown
  if (columns && columns.length > 0) {
    if (currentY > 220) {
      doc.addPage();
      currentY = 20;
    }

    doc.setTextColor(15, 23, 42);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('3. Column Inventory & Data Distribution', 14, currentY);
    currentY += 8;

    const colTableData = columns.map((c, idx) => {
      const stats = c.stats || {};
      let statsDesc = '';
      if (c.data_type === 'number' || c.data_type === 'decimal') {
        statsDesc = `Mean: ${stats.mean ?? '-'} | Min: ${stats.min ?? '-'} | Max: ${stats.max ?? '-'}`;
      } else {
        statsDesc = `Mode: ${stats.mode ?? '-'} (Unique: ${c.unique_count ?? '-'})`;
      }

      return [
        (idx + 1).toString(),
        c.column_name,
        c.data_type.toUpperCase(),
        `${c.missing_count || 0} (${stats.missingPercentage || 0}%)`,
        (c.unique_count || 0).toString(),
        statsDesc
      ];
    });

    doc.autoTable({
      startY: currentY,
      head: [['#', 'Column Name', 'Type', 'Missing', 'Uniques', 'Key Statistics']],
      body: colTableData,
      theme: 'striped',
      headStyles: { fillColor: [59, 130, 246] },
      styles: { fontSize: 8, cellPadding: 3 },
      margin: { left: 14, right: 14 }
    });
  }

  // Footer on all pages
  const totalPages = doc.internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text(
      `DataLens Analytics Engine • Page ${i} of ${totalPages} • 100% Free & Open-Source`,
      pageWidth / 2,
      doc.internal.pageSize.getHeight() - 10,
      { align: 'center' }
    );
  }

  // Save the generated PDF
  doc.save(`${dataset.name || 'datalens_analytics'}_report.pdf`);
};

export const downloadCsvFile = (filename, csvData) => {
  const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
