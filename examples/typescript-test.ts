/**
 * TypeScript Type Checking Test
 * 
 * This file tests the TypeScript declarations for the ignore feature.
 */

import { 
  type CleanupOptions,
  type ActionType,
  type Rule,
} from '../src/index.js';

// Test CleanupOptions type
const options1: CleanupOptions = {
  ignore: ['.git', 'node_modules']
};

const options2: CleanupOptions = {
  ignore: ['*.keep', 'important/**']
};

const options3: CleanupOptions = {}; // Optional ignore

// Test ActionType
const action1: ActionType = 'delete';
const action2: ActionType = 'ignore';

// Test Rule with ignore action
const deleteRule: Rule = {
  action: 'delete',
  target: '*.log',
  condition: null
};

const ignoreRule: Rule = {
  action: 'ignore',
  target: '.git',
  condition: null
};

console.log('TypeScript types are valid!');
