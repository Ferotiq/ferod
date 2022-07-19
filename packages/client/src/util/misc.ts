import _ from "lodash";

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
