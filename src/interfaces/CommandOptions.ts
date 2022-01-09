/** @format */

import { CommandFunction } from "./CommandFunction";
import { CommandBuilder } from "./CommandBuilder";
import { Permission } from "./Permission";

export interface CommandOptions {
  name: string;
  description: string;
  /** @deprecated Deprecated due to message content commands phasing out. */
  aliases?: string[];
  /** @deprecated Deprecated due to message content commands phasing out. */
  permissions?: Permission[];
  category: string;
  guildID?: string;
  build: CommandBuilder;
  run: CommandFunction;
}
