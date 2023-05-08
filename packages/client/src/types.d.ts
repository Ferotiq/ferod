import type {
	ApplicationCommandOptionData,
	ApplicationCommandOptionType,
	ApplicationCommandType,
	ChatInputCommandInteraction,
	ClientEvents,
	ClientOptions as DiscordClientOptions,
	MessageContextMenuCommandInteraction,
	PermissionResolvable,
	Snowflake,
	UserContextMenuCommandInteraction
} from "discord.js";
import type { Client } from "./structures/client";

export interface ClientOptions extends DiscordClientOptions {
	dev: boolean;
	devGuildId: Snowflake;
	commandsPath: string;
	eventListenersPath: string;
	commandLoadedMessage?: boolean;
	deleteUnusedApplicationCommands?: boolean;
	editApplicationCommands?: boolean;
}

type Interaction<T extends ApplicationCommandType> =
	T extends ApplicationCommandType.ChatInput
		? ChatInputCommandInteraction
		: T extends ApplicationCommandType.Message
		? MessageContextMenuCommandInteraction
		: UserContextMenuCommandInteraction;

export interface CommandFunction<
	T extends ApplicationCommandType = ApplicationCommandType
> {
	(client: Client<true>, interaction: Interaction<T>): void;
}

export interface CommandOptions<
	T extends ApplicationCommandType = ApplicationCommandType.ChatInput
> {
	name: string;
	description: string;
	category: string;
	options?: ApplicationCommandOptionData[];
	permissions?: PermissionResolvable[];
	type: T;
	executor: CommandFunction<T>;
}

export interface Option {
	name: string;
	description: string;
	type: ApplicationCommandOptionType;
	optional: boolean;
}

export interface EventListenerHandler<Event extends keyof ClientEvents> {
	(client: Client<true>, ...eventArgs: ClientEvents[Event]): void;
}

export interface EventListenerOptions<Event extends keyof ClientEvents> {
	event: Event;
	handler: EventListenerHandler<Event>;
}
