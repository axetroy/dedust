#!/usr/bin/env node

/**
 * Test runner - runs all test files
 */

// Load all test files
require('./parser.test.js');
require('./executor.test.js');
require('./integration.test.js');

// Run tests
const { runTests } = require('./test-framework');

runTests().then(success => {
  process.exit(success ? 0 : 1);
});
