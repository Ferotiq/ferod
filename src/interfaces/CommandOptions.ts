/** @format */

import { CommandFunction } from "./CommandFunction";
import { Permission } from "./Permission";
import {
  ApplicationCommandOption,
  ApplicationCommandPermissions,
  ApplicationCommandType,
  Snowflake
} from "discord.js";

export interface CommandOptions {
  name: string;
  description: string;
  /** @deprecated Deprecated due to message content commands phasing out. */
  aliases?: string[];
  /** @deprecated Deprecated due to message content commands phasing out. */
  legacyPermissions?: Permission[];
  permissions?: ApplicationCommandPermissions[];
  category: string;
  guildIDs?: Snowflake[];
  options?: ApplicationCommandOption[];
  type?: ApplicationCommandType;
  run: CommandFunction;
}
