const fs = require('fs');
const path = require('path');

const outputPath1 = path.resolve(__dirname, 'sales.csv');
const outputPath2 = path.resolve(__dirname, '../../../../sales.csv'); // in e:\Scripts\sales.csv

const customerTypes = ['Corporate', 'Consumer', 'Small Business'];
const regions = ['North', 'South', 'East', 'West', 'Central'];
const cities = ['Mumbai', 'Delhi', 'Bengaluru', 'Hyderabad', 'Chennai', 'Pune', 'Kolkata', 'Ahmedabad', 'Jaipur', 'Lucknow'];
const categories = ['Electronics', 'Appliances', 'Furnishings', 'Office Supplies', 'Hardware'];
const products = [
  'UltraHD 4K Monitor', 'Wireless Mechanical Keyboard', 'Ergonomic Desk Chair',
  'Smart Automation Hub', 'LaserJet Multifunction Printer', 'Noise-Cancelling Headset',
  'Standing Desk Pro', 'High-Speed Mesh Router', 'Portable SSD 2TB', 'Docking Station USB-C',
  'Webcam 1080p Pro', 'Adjustable Laptop Stand', 'Surge Protector 8-Port', 'Bluetooth Speaker'
];
const paymentMethods = ['UPI', 'Credit Card', 'Net Banking', 'Debit Card', 'Cash on Delivery'];
const salesReps = ['Rajesh Sharma', 'Priya Patel', 'Amit Verma', 'Sneha Rao', 'Vikram Singh', 'Ananya Iyer', 'Karan Mehta'];
const deliveryStatuses = ['Delivered', 'In Transit', 'Pending', 'Cancelled'];

const headers = [
  'Transaction_ID',
  'Date',
  'Customer_ID',
  'Customer_Name',
  'Customer_Type',
  'Region',
  'City',
  'Product_Category',
  'Product_Name',
  'Quantity',
  'Unit_Price',
  'Revenue',
  'Discount_Percent',
  'Payment_Method',
  'Sales_Rep',
  'Shipping_Cost',
  'Delivery_Status',
  'Is_Repeat_Customer'
];

const TOTAL_ROWS = 12450;
const TARGET_MEAN = 12430;
const TARGET_SUM = TOTAL_ROWS * TARGET_MEAN; // 154,753,500
const MIN_REV = 1200;
const MAX_REV = 98000;

// Initialize all rows to target mean
const revenues = new Array(TOTAL_ROWS).fill(TARGET_MEAN);

// Set exact Min and Max
revenues[245] = MIN_REV; // exact min
revenues[5820] = MAX_REV; // exact max

// Balance the difference: (MIN_REV - TARGET_MEAN) + (MAX_REV - TARGET_MEAN)
// (1200 - 12430) + (98000 - 12430) = -11230 + 85570 = +74340
// We need to subtract 74,340 from other rows to keep sum exact
let excess = (MIN_REV - TARGET_MEAN) + (MAX_REV - TARGET_MEAN);
let balanceIdx = 10;
while (excess > 0 && balanceIdx < TOTAL_ROWS - 50) {
  if (revenues[balanceIdx] > 3000) {
    const deduct = Math.min(200, excess);
    revenues[balanceIdx] -= deduct;
    excess -= deduct;
  }
  balanceIdx++;
}

// Introduce natural variance while preserving sum: perturb pairs (i, j) with +delta and -delta
for (let p = 0; p < 25000; p++) {
  const i = Math.floor(Math.random() * (TOTAL_ROWS - 4)) + 4;
  const j = Math.floor(Math.random() * (TOTAL_ROWS - 4)) + 4;
  if (i === j || i === 245 || i === 5820 || j === 245 || j === 5820) continue;

  const delta = Math.floor(Math.random() * 5000) - 2500;
  if (
    revenues[i] + delta >= 1500 &&
    revenues[i] + delta <= 85000 &&
    revenues[j] - delta >= 1500 &&
    revenues[j] - delta <= 85000
  ) {
    revenues[i] += delta;
    revenues[j] -= delta;
  }
}

const rows = [];
let totalMissingCells = 0;
const TOTAL_CELLS = TOTAL_ROWS * headers.length; // 224,100
const TARGET_MISSING_CELLS = Math.round(TOTAL_CELLS * 0.032); // 7,171 (~3.2%)

// Missing probability per eligible column
// Eligible: City, Product_Category, Discount_Percent, Sales_Rep (4 columns)
// Probability = 7171 / (12450 * 4) ~= 0.144
const pMissing = TARGET_MISSING_CELLS / (TOTAL_ROWS * 4);

for (let i = 0; i < TOTAL_ROWS; i++) {
  const txId = `TXN-${100000 + i + 1}`;
  const month = (i % 12) + 1;
  const day = (i % 28) + 1;
  const dateStr = `2025-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  const custId = `CUST-${1000 + (i % 1500)}`;
  const custName = `Customer_${1000 + (i % 1500)}`;
  const custType = customerTypes[i % customerTypes.length];
  const region = regions[i % regions.length];
  const city = cities[i % cities.length];
  const cat = categories[i % categories.length];
  const prod = products[i % products.length];
  const qty = (i % 6) + 1;
  const rev = revenues[i];
  const unitPrice = Number((rev / qty).toFixed(2));
  const discount = Number(((i % 5) * 5).toFixed(1));
  const payMethod = paymentMethods[i % paymentMethods.length];
  const rep = salesReps[i % salesReps.length];
  const shipCost = 60 + (i % 12) * 50;
  const status = deliveryStatuses[i % deliveryStatuses.length];
  const isRepeat = i % 4 !== 0 ? 'true' : 'false';

  let isCityMissing = false;
  let isCatMissing = false;
  let isDiscountMissing = false;
  let isRepMissing = false;

  if (totalMissingCells < TARGET_MISSING_CELLS && Math.random() < pMissing) {
    isCityMissing = true;
    totalMissingCells++;
  }
  if (totalMissingCells < TARGET_MISSING_CELLS && Math.random() < pMissing) {
    isCatMissing = true;
    totalMissingCells++;
  }
  if (totalMissingCells < TARGET_MISSING_CELLS && Math.random() < pMissing) {
    isDiscountMissing = true;
    totalMissingCells++;
  }
  if (totalMissingCells < TARGET_MISSING_CELLS && Math.random() < pMissing) {
    isRepMissing = true;
    totalMissingCells++;
  }

  const row = [
    txId,
    dateStr,
    custId,
    custName,
    custType,
    region,
    isCityMissing ? '' : city,
    isCatMissing ? '' : cat,
    prod,
    qty,
    unitPrice,
    `₹${rev.toLocaleString('en-IN')}`,
    isDiscountMissing ? '' : `${discount}%`,
    payMethod,
    isRepMissing ? '' : rep,
    `₹${shipCost}`,
    status,
    isRepeat
  ];

  rows.push(row);
}

const csvLines = [headers.join(',')];
rows.forEach(r => {
  const line = r.map(val => {
    const s = String(val);
    if (s.includes(',') || s.includes('"')) {
      return `"${s.replace(/"/g, '""')}"`;
    }
    return s;
  }).join(',');
  csvLines.push(line);
});

const content = csvLines.join('\n');
fs.writeFileSync(outputPath1, content, 'utf8');
try {
  fs.writeFileSync(outputPath2, content, 'utf8');
} catch (e) {}

const actualSum = revenues.reduce((a, b) => a + b, 0);
const actualMean = Math.round(actualSum / TOTAL_ROWS);
const actualMin = Math.min(...revenues);
const actualMax = Math.max(...revenues);
const actualMissingPct = Number(((totalMissingCells / TOTAL_CELLS) * 100).toFixed(1));

console.log('----------------------------------------------------');
console.log(`Generated sales.csv with:`);
console.log(`Rows: ${rows.length.toLocaleString()}`);
console.log(`Columns: ${headers.length}`);
console.log(`Missing values: ${actualMissingPct}% (${totalMissingCells} cells)`);
console.log(`Revenue:`);
console.log(`  Average: ₹${actualMean.toLocaleString('en-IN')}`);
console.log(`  Maximum: ₹${actualMax.toLocaleString('en-IN')}`);
console.log(`  Minimum: ₹${actualMin.toLocaleString('en-IN')}`);
console.log('----------------------------------------------------');
