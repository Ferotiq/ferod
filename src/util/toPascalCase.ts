/**
 * Converts a space or underscore separated string to PascalCase
 * @param str The string to convert
 */
export function toPascalCase(str: string): string {
  return str
    .split(/[ _]+/)
    .map((v) => v[0]?.toUpperCase() + v.substring(1).toLowerCase())
    .join(" ");
}
