const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const { initDatabase } = require('./config/database');
const { requireAuth, optionalAuth } = require('./middleware/authMiddleware');
const upload = require('./middleware/uploadMiddleware');
const authController = require('./controllers/authController');
const datasetController = require('./controllers/datasetController');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS for frontend Vite dev server (usually 5173 or 3000)
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Health Check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'DataLens Analytics Engine',
    timestamp: new Date().toISOString(),
    cost: '100% Free & Open Source'
  });
});

// Auth Routes
app.post('/api/auth/register', authController.register);
app.post('/api/auth/login', authController.login);
app.get('/api/auth/me', requireAuth, authController.me);
app.get('/api/auth/users', authController.listUsers);

// Dataset Routes
app.post('/api/datasets/upload', optionalAuth, upload.single('file'), datasetController.uploadDataset);
app.post('/api/datasets/sample', optionalAuth, datasetController.loadSampleDataset);
app.get('/api/datasets', optionalAuth, datasetController.listDatasets);
app.get('/api/datasets/:id', optionalAuth, datasetController.getDatasetById);
app.post('/api/datasets/:id/clean', optionalAuth, datasetController.cleanDataset);
app.delete('/api/datasets/:id', optionalAuth, datasetController.deleteDataset);
app.get('/api/datasets/:id/export', optionalAuth, datasetController.exportDatasetCsv);

// Serve Frontend Static Build if available
const clientDistPath = path.resolve(__dirname, '../../client/dist');
if (require('fs').existsSync(clientDistPath)) {
  app.use(express.static(clientDistPath));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) return next();
    res.sendFile(path.join(clientDistPath, 'index.html'));
  });
}

// Global error handler
app.use((err, req, res, next) => {
  console.error('[DataLens Server Error]:', err.message);
  res.status(err.status || 500).json({
    error: err.message || 'An unexpected error occurred.'
  });
});

// Start Server and initialize DB
const start = async () => {
  try {
    await initDatabase();
    app.listen(PORT, () => {
      console.log(`=======================================================`);
      console.log(`🚀 DataLens Server running on http://localhost:${PORT}`);
      console.log(`📊 100% Free Local Mode: SQLite / PostgreSQL ready`);
      console.log(`=======================================================`);
    });
  } catch (err) {
    console.error('Fatal initialization error:', err);
    process.exit(1);
  }
};

start();
