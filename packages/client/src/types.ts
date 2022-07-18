import type * as Discord from "discord.js";
import type { Client } from "./structures/client";

export interface ClientOptions extends Discord.ClientOptions {
  dev: boolean;
  devGuildId: Discord.Snowflake;
  commandsPath: string;
  eventsPath: string;
  commandLoadedMessage?: boolean;
  deleteUnusedApplicationCommands?: boolean;
  editApplicationCommands?: boolean;
}

type Interaction<T extends Discord.ApplicationCommandType> =
  T extends Discord.ApplicationCommandType.ChatInput
    ? Discord.ChatInputCommandInteraction
    : T extends Discord.ApplicationCommandType.Message
    ? Discord.MessageContextMenuCommandInteraction
    : Discord.UserContextMenuCommandInteraction;

export interface CommandFunction<
  T extends Discord.ApplicationCommandType = Discord.ApplicationCommandType
> {
  (client: Client<true>, interaction: Interaction<T>): void;
}

export interface CommandOptions<
  T extends Discord.ApplicationCommandType = Discord.ApplicationCommandType.ChatInput
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
