/**
 * Simple glob pattern matching
 * Supports *, **, ?, and basic patterns
 */

function minimatch(str, pattern) {
  // Exact match
  if (str === pattern) return true;

  // Convert glob pattern to regex
  const regex = globToRegex(pattern);
  return regex.test(str);
}

function globToRegex(pattern) {
  let regexStr = '';
  let i = 0;

  while (i < pattern.length) {
    const char = pattern[i];

    if (char === '*') {
      // Check for **
      if (pattern[i + 1] === '*') {
        i += 2;
        // Skip following slash if present
        if (pattern[i] === '/') {
          i++;
          // ** followed by / matches zero or more path segments
          // This means it can match nothing (for files in current dir)
          // or one or more path segments
          regexStr += '(?:.*\\/)?';
        } else {
          // ** at end or not followed by /
          regexStr += '.*';
        }
      } else {
        // Single * matches anything except path separator
        regexStr += '[^/]*';
        i++;
      }
    } else if (char === '?') {
      regexStr += '[^/]';
      i++;
    } else if (char === '.') {
      regexStr += '\\.';
      i++;
    } else if (char === '/') {
      regexStr += '\\/';
      i++;
    } else if (char === '\\') {
      regexStr += '\\\\';
      i++;
    } else if (char === '+' || char === '^' || char === '$' || char === '(' || char === ')' || 
               char === '[' || char === ']' || char === '{' || char === '}' || char === '|') {
      regexStr += '\\' + char;
      i++;
    } else {
      regexStr += char;
      i++;
    }
  }

  return new RegExp('^' + regexStr + '$');
}

module.exports = {
  minimatch,
  globToRegex
};
