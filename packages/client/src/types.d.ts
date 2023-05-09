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
	deleteUnusedApplicationCommands?: boolean;
	editApplicationCommands?: boolean;
}

type Interaction<TType extends ApplicationCommandType> =
	TType extends ApplicationCommandType.ChatInput
		? ChatInputCommandInteraction
		: TType extends ApplicationCommandType.Message
		? MessageContextMenuCommandInteraction
		: UserContextMenuCommandInteraction;

export interface CommandFunction<
	TType extends ApplicationCommandType = ApplicationCommandType
> {
	(client: Client<true>, interaction: Interaction<TType>): void;
}

export interface CommandOptions<
	TType extends ApplicationCommandType = ApplicationCommandType.ChatInput
> {
	name: string;
	description: string;
	category: string;
	options?: ApplicationCommandOptionData[];
	permissions?: PermissionResolvable[];
	type: TType;
	executor: CommandFunction<TType>;
}

export interface Option {
	name: string;
	description: string;
	type: ApplicationCommandOptionType;
	optional: boolean;
}

export interface EventListenerHandler<TEvent extends keyof ClientEvents> {
	(client: Client<true>, ...eventArgs: ClientEvents[TEvent]): void;
}

export interface EventListenerOptions<TEvent extends keyof ClientEvents> {
	event: TEvent;
	handler: EventListenerHandler<TEvent>;
}
