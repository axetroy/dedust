import { Rule } from './parser.js';

/**
 * Check if a pattern is potentially dangerous
 * @param pattern - The glob pattern to check
 * @returns True if the pattern is dangerous
 */
export function isDangerousPattern(pattern: string): boolean;

/**
 * Validate a single rule for safety
 * @param rule - The rule to validate
 * @returns Validation result with error message if invalid
 */
export function validateRule(rule: Rule): {
	valid: boolean;
	error: string | null;
};

/**
 * Validate all rules for safety
 * @param rules - Array of rules to validate
 * @returns Validation result with all errors
 */
export function validateRules(rules: Rule[]): {
	valid: boolean;
	errors: Array<{
		rule: Rule;
		error: string;
	}>;
};

/**
 * Validation error class
 */
export class ValidationError extends Error {
	name: 'ValidationError';
	validationErrors: Array<{
		rule: Rule;
		error: string;
	}>;

	constructor(
		message: string,
		validationErrors: Array<{
			rule: Rule;
			error: string;
		}>
	);
}
