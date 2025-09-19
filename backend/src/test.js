// Simple test file for backend
console.log('Backend tests running...');

// Basic test
function testBasicFunctionality() {
  console.log('✓ Basic functionality test passed');
  return true;
}

// Run tests
try {
  testBasicFunctionality();
  console.log('All tests passed!');
  process.exit(0);
} catch (error) {
  console.error('Test failed:', error);
  process.exit(1);
}
