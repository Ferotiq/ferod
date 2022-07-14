import type * as Discord from "discord.js";
import type { Client } from "./structures/client";

export interface ClientOptions extends Discord.ClientOptions {
  dev: boolean;
  devGuildID: Discord.Snowflake;
  commandsPath: string;
  eventsPath: string;
  commandLoadedMessage?: boolean;
  deleteUnusedApplicationCommands?: boolean;
  editApplicationCommands?: "all" | "guild" | "global" | "off";
}

type Interaction<T extends Discord.ApplicationCommandType> =
  T extends "CHAT_INPUT"
    ? Discord.CommandInteraction
    : T extends "MESSAGE"
    ? Discord.MessageContextMenuInteraction
    : Discord.UserContextMenuInteraction;

export interface CommandFunction<
  T extends Discord.ApplicationCommandType = Discord.ApplicationCommandType
> {
  (client: Client<true>, interaction: Interaction<T>): void;
}

export interface CommandOptions<
  T extends Discord.ApplicationCommandType = "CHAT_INPUT"
> {
  name: string;
  description: string;
  category: string;
  options?: Discord.ApplicationCommandOptionData[];
  type?: T;
  run: CommandFunction<T>;
}

export interface EventFunction<E extends keyof Discord.ClientEvents> {
  (client: Client<true>, ...eventArgs: Discord.ClientEvents[E]): void;
}

export interface EventOptions<E extends keyof Discord.ClientEvents> {
  event: E;
  run: EventFunction<E>;
}
