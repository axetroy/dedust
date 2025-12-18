/**
 * Executor for dust DSL
 * 
 * Executes parsed rules against a directory structure
 */

const fs = require('fs');
const path = require('path');
const { minimatch } = require('./minimatch-simple');

/**
 * Check if a pattern matches in the specified location relative to basePath
 * @param {string} basePath - The base directory
 * @param {string} location - Location modifier (here, parent, parents, etc.)
 * @param {string} pattern - Glob pattern to match
 * @returns {boolean} Whether pattern matches
 */
function checkExists(basePath, location, pattern) {
  switch (location) {
    case 'here':
      return existsInDirectory(basePath, pattern);
    
    case 'parent':
      const parentDir = path.dirname(basePath);
      if (parentDir === basePath) return false; // Already at root
      return existsInDirectory(parentDir, pattern);
    
    case 'parents':
      let current = path.dirname(basePath);
      while (current !== path.dirname(current)) { // Not at root
        if (existsInDirectory(current, pattern)) return true;
        current = path.dirname(current);
      }
      // Check root
      if (existsInDirectory(current, pattern)) return true;
      return false;
    
    case 'child':
      try {
        const entries = fs.readdirSync(basePath, { withFileTypes: true });
        for (const entry of entries) {
          if (entry.isDirectory()) {
            const childPath = path.join(basePath, entry.name);
            if (existsInDirectory(childPath, pattern)) return true;
          }
        }
      } catch (e) {
        return false;
      }
      return false;
    
    case 'children':
      return existsInDescendants(basePath, pattern);
    
    case 'sibling':
      const parent = path.dirname(basePath);
      if (parent === basePath) return false;
      try {
        const entries = fs.readdirSync(parent, { withFileTypes: true });
        for (const entry of entries) {
          if (entry.isDirectory()) {
            const siblingPath = path.join(parent, entry.name);
            if (siblingPath !== basePath && existsInDirectory(siblingPath, pattern)) {
              return true;
            }
          }
        }
      } catch (e) {
        return false;
      }
      return false;
    
    default:
      return false;
  }
}

/**
 * Check if pattern exists in a specific directory
 */
function existsInDirectory(dirPath, pattern) {
  try {
    const entries = fs.readdirSync(dirPath, { withFileTypes: true });
    for (const entry of entries) {
      if (minimatch(entry.name, pattern)) {
        return true;
      }
    }
  } catch (e) {
    return false;
  }
  return false;
}

/**
 * Check if pattern exists in any descendant directory
 */
function existsInDescendants(dirPath, pattern) {
  try {
    const entries = fs.readdirSync(dirPath, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);
      
      if (entry.isDirectory()) {
        if (existsInDirectory(fullPath, pattern)) return true;
        if (existsInDescendants(fullPath, pattern)) return true;
      }
    }
  } catch (e) {
    return false;
  }
  return false;
}

/**
 * Evaluate a condition at a given path
 */
function evaluateCondition(basePath, condition) {
  if (!condition) return true;

  if (condition.type === 'Exists') {
    return checkExists(basePath, condition.location, condition.pattern);
  }

  if (condition.type === 'Not') {
    return !evaluateCondition(basePath, condition.predicate);
  }

  if (condition.type === 'And') {
    return condition.predicates.every(pred => evaluateCondition(basePath, pred));
  }

  return false;
}

/**
 * Find all directories recursively
 */
function findAllDirectories(rootPath) {
  const directories = [rootPath];
  
  function traverse(dirPath) {
    try {
      const entries = fs.readdirSync(dirPath, { withFileTypes: true });
      for (const entry of entries) {
        if (entry.isDirectory()) {
          const fullPath = path.join(dirPath, entry.name);
          directories.push(fullPath);
          traverse(fullPath);
        }
      }
    } catch (e) {
      // Ignore permission errors
    }
  }
  
  traverse(rootPath);
  return directories;
}

/**
 * Find targets matching pattern in directory
 */
function findTargets(dirPath, pattern) {
  const targets = [];
  
  // Handle glob patterns with **
  if (pattern.includes('**')) {
    // Recursive search
    function traverse(currentPath, remainingPattern) {
      try {
        const entries = fs.readdirSync(currentPath, { withFileTypes: true });
        
        for (const entry of entries) {
          const fullPath = path.join(currentPath, entry.name);
          const relativePath = path.relative(dirPath, fullPath);
          
          if (minimatch(relativePath, pattern)) {
            targets.push(fullPath);
          }
          
          if (entry.isDirectory()) {
            traverse(fullPath, remainingPattern);
          }
        }
      } catch (e) {
        // Ignore errors
      }
    }
    
    traverse(dirPath, pattern);
  } else {
    // Simple pattern - check current directory only
    try {
      const entries = fs.readdirSync(dirPath);
      for (const entry of entries) {
        if (minimatch(entry, pattern)) {
          targets.push(path.join(dirPath, entry));
        }
      }
    } catch (e) {
      // Ignore errors
    }
  }
  
  return targets;
}

/**
 * Execute a single rule
 * @param {string} rootPath - Root directory to start from
 * @param {object} rule - Parsed rule AST
 * @param {object} options - Execution options
 * @returns {Array} Array of deleted paths
 */
function executeRule(rootPath, rule, options = {}) {
  const { dryRun = false } = options;
  const deleted = [];

  // Find all directories to check
  const directories = findAllDirectories(rootPath);

  for (const directory of directories) {
    // Check if condition holds
    if (evaluateCondition(directory, rule.condition)) {
      // Find targets in this directory
      const targets = findTargets(directory, rule.target);

      for (const target of targets) {
        if (rule.action === 'delete') {
          deleted.push(target);
          
          if (!dryRun) {
            try {
              // Delete file or directory
              const stat = fs.statSync(target);
              if (stat.isDirectory()) {
                fs.rmSync(target, { recursive: true, force: true });
              } else {
                fs.unlinkSync(target);
              }
            } catch (e) {
              // Ignore deletion errors
            }
          }
        }
      }
    }
  }

  return deleted;
}

/**
 * Execute multiple rules
 * @param {string} rootPath - Root directory to start from
 * @param {Array} rules - Array of parsed rule ASTs
 * @param {object} options - Execution options
 * @returns {Array} Array of deleted paths
 */
function executeRules(rootPath, rules, options = {}) {
  const allDeleted = [];

  for (const rule of rules) {
    const deleted = executeRule(rootPath, rule, options);
    allDeleted.push(...deleted);
  }

  return allDeleted;
}

module.exports = {
  executeRule,
  executeRules,
  checkExists,
  evaluateCondition,
  findTargets
};
