import chalk from "chalk";
import { glob } from "glob";
import path from "path";
import { pathToFileURL } from "url";

/**
 * Removes all deeply nested undefined properties from a plain object.
 * @param obj The object to clean
 */
export function quickClean<T>(obj: T): T {
	return parse(stringify(obj));
}

/**
 * Stringifies an object, but converts BigInts to strings.
 * @param obj The object to stringify
 * @returns The stringified object
 */
export function stringify<T>(obj: T): string {
	return JSON.stringify(obj, (key, value) => {
		if (typeof value === "bigint") {
			return {
				__type: "bigint",
				value: value.toString(),
			};
		}

		return value;
	});
}

/**
 * Parses a stringified object, but converts strings to BigInts.
 * @param str The string to parse
 * @returns The parsed object
 */
export function parse<T>(str: string): T {
	return JSON.parse(str, (key, value) => {
		if (typeof value === "object" && value !== null) {
			if (value.__type === "bigint") {
				return BigInt(+value.value);
			}
		}

		return value;
	});
}

/**
 * Imports multiple files and returns them as instances of the class specified.
 * @param filePath The path to import
 * @param expectedClass The class to check against
 */
export async function importFiles<T>(
	filePath: string,
	expectedClass?: new (...args: never[]) => T,
): Promise<T[]> {
	const normalizedFilePath = filePath.split(path.sep).join("/");

	const filePaths = (await glob(normalizedFilePath)).map((fileName) =>
		useUrlIfNecessary(fileName),
	);

	const importedFiles = await Promise.all(
		filePaths.map((fileName) => import(fileName)),
	);

	const objects: T[] = importedFiles.map((file) => file.default ?? file);

	if (
		expectedClass !== undefined &&
		!objects.every((obj) => obj instanceof expectedClass)
	) {
		throw new Error(
			chalk.red(
				`Event listener "${normalizedFilePath}" does not export ${expectedClass.name}`,
			),
		);
	}

	return objects;
}

/**
 * Returns the url to the file if in ESModules mode, otherwise returns the file path.
 */
function useUrlIfNecessary(filePath: string): string {
	if (typeof __filename === "string") {
		return filePath;
	}

	return pathToFileURL(filePath).toString();
}
