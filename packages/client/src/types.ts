import type * as Discord from "discord.js";
import type { Client } from "./structures/Client";

export interface ClientOptions extends Discord.ClientOptions {
  token: string;
  commandsPath: string;
  eventsPath: string;
  commandLoadedMessage?: boolean;
  eventLoadedMessage?: boolean;
  deleteUnusedSlashCommands?: boolean;
  editSlashCommands?: "all" | "guild" | "global" | "off";
}

export interface CommandFunction {
  (client: Client, interaction: Discord.CommandInteraction): void;
}

export interface CommandOptions {
  name: string;
  description: string;
  permissions?: Discord.ApplicationCommandPermissions[];
  permissionConstructor?: PermissionConstructor;
  category: string;
  guilds?: Discord.Snowflake[];
  global?: boolean;
  options?: Discord.ApplicationCommandOptionData[];
  type?: Discord.ApplicationCommandType;
  run: CommandFunction;
}

export interface Event<E extends keyof Discord.ClientEvents> {
  event: E;
  run: EventFunction<E>;
}

export interface EventFunction<E extends keyof Discord.ClientEvents> {
  (client: Client, ...eventArgs: Discord.ClientEvents[E]): void;
}

export interface PermissionConstructor {
  (client: Client, guilds?: Discord.Guild[]):
    | Discord.ApplicationCommandPermissions[]
    | Promise<Discord.ApplicationCommandPermissions[]>;
}
