import globCallback from "glob";
import _ from "lodash";
import path from "path";
import { pathToFileURL } from "url";
import { promisify } from "util";

const glob = promisify(globCallback);

/**
 * Removes all deeply nested undefined properties from a plain object.
 * @param obj The object to clean
 */
export function quickClean<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

/**
 * Removes all deeply nested nil properties from an object.
 * https://stackoverflow.com/a/48584441
 * @param obj The object to clean
 */
export function clean(obj: any): any {
  return _(obj)
    .pickBy(_.isObject)
    .mapValues(clean)
    .assign(_.omitBy(obj, _.isObject))
    .omitBy(_.isNil)
    .value();
}
/**
 * Imports multiple files and returns them as instances of the class specified.
 * @param filePath The path to import
 * @param expectedClass The class to check against
 */
export async function importFiles<T>(
  filePath: string,
  expectedClass?: new (...args: any[]) => T
): Promise<T[]> {
  const normalizedFilePath = filePath.split(path.sep).join("/");

  const filePaths = (await glob(normalizedFilePath)).map((fileName) =>
    pathToFileURL(fileName).toString()
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
