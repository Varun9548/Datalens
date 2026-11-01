const multer = require('multer');

// Store uploaded CSV in memory for direct PapaParse ingestion
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const isCsv = file.mimetype === 'text/csv' ||
                file.mimetype === 'application/vnd.ms-excel' ||
                file.mimetype === 'application/csv' ||
                file.mimetype === 'text/plain' ||
                file.originalname.toLowerCase().endsWith('.csv');

  if (isCsv) {
    cb(null, true);
  } else {
    cb(new Error('Only .csv files are supported.'), false);
  }
};

const upload = multer({
  storage,
  limits: {
    fileSize: 50 * 1024 * 1024 // 50 MB
  },
  fileFilter
});

module.exports = upload;
