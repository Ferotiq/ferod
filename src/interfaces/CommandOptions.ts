/** @format */

import { CommandFunction } from "./CommandFunction";
import {
  ApplicationCommandOptionData,
  ApplicationCommandPermissions,
  ApplicationCommandType,
  Snowflake
} from "discord.js";
import { PermissionConstructor } from "./PermissionConstructor";

export interface CommandOptions {
  name: string;
  description: string;
  permissions?: ApplicationCommandPermissions[];
  permissionConstructor?: PermissionConstructor;
  category: string;
  guilds?: Snowflake[];
  global?: boolean;
  options?: ApplicationCommandOptionData[];
  type?: ApplicationCommandType;
  run: CommandFunction;
}
