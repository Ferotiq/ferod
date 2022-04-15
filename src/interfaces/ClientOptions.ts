/** @format */

import { ClientOptions as DiscordClientOptions } from "discord.js";

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
