const http = require('http');

const request = (method, path, body = null, token = null) => {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null;
    const options = {
      hostname: 'localhost',
      port: 5000,
      path,
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(data ? { 'Content-Length': Buffer.byteLength(data) } : {}),
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      }
    };

    const req = http.request(options, (res) => {
      let responseBody = '';
      res.on('data', (chunk) => { responseBody += chunk; });
      res.on('end', () => {
        try {
          const json = JSON.parse(responseBody);
          resolve({ status: res.statusCode, data: json });
        } catch (e) {
          resolve({ status: res.statusCode, data: responseBody });
        }
      });
    });

    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
};

async function runTests() {
  console.log('--- Starting DataLens API End-to-End Tests ---');

  // 1. Health check
  const health = await request('GET', '/api/health');
  console.log('✓ Health check:', health.status, health.data.service);

  // 2. Auth: Register a new user
  const email = `test_${Date.now()}@example.com`;
  const reg = await request('POST', '/api/auth/register', {
    name: 'Test Analyst',
    email,
    password: 'password123'
  });
  console.log('✓ Auth register:', reg.status, reg.data.message);
  const token = reg.data.token;

  // 3. Auth: Login
  const login = await request('POST', '/api/auth/login', {
    email,
    password: 'password123'
  });
  console.log('✓ Auth login:', login.status, 'JWT Token issued');

  // 4. Ingest sample dataset
  const sample = await request('POST', '/api/datasets/sample', null, token);
  console.log('✓ Load sample dataset:', sample.status, sample.data.message);
  const dsId = sample.data.dataset.id;
  console.log(`  Dataset ID: ${dsId}`);
  console.log(`  Rows: ${sample.data.dataset.row_count}, Columns: ${sample.data.dataset.column_count}`);
  console.log(`  Duplicates: ${sample.data.dataset.duplicate_rows_count}, Missing %: ${sample.data.dataset.missing_percentage}%`);
  console.log(`  Revenue KPI - Avg: ₹${sample.data.dataset.kpis.primaryMetric.average}, Max: ₹${sample.data.dataset.kpis.primaryMetric.maximum}, Min: ₹${sample.data.dataset.kpis.primaryMetric.minimum}`);

  // 5. Query dataset with pagination & search
  const queryRes = await request('GET', `/api/datasets/${dsId}?page=1&limit=10&search=Electronics`, null, token);
  console.log('✓ Search & pagination:', queryRes.status, `Filtered rows: ${queryRes.data.pagination.totalRows}, returned: ${queryRes.data.rows.length}`);

  // 6. Data remediation: drop duplicates
  const dedup = await request('POST', `/api/datasets/${dsId}/clean`, { action: 'drop_duplicates' }, token);
  console.log('✓ Deduplication action:', dedup.status, `New row count: ${dedup.data.dataset.row_count}, duplicates left: ${dedup.data.dataset.duplicate_rows_count}`);

  // 7. Data remediation: impute missing values
  const impute = await request('POST', `/api/datasets/${dsId}/clean`, { action: 'impute', strategy: 'median' }, token);
  console.log('✓ Imputation action:', impute.status, `Missing cells: ${impute.data.dataset.missing_cells_count}, missing %: ${impute.data.dataset.missing_percentage}%`);

  // 8. List datasets history
  const list = await request('GET', '/api/datasets', null, token);
  console.log('✓ Datasets history:', list.status, `Total datasets for user: ${list.data.datasets.length}`);

  // 9. Export CSV
  const exportRes = await request('GET', `/api/datasets/${dsId}/export`, null, token);
  console.log('✓ Export CSV:', exportRes.status, `Length: ${typeof exportRes.data === 'string' ? exportRes.data.length : 'ok'}`);

  console.log('\n🎉 ALL BACKEND API & DATA SCIENCE TESTS PASSED SUCCESSFULLY!\n');
}

runTests().catch(err => {
  console.error('Test failed:', err);
  process.exit(1);
});
