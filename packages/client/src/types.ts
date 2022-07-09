import type * as Discord from "discord.js";
import type { Client } from "./structures/Client";
import type { Event } from "./structures/Event";

export interface ClientOptions extends Discord.ClientOptions {
  dev: boolean;
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

export interface CommandFunction<T extends Discord.ApplicationCommandType> {
  (client: Client<true>, interaction: Interaction<T>): void;
}

export type GenericCommandFunction =
  CommandFunction<Discord.ApplicationCommandType>;

export interface CommandOptions<
  T extends Discord.ApplicationCommandType = "CHAT_INPUT"
> {
  name: string;
  description: string;
  category: string;
  guilds?: Discord.Snowflake[];
  options?: Discord.ApplicationCommandOptionData[];
  type?: T;
  run: CommandFunction<T>;
}

export type GenericEvent = Event<keyof Discord.ClientEvents>;

export interface EventFunction<E extends keyof Discord.ClientEvents> {
  (client: Client<true>, ...eventArgs: Discord.ClientEvents[E]): void;
}
