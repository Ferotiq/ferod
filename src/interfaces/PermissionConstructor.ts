/** @format */

import { ApplicationCommandPermissions, Guild } from "discord.js";
import { Client } from "../structures/Client";

export interface PermissionConstructor {
  (client: Client, guilds?: Guild[]):
    | ApplicationCommandPermissions[]
    | Promise<ApplicationCommandPermissions[]>;
}
