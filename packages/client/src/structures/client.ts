import * as Discord from "discord.js";
import * as fs from "fs";
import isEqual from "lodash/isEqual";
import path from "path";
import type { ClientOptions } from "../types";
import { importFiles, quickClean } from "../utils/misc";
import { Command } from "./command";
import { EventListener } from "./event-listener";

/**
 * A simple yet powerful Discord.JS client that automates many features for you
 */
export class Client<T extends boolean = boolean> extends Discord.Client<T> {
	// With how Discord.JS now defines Client.prototype.options, we cannot override it.
	public clientOptions: ClientOptions;
	public commands = new Discord.Collection<
		string,
		Command<Discord.ApplicationCommandType>
	>();
	public categories = new Set<string>();

	/**
	 * Creates a new client
	 * @param options The options for the client
	 * @param dirname The path that the client is being constructed from (necessary for loading commands/events)
	 */
	public constructor(options: ClientOptions, dirname: string) {
		super(options);

		this.clientOptions = {
			...options,
			commandsPath: path.resolve(dirname, options.commandsPath),
			eventListenersPath: path.resolve(dirname, options.eventListenersPath)
		};

		if (options.dev && !options.devGuildId) {
			throw new Error("devGuildId must be provided if dev is set to true.");
		}
	}

	/**
	 * Checks and adds commands/events folders.
	 */
	private checkPaths(): void {
		// commands
		if (!fs.existsSync(this.clientOptions.commandsPath)) {
			fs.mkdirSync(this.clientOptions.commandsPath, { recursive: true });

			console.warn(
				"The commands directory has been created using the path provided."
			);
		}

		// events
		if (!fs.existsSync(this.clientOptions.eventListenersPath)) {
			fs.mkdirSync(this.clientOptions.eventListenersPath, { recursive: true });

			console.warn(
				"The event listeners directory has been created using the path provided."
			);
		}
	}

	/**
	 * Starts the client
	 * @param token The token to use for the client
	 */
	public async start(token: string): Promise<void> {
		await this.login(token);

		const events = await this.load();

		if (this.clientOptions.commandLoadedMessage) {
			const commandEntries = this.commands.map((command, name) => [
				name,
				{
					...command.data,
					type: Discord.ApplicationCommandType[command.type]
				}
			]);

			const commandObject = Object.fromEntries(commandEntries);

			console.table(commandObject, [
				"description",
				"type",
				"category",
				"options"
			]);
		}

		console.log(
			`Loaded ${this.commands.size} commands and ${events.length} events.`
		);

		this.emit("ready", this as Client<true>);
	}

	/**
	 * Loads commands, events, and application commands into the bot.
	 */
	public async load(): Promise<EventListener[]> {
		this.checkPaths();

		// add commands
		const commands = await importFiles<Command>(
			path.resolve(this.clientOptions.commandsPath, "**", "*.{ts,js}"),
			Command
		);

		for (const command of commands) {
			this.commands.set(command.name, command);

			this.categories.add(command.category);
		}

		// add event listeners
		const listeners = await importFiles<EventListener>(
			path.resolve(this.clientOptions.eventListenersPath, "**", "*.{ts,js}"),
			EventListener
		);

		for (const listener of listeners) {
			this.on(
				listener.event,
				listener.handler.bind(null, this as Client<true>)
			);
		}

		this.registerApplicationCommands();

		return listeners;
	}

	/**
	 * Uses the list of commands on the client to create/edit/delete application commands.
	 */
	private async registerApplicationCommands(): Promise<void> {
		const applicationCommands = this.clientOptions.dev
			? await this.fetchApplicationCommands(this.clientOptions.devGuildId)
			: await this.fetchApplicationCommands();

		if (applicationCommands === undefined) {
			return;
		}

		// create/edit application commands
		for (const command of this.commands.values()) {
			const applicationCommand = applicationCommands.find(
				(applicationCommand) => applicationCommand.name === command.name
			);

			if (applicationCommand === undefined) {
				await command.create(this as Client<true>);

				console.log(`Created application command ${command.name}`);

				continue;
			}

			if (!this.clientOptions.editApplicationCommands) {
				continue;
			}

			const type = command.type ?? Discord.ApplicationCommandType.ChatInput;

			const description =
				type === Discord.ApplicationCommandType.ChatInput
					? command.description ?? "No description provided"
					: "";

			const toEdit = quickClean({
				name: command.name,
				description,
				type,
				defaultMemberPermissions: command.permissions.valueOf(),
				options: command.options
			});

			if (
				isEqual(
					toEdit,
					quickClean({
						name: applicationCommand.name,
						description: applicationCommand.description,
						type: applicationCommand.type,
						defaultMemberPermissions:
							applicationCommand.defaultMemberPermissions?.valueOf(),
						options: applicationCommand.options
					})
				)
			) {
				continue;
			}

			await applicationCommand.edit(toEdit);

			console.log(`Edited application command ${command.name}`);
		}

		// delete application commands
		if (this.clientOptions.deleteUnusedApplicationCommands) {
			const otherApplicationCommands =
				(this.clientOptions.dev
					? await this.fetchApplicationCommands()
					: await this.fetchApplicationCommands(
							this.clientOptions.devGuildId
					  )) ?? new Discord.Collection();

			const toDelete: Discord.ApplicationCommand[] = [
				...applicationCommands
					.concat(otherApplicationCommands)
					.filter(
						(applicationCommand) => !this.commands.has(applicationCommand.name)
					)
					.values()
			];

			for (const applicationCommand of toDelete) {
				await applicationCommand.delete();

				console.log(`Deleted application command ${applicationCommand.name}`);
			}
		}
	}

	/**
	 * Fetch all the application commands from the bot
	 * @param guildId The guild to fetch from
	 */
	public async fetchApplicationCommands(
		guildId?: string
	): Promise<
		Discord.Collection<string, Discord.ApplicationCommand> | undefined
	> {
		return this.application?.commands.fetch({
			cache: true,
			force: true,
			guildId
		});
	}

	/**
	 * Gets all the commands that are in the specified category
	 * @param category The category to get commands from
	 */
	public getCommandsByCategory(
		category: string
	): Discord.Collection<string, Command<Discord.ApplicationCommandType>> {
		return this.commands.filter((cmd) => cmd.category === category);
	}
}
