import globCallback from "glob";
import path from "path";
import { pathToFileURL } from "url";
import { promisify } from "util";

const glob = promisify(globCallback);

/**
 * Removes all deeply nested undefined properties from a plain object.
 * @param obj The object to clean
 */
export function quickClean<T>(obj: T): T {
  return parse(stringify(obj));
}

/**
 * Returns a string representation of the object with unserializable types considered.
 */
function stringify<T>(value: T): string {
  return JSON.stringify(value, (key, value) => {
    if (typeof value === "bigint" || value instanceof BigInt) {
      return {
        __type: "bigint",
        value: value.toString()
      };
    } else if (typeof value === "symbol" || value instanceof Symbol) {
      return {
        __type: "symbol",
        value: value.toString()
      };
    } else if (value instanceof Map) {
      return {
        __type: "map",
        value: Array.from(value.entries())
      };
    } else if (value instanceof Set) {
      return {
        __type: "set",
        value: Array.from(value.values())
      };
    }

    return value;
  });
}

/**
 * Parses a stringified object.
 */
function parse<T>(value: string): T {
  return JSON.parse(value, (key, value) => {
    if (typeof value === "object" && value !== null) {
      if (value.__type === "bigint") {
        return BigInt(value.value);
      } else if (value.__type === "symbol") {
        return Symbol(value.value);
      } else if (value.__type === "map") {
        return new Map(value.value);
      } else if (value.__type === "set") {
        return new Set(value.value);
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
  expectedClass?: new (...args: never[]) => T
): Promise<T[]> {
  const normalizedFilePath = filePath.split(path.sep).join("/");

  const filePaths = (await glob(normalizedFilePath)).map((fileName) =>
    useUrlIfNecessary(fileName)
  );

  const importedFiles = await Promise.all(
    filePaths.map((fileName) => import(fileName))
  );

  const objects: T[] = importedFiles.map((file) => file.default ?? file);

  if (
    expectedClass !== undefined &&
    !objects.every((obj) => obj instanceof expectedClass)
  ) {
    throw new Error(
      `${normalizedFilePath} does not export ${expectedClass.name}`
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
