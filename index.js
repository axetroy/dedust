/**
 * Dust - A DSL-based garbage file cleanup tool
 * 
 * Main entry point
 */

const { parseRule, parseRules } = require('./parser');
const { executeRule, executeRules } = require('./executor');
const fs = require('fs');
const path = require('path');

/**
 * Clean files based on dust DSL rules
 * @param {string} rulesText - DSL rules as text
 * @param {string} rootPath - Root directory to clean
 * @param {object} options - Options { dryRun: boolean }
 * @returns {Array} Array of paths that were (or would be) deleted
 */
function clean(rulesText, rootPath, options = {}) {
  const rules = parseRules(rulesText);
  return executeRules(rootPath, rules, options);
}

/**
 * Clean files based on a rules file
 * @param {string} rulesFile - Path to rules file
 * @param {string} rootPath - Root directory to clean
 * @param {object} options - Options { dryRun: boolean }
 * @returns {Array} Array of paths that were (or would be) deleted
 */
function cleanFromFile(rulesFile, rootPath, options = {}) {
  const rulesText = fs.readFileSync(rulesFile, 'utf-8');
  return clean(rulesText, rootPath, options);
}

/**
 * Parse DSL rules without executing
 * @param {string} rulesText - DSL rules as text
 * @returns {Array} Array of parsed rule ASTs
 */
function parse(rulesText) {
  return parseRules(rulesText);
}

module.exports = {
  clean,
  cleanFromFile,
  parse,
  parseRule,
  parseRules,
  executeRule,
  executeRules
};
