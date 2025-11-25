/**
 * Script to generate dummy files for KYC form testing
 * Run with: node generate-dummy-kyc-files.js
 */

const fs = require('fs');
const path = require('path');

// Create dummy-files directory if it doesn't exist
const dummyDir = path.join(__dirname, 'dummy-kyc-files');
if (!fs.existsSync(dummyDir)) {
  fs.mkdirSync(dummyDir, { recursive: true });
}

// Create a simple 1x1 pixel PNG image (base64 encoded)
const tinyPNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
  'base64'
);

// Create a simple PDF (minimal valid PDF)
const tinyPDF = Buffer.from(
  '%PDF-1.4\n1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] >>\nendobj\nxref\n0 4\n0000000000 65535 f \n0000000009 00000 n \n0000000058 00000 n \n0000000115 00000 n \ntrailer\n<< /Size 4 /Root 1 0 R >>\nstartxref\n179\n%%EOF',
  'utf-8'
);

// Files to create
const files = [
  { name: 'employee-photo.jpg', content: tinyPNG, type: 'image' },
  { name: 'pan-card.jpg', content: tinyPNG, type: 'image' },
  { name: 'aadhaar-front.jpg', content: tinyPNG, type: 'image' },
  { name: 'aadhaar-back.jpg', content: tinyPNG, type: 'image' },
  { name: 'salary-slip-month-1.pdf', content: tinyPDF, type: 'pdf' },
  { name: 'salary-slip-month-2.pdf', content: tinyPDF, type: 'pdf' },
  { name: 'salary-slip-month-3.pdf', content: tinyPDF, type: 'pdf' },
  { name: 'bank-proof.pdf', content: tinyPDF, type: 'pdf' },
];

console.log('📁 Generating dummy KYC files...\n');

files.forEach((file) => {
  const filePath = path.join(dummyDir, file.name);
  fs.writeFileSync(filePath, file.content);
  const size = (file.content.length / 1024).toFixed(2);
  console.log(`✅ Created: ${file.name} (${size} KB)`);
});

console.log(`\n✨ All dummy files created in: ${dummyDir}`);
console.log('\n📋 Files created:');
console.log('   Required Documents:');
console.log('   - employee-photo.jpg');
console.log('   - pan-card.jpg');
console.log('   - aadhaar-front.jpg');
console.log('   - aadhaar-back.jpg');
console.log('\n   Optional Documents:');
console.log('   - salary-slip-month-1.pdf');
console.log('   - salary-slip-month-2.pdf');
console.log('   - salary-slip-month-3.pdf');
console.log('   - bank-proof.pdf');
console.log('\n💡 You can now use these files to test the KYC form upload!');

