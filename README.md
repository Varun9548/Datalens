# 📊 DataLens — Upload CSV → Interactive Analytics

> **100% Free & Open-Source**: Runs entirely on your local machine with zero external cloud dependencies, zero subscription costs, and zero paid APIs.

DataLens is a full-stack automated data science and interactive analytics platform. Upload any CSV file (or test with the bundled sample dataset) to instantly generate executive KPI cards, descriptive statistical breakdowns, interactive data visualizations, and publication-ready PDF/CSV reports.

---

## 🌟 Key Features

1. **Automated CSV Ingestion & Validation**:
   - Validates file type (`.csv`), file size (up to 50MB), empty files, malformed rows, and duplicate headers.
   - Cleans locale currency indicators (`₹`, `$`, `€`, `£`, `,`) and percentages (`%`) automatically.

2. **Smart Column Data Type Inference**:
   - Automatically detects and categorizes columns into `number`, `decimal`, `categorical`, `date/time`, `boolean`, and `text`.

3. **In-Depth Statistical Analysis**:
   - **Numerical**: Count, Mean, Median, Min, Max, Range, Sample Variance ($s^2$), Standard Deviation ($s$), 25th Percentile ($Q_1$), 50th Percentile ($Q_2$), 75th Percentile ($Q_3$), 90th Percentile, and frequency bin histograms.
   - **Categorical & Boolean**: Cardinality, unique count, mode, and percentage distributions.

4. **Data Quality & Interactive Remediation**:
   - **Missing Values**: Detects missing cells count & percentage. Provides 1-click imputation (Median, Mean, Mode, Zero, or Custom) or row dropping.
   - **Deduplication**: Identifies identical records across all columns with 1-click automated deduplication.

5. **Executive KPI Dashboard**:
   - Executive summary cards for total rows, total columns, missing values rate, and duplicates count.
   - **Metric Spotlight**: Automatically selects the primary revenue/metric column and displays its Average, Maximum, Minimum, Range, and Standard Deviation (e.g. `Revenue: Average ₹12,430, Maximum ₹98,000, Minimum ₹1,200`).

6. **Automated & Custom Interactive Charts**:
   - **Bar Charts**: Categorical dimensions against financial/numerical metrics.
   - **Line Charts**: Time-series progression across dates.
   - **Donut / Pie Charts**: Categorical proportions and market shares.
   - **Histograms**: Binned frequency distributions.
   - **Scatter Plots**: Variable correlations.
   - **Interactive Custom Studio**: Ad-hoc chart designer allowing you to pick any X-axis, Y-axis, chart type, and aggregation (Sum, Avg, Count, Max, Min).

7. **Interactive Data Table**:
   - Pagination (10, 25, 50, 100 per page).
   - Global real-time search across all columns.
   - Multi-column sort (ascending / descending).
   - Dynamic Column Visibility manager (show/hide columns).
   - Empty/missing cell visual indicators.

8. **Export & History**:
   - **PDF Report**: Generates an executive summary analytics report with KPI cards, column breakdown, and statistics using jsPDF.
   - **CSV Export**: Download cleaned, imputed, or filtered datasets directly.
   - **Upload History**: Slide-over drawer to store, browse, reload, and manage past datasets.

9. **Security & Authentication**:
   - User registration and login with bcrypt password hashing and JWT authorization.
   - 1-click demo guest login available for immediate exploration.

---

## 🛠️ Tech Stack (100% Free)

- **Frontend**: React 18, Vite, Tailwind CSS, Lucide Icons, Recharts, jsPDF, jspdf-autotable, Axios
- **Backend**: Node.js, Express.js, PapaParse, Multer, JWT, bcryptjs
- **Database Layer**: Dual-mode SQL driver supporting **PostgreSQL** (via `pg`) with an automated zero-config local **SQLite** (`datalens.db`) fallback

---

## 🚀 Quick Start Guide

### 1. Start the Server (Single Command)
From `e:\Scripts\datalens`:
```bash
npm start
```
This boots the Express backend and serves the production React client simultaneously at:
👉 **http://localhost:5000**

### 2. Development Mode (Optional)
If you want to run with Vite hot module reloading:
- Backend:
  ```bash
  npm run dev:server
  ```
- Frontend (in another terminal):
  ```bash
  npm run dev:client
  ```
  Runs at **http://localhost:3000** with automatic proxy to the Express API.

### 3. Run Automated Tests
```bash
npm run test:api
```
Tests all health endpoints, auth flow (register & login), CSV ingestion, statistical precision, data deduplication, imputation, and export.

---

## 📁 Database Schema

Tables created automatically on first run:
- `users`: User authentication (`id`, `name`, `email`, `password_hash`, `created_at`)
- `datasets`: Ingested datasets (`id`, `user_id`, `name`, `original_filename`, `file_size`, `row_count`, `column_count`, `missing_cells_count`, `missing_percentage`, `duplicate_rows_count`, `raw_data`, `created_at`)
- `dataset_columns`: Column inventory & statistics (`id`, `dataset_id`, `column_name`, `data_type`, `missing_count`, `unique_count`, `stats`, `order_index`)
- `analysis_results`: KPI snapshots and chart configurations (`id`, `dataset_id`, `user_id`, `kpis`, `charts_config`, `created_at`)
