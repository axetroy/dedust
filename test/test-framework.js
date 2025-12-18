/**
 * Simple test runner
 */

const tests = [];
let currentSuite = null;

function describe(name, fn) {
  currentSuite = { name, tests: [] };
  fn();
  tests.push(currentSuite);
  currentSuite = null;
}

function it(name, fn) {
  if (!currentSuite) {
    throw new Error('it() must be called within describe()');
  }
  currentSuite.tests.push({ name, fn });
}

function assertEqual(actual, expected, message) {
  const actualStr = JSON.stringify(actual);
  const expectedStr = JSON.stringify(expected);
  
  if (actualStr !== expectedStr) {
    throw new Error(
      message || `Assertion failed:\n  Expected: ${expectedStr}\n  Actual: ${actualStr}`
    );
  }
}

function assertTrue(value, message) {
  if (!value) {
    throw new Error(message || `Expected true, got ${value}`);
  }
}

function assertFalse(value, message) {
  if (value) {
    throw new Error(message || `Expected false, got ${value}`);
  }
}

function assertThrows(fn, message) {
  let didThrow = false;
  try {
    fn();
  } catch (e) {
    didThrow = true;
  }
  
  if (!didThrow) {
    throw new Error(message || 'Expected function to throw but it did not');
  }
}

async function runTests() {
  let passed = 0;
  let failed = 0;

  for (const suite of tests) {
    console.log(`\n${suite.name}`);
    
    for (const test of suite.tests) {
      try {
        await test.fn();
        console.log(`  ✓ ${test.name}`);
        passed++;
      } catch (e) {
        console.log(`  ✗ ${test.name}`);
        console.log(`    ${e.message}`);
        if (e.stack) {
          console.log(`    ${e.stack.split('\n').slice(1).join('\n    ')}`);
        }
        failed++;
      }
    }
  }

  console.log(`\n${passed + failed} tests, ${passed} passed, ${failed} failed`);
  return failed === 0;
}

module.exports = {
  describe,
  it,
  assertEqual,
  assertTrue,
  assertFalse,
  assertThrows,
  runTests
};
