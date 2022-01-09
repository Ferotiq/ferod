/** @format */

import { Client } from "../structures/Client";
import { Context } from "./Context";

export interface CommandFunction {
  (context: Context, client: Client, ...parsedArgs: any[]): any;
}
