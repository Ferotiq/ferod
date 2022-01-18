/** @format */

export function toPascalCase(string: string): string {
  return string
    .split(/[ _]+/)
    .map(v => v[0]?.toUpperCase() + v.substring(1).toLowerCase())
    .join(" ");
}
