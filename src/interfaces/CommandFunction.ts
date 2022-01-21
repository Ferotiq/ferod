/** @format */

import { Context } from "./Context";

export interface CommandFunction {
  (context: Context): any;
}
