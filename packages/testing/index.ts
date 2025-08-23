/**
 * ONEDOT-JS Testing Package
 *
 * This package provides comprehensive testing capabilities for ONEDOT-JS applications,
 * including unit, integration, and end-to-end testing.
 */

// Core exports
export * from './src';

// Module-specific exports
export { E2ETester } from './src/e2e';
export { IntegrationTester } from './src/integration';
export { UnitTester } from './src/unit';

// Re-export commonly used types and interfaces
export type {
  Assertion,
  AssertionResult, E2EBrowser, E2EConfig, E2EElement, E2EPage, IntegrationConfig,
  Mock,
  Spy,
  Stub, TestCase, TestConfig,
  TestContext, TestHook,
  TestReporter, TestResult, TestRunner, TestSuite
} from './src/types';

// Default export for the testing package
export default {
  // Test runners
  runners: {
    unit: require('./src/unit').UnitTester,
    integration: require('./src/integration').IntegrationTester,
    e2e: require('./src/e2e').E2ETester
  },

  // Assertion library
  assert: require('./src/assertions').Assertion,

  // Mocking utilities
  mock: require('./src/mocking').Mock,

  // Version information
  version: require('./package.json').version
};
