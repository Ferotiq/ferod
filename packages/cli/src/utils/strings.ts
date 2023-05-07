/**
 * Converts a string to PascalCase
 * @param string The string to convert
 * @param separator The separator to use
 * @returns The converted string
 */
export function toPascalCase(string: string, separator = " "): string {
	return string
		.split(separator)
		.map((word) => word[0].toUpperCase() + word.slice(1))
		.join(separator);
}
