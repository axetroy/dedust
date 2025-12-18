import { Rule, LocationType } from './parser.js';

/**
 * Evaluation context for rules
 */
export interface EvaluationContext {
	/** The base directory for evaluation */
	baseDir: string;
	/** The current directory being evaluated */
	currentDir: string;
}

/**
 * Result of executing cleanup
 */
export interface ExecutionResult {
	/** Successfully deleted paths */
	deleted: string[];
	/** Errors encountered during deletion */
	errors: Array<{
		path: string;
		error: Error;
	}>;
}

/**
 * Evaluator class for DSL rules
 */
export class Evaluator {
	/**
	 * Create a new evaluator
	 * @param rules - Array of rules to evaluate
	 * @param baseDir - Base directory to start evaluation from
	 */
	constructor(rules: Rule[], baseDir: string);

	/**
	 * Check if a file or directory exists matching a pattern
	 * @param dir - Directory to check in
	 * @param pattern - Pattern to match
	 */
	exists(dir: string, pattern: string): Promise<boolean>;

	/**
	 * Get directories based on location modifier
	 * @param currentDir - Current directory
	 * @param location - Location modifier
	 */
	getLocationDirs(currentDir: string, location: LocationType): string[];

	/**
	 * Evaluate a predicate
	 * @param predicate - The predicate to evaluate
	 * @param currentDir - Current directory context
	 */
	evaluatePredicate(predicate: import('./parser.js').Predicate, currentDir: string): Promise<boolean>;

	/**
	 * Evaluate a condition
	 * @param condition - The condition to evaluate
	 * @param currentDir - Current directory context
	 */
	evaluateCondition(condition: import('./parser.js').Condition, currentDir: string): Promise<boolean>;

	/**
	 * Get all directories recursively from base
	 * @param dir - Starting directory
	 */
	getAllDirectories(dir: string): string[];

	/**
	 * Find targets matching a rule in a directory
	 * @param rule - The rule to match
	 * @param dir - Directory to search in
	 */
	findTargets(rule: Rule, dir: string): Promise<string[]>;

	/**
	 * Evaluate all rules and collect targets
	 * @param dryRun - If true, don't actually delete files
	 */
	evaluate(dryRun?: boolean): Promise<string[]>;

	/**
	 * Execute deletion of targets
	 * @param targets - Files/directories to delete
	 */
	execute(targets: string[]): Promise<ExecutionResult>;
}

/**
 * Evaluate rules and find targets
 * @param rules - Array of rules to evaluate
 * @param baseDir - Base directory to evaluate from
 * @param dryRun - If true, don't actually delete files
 */
export function evaluate(rules: Rule[], baseDir: string, dryRun?: boolean): Promise<string[]>;

/**
 * Execute deletion of targets
 * @param rules - Array of rules to execute
 * @param baseDir - Base directory to execute from
 */
export function executeRules(rules: Rule[], baseDir: string): Promise<ExecutionResult>;
