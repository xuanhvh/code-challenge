/**
 * @param n - number to sum to
 * @returns The sum of all integers from 1 to n
 * Complexity: O(n)
 */
const sum_to_n_a = function(n: number): number {
	let sum = 0;
	for (let i = 1; i <= n; i++) {
		sum += i;
	}
	return sum;
}

/**
 * @param n - The number to sum to
 * @returns The sum of all integers from 1 to n
 * Complexity: O(1)
 */
const sum_to_n_b = function(n: number): number {
	return (n * (n + 1)) / 2;
}

/**
 * @param n - The number to sum to
 * @returns The sum of all integers from 1 to n
 * Complexity: O(n)
 */
const sum_to_n_c = function(n: number): number {
	if (n === 1) return 1;
	return n + sum_to_n_c(n - 1);
}