import type {
  ClientOptions as DiscordClientOptions,
  ClientEvents,
  Guild,
  CommandInteraction
} from "discord.js";
import type { Client } from "./structures/Client";

export interface ClientOptions extends DiscordClientOptions {
  token: string;
  commandsPath: string;
  eventsPath: string;
  commandLoadedMessage?: boolean;
  eventLoadedMessage?: boolean;
  builtInHelpCommand?: "js" | "ts" | "off";
  deleteUnusedSlashCommands?: boolean;
  editSlashCommands?: "all" | "guild" | "global" | "off";
}

export interface CommandFunction {
  (client: Client, interaction: CommandInteraction): void;
}

import {
  ApplicationCommandOptionData,
  ApplicationCommandPermissions,
  ApplicationCommandType,
  Snowflake
} from "discord.js";

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

export interface Event<E extends keyof ClientEvents> {
  event: E;
  run: EventFunction<E>;
}

export interface EventFunction<E extends keyof ClientEvents> {
  (client: Client, ...eventArgs: ClientEvents[E]): void;
}

export interface PermissionConstructor {
  (client: Client, guilds?: Guild[]):
    | ApplicationCommandPermissions[]
    | Promise<ApplicationCommandPermissions[]>;
}
