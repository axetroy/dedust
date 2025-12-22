/**
 * TypeScript Example for Dedust
 * 
 * This file demonstrates the usage of the Dedust library with TypeScript,
 * including the new ignore feature.
 */

import { 
  parseRules, 
  findTargets, 
  executeCleanup, 
  type Rule,
  type CleanupOptions,
  type ExecutionResult,
  type ActionType,
} from 'dedust';

// Basic usage with ignore patterns (API-based)
async function apiIgnoreExample() {
  const dsl = 'delete *';
  
  const options: CleanupOptions = {
    ignore: ['.git', 'node_modules', '*.keep', 'important/**']
  };

  const targets = await findTargets(dsl, '/path/to/project', options);
  const result = await executeCleanup(dsl, '/path/to/project', options);
}

// DSL-based ignore patterns
async function dslIgnoreExample() {
  const dsl = `
    ignore .git
    ignore node_modules/**
    delete target when exists Cargo.toml
    delete *.log
  `;

  const targets = await findTargets(dsl, '/path/to/project');
}

// Combined DSL and API ignore
async function combinedIgnoreExample() {
  const dsl = `
    ignore .git
    delete *
  `;

  const options: CleanupOptions = {
    ignore: ['important/**', '*.keep']
  };

  const result = await executeCleanup(dsl, '/path/to/project', options);
}

// Type examples
const action: ActionType = 'ignore'; // 'delete' or 'ignore'

const rule: Rule = {
  action: 'ignore',
  target: '.git',
  condition: null
};
