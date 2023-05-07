import chalk from "chalk";
import {
	ApplicationCommand,
	ApplicationCommandType,
	Collection,
	Client as DiscordClient
} from "discord.js";
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
export class Client<T extends boolean = boolean> extends DiscordClient<T> {
	// With how Discord.JS now defines Client.prototype.options, we cannot override it.
	public clientOptions: ClientOptions;
	public commands = new Collection<string, Command<ApplicationCommandType>>();
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
			console.log(
				chalk.yellow("The commands directory does not exist. Creating...")
			);
			fs.mkdirSync(this.clientOptions.commandsPath, { recursive: true });
			console.log(
				chalk.green("The commands directory has been created successfully!")
			);
		}

		// events
		if (!fs.existsSync(this.clientOptions.eventListenersPath)) {
			console.log(
				chalk.yellow("The events directory does not exist. Creating...")
			);
			fs.mkdirSync(this.clientOptions.eventListenersPath, { recursive: true });
			console.log(
				chalk.green(
					"The event listeners directory has been created successfully!"
				)
			);
		}
	}

	/**
	 * Starts the client
	 * @param token The token to use for the client
	 */
	public async start(token: string): Promise<void> {
		console.log(chalk.yellow("Checking paths..."));
		this.checkPaths();
		console.log(chalk.green("Paths are valid!"));

		console.log(chalk.yellow("Loading events..."));
		const eventListenerCount = await this.loadEventListeners();
		console.log(
			chalk.green(`Loaded ${chalk.magenta(eventListenerCount)} events!`)
		);

		console.log(chalk.yellow("Logging in..."));
		await this.login(token);
		console.log(chalk.green("Logged in successfully!"));

		console.log(chalk.yellow("Loading commands..."));
		const commandCount = await this.loadCommands();
		console.log(chalk.green(`Loaded ${chalk.cyan(commandCount)} commands!`));
	}

	/**
	 * Loads event listeners into the bot
	 * @returns The amount of event listeners loaded
	 */
	public async loadEventListeners(): Promise<number> {
		console.log(
			chalk.yellow(
				`Loading files from ${chalk.magenta(
					this.clientOptions.eventListenersPath
				)}...`
			)
		);
		const listeners = await importFiles<EventListener>(
			path.resolve(this.clientOptions.eventListenersPath, "**", "*.{ts,js}"),
			EventListener
		);
		console.log(
			chalk.green(`Loaded ${chalk.magenta(listeners.length)} files!`)
		);

		for (const listener of listeners) {
			console.log(
				chalk.yellow(
					`Registering event listener for ${chalk.magenta(listener.event)}...`
				)
			);
			// TODO: Fix this
			// This only shows an error in Visual Studio Code, but it works fine.
			// eslint-disable-next-line @typescript-eslint/ban-ts-comment
			// @ts-ignore
			this.on(
				listener.event,
				listener.handler.bind(null, this as Client<true>)
			);
			console.log(
				chalk.green(
					`Registered event listener for ${chalk.magenta(listener.event)}!`
				)
			);
		}

		return listeners.length;
	}

	/**
	 * Loads commands into the bot
	 */
	public async loadCommands(): Promise<number> {
		console.log(
			chalk.yellow(
				`Loading files from ${chalk.cyan(this.clientOptions.commandsPath)}`
			)
		);
		const commands = await importFiles<Command>(
			path.resolve(this.clientOptions.commandsPath, "**", "*.{ts,js}"),
			Command
		);
		console.log(chalk.green(`Loaded ${chalk.cyan(commands.length)} files!`));

		for (const command of commands) {
			console.log(
				chalk.yellow(`Loading command ${chalk.cyan(command.name)}...`)
			);
			this.commands.set(command.name, command);
			this.categories.add(command.category);
			console.log(chalk.green(`Loaded command ${chalk.cyan(command.name)}!`));
		}

		console.log(chalk.yellow("Registering application commands..."));
		const applicationCommands = this.clientOptions.dev
			? await this.fetchApplicationCommands(this.clientOptions.devGuildId)
			: await this.fetchApplicationCommands();

		if (applicationCommands === undefined) {
			console.error(chalk.red("Failed to fetch application commands!"));
			return commands.length;
		}

		// create/edit application commands
		for (const command of this.commands.values()) {
			console.log(
				chalk.yellow(
					`Fetching application command for ${chalk.cyan(command.name)}...`
				)
			);
			const applicationCommand = applicationCommands.find(
				(applicationCommand) => applicationCommand.name === command.name
			);

			if (applicationCommand === undefined) {
				console.log(
					chalk.yellow(
						`Application command for ${chalk.cyan(
							command.name
						)} not found! Creating...`
					)
				);
				const createdApplicationCommand = await command.create(
					this as Client<true>
				);
				applicationCommands.set(
					createdApplicationCommand.id,
					createdApplicationCommand
				);
				console.log(
					`Created application command for ${chalk.cyan(command.name)}!`
				);

				continue;
			}

			console.log(
				chalk.green(
					`Found application command for ${chalk.cyan(command.name)}!`
				)
			);
			if (!this.clientOptions.editApplicationCommands) {
				continue;
			}
			console.log(
				chalk.yellow(
					`Checking if application command for ${chalk.cyan(
						command.name
					)} matches...`
				)
			);

			const type = command.type ?? ApplicationCommandType.ChatInput;

			const description =
				type === ApplicationCommandType.ChatInput ? command.description : "";

			const cleanedApplicationCommand = quickClean({
				name: applicationCommand.name,
				description: applicationCommand.description,
				type: applicationCommand.type,
				defaultMemberPermissions:
					applicationCommand.defaultMemberPermissions?.valueOf(),
				options: applicationCommand.options
			});
			const cleanedLocalCommand = quickClean({
				name: command.name,
				description,
				type,
				defaultMemberPermissions: command.permissions.valueOf(),
				options: command.options
			});

			if (isEqual(cleanedLocalCommand, cleanedApplicationCommand)) {
				console.log(
					chalk.green(
						`Application command for ${chalk.cyan(command.name)} matches!`
					)
				);

				continue;
			}

			console.log(
				chalk.yellow(
					`Application command for ${chalk.cyan(
						command.name
					)} does not match ${chalk.cyan(command.name)}! Editing...`
				)
			);
			const editedApplicationCommand = await applicationCommand.edit(
				cleanedLocalCommand
			);
			applicationCommands.set(
				editedApplicationCommand.id,
				editedApplicationCommand
			);
			console.log(
				chalk.green(
					`Edited application command for ${chalk.cyan(command.name)}!`
				)
			);
		}

		// delete application commands
		if (this.clientOptions.deleteUnusedApplicationCommands) {
			console.log(chalk.yellow("Finding unused application commands..."));
			const toDelete = applicationCommands.filter(
				(applicationCommand) => !this.commands.has(applicationCommand.name)
			);

			if (toDelete.size === 0) {
				console.log(chalk.green("No unused application commands found!"));

				return commands.length;
			}

			console.log(
				chalk.yellow(
					`Found ${chalk.cyan(toDelete.size)} unused application commands!`
				)
			);

			for (const applicationCommand of toDelete.values()) {
				console.log(
					chalk.yellow(
						`Deleting application command ${chalk.cyan(
							applicationCommand.name
						)}...`
					)
				);
				const deletedApplicationCommand = await applicationCommand.delete();
				applicationCommands.delete(deletedApplicationCommand.id);
				console.log(
					chalk.green(
						`Deleted application command ${chalk.cyan(
							applicationCommand.name
						)}!`
					)
				);
			}
		}

		return commands.length;
	}

	/**
	 * Fetch all the application commands from the bot
	 * @param guildId The guild to fetch from
	 */
	public async fetchApplicationCommands(
		guildId?: string
	): Promise<Collection<string, ApplicationCommand> | undefined> {
		return this.application?.commands.fetch({
			cache: true,
			force: true,
			guildId
		});
	}
}
