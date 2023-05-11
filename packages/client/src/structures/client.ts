import chalk from "chalk";
import {
	ApplicationCommand,
	ApplicationCommandType,
	Collection,
	Client as DiscordClient,
	IntentsBitField,
} from "discord.js";
import * as fs from "fs";
import path from "path";
import { equals } from "remeda";
import type { ClientOptions } from "../types.js";
import { importFiles, quickClean } from "../utils/misc.js";
import { Command } from "./command.js";
import { EventListener } from "./event-listener.js";

/**
 * A simple yet powerful Discord.JS client that automates many features for you
 */
export class Client<T extends boolean = boolean> extends DiscordClient<T> {
	public declare options: Omit<ClientOptions, "intents"> & {
		intents: IntentsBitField;
	};
	public commands = new Collection<string, Command<ApplicationCommandType>>();
	public categories = new Set<string>();

	/**
	 * Creates a new client
	 * @param options The options for the client
	 * @param dirname The path that the client is being constructed from (necessary for loading commands/events)
	 */
	public constructor(options: ClientOptions, dirname: string) {
		super(options);

		this.options.commandsPath = path.resolve(dirname, options.commandsPath);
		this.options.eventListenersPath = path.resolve(
			dirname,
			options.eventListenersPath,
		);

		if (options.dev && !options.devGuildId) {
			throw new Error("devGuildId must be provided if dev is set to true.");
		}
	}

	/**
	 * Checks and adds commands/events folders.
	 */
	private checkPaths(): void {
		// commands
		if (!fs.existsSync(this.options.commandsPath)) {
			console.log(
				chalk.yellow("The commands directory does not exist. Creating..."),
			);
			fs.mkdirSync(this.options.commandsPath, { recursive: true });
			console.log(
				chalk.green("The commands directory has been created successfully!"),
			);
		}

		// events
		if (!fs.existsSync(this.options.eventListenersPath)) {
			console.log(
				chalk.yellow("The events directory does not exist. Creating..."),
			);
			fs.mkdirSync(this.options.eventListenersPath, { recursive: true });
			console.log(
				chalk.green(
					"The event listeners directory has been created successfully!",
				),
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
			chalk.green(`Loaded ${chalk.magenta(eventListenerCount)} events!`),
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
					this.options.eventListenersPath,
				)}...`,
			),
		);
		const listeners = await importFiles<EventListener>(
			path.resolve(this.options.eventListenersPath, "**", "*.{ts,js}"),
			EventListener,
		);
		console.log(
			chalk.green(`Loaded ${chalk.magenta(listeners.length)} files!`),
		);

		for (const listener of listeners) {
			console.log(
				chalk.yellow(
					`Registering event listener for ${chalk.magenta(listener.event)}...`,
				),
			);
			// TODO: Fix this
			// This only shows an error in Visual Studio Code, but it works fine.
			// eslint-disable-next-line @typescript-eslint/ban-ts-comment
			// @ts-ignore
			this.on(
				listener.event,
				listener.handler.bind(null, this as Client<true>),
			);
			console.log(
				chalk.green(
					`Registered event listener for ${chalk.magenta(listener.event)}!`,
				),
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
				`Loading files from ${chalk.cyan(this.options.commandsPath)}`,
			),
		);
		const commands = await importFiles<Command>(
			path.resolve(this.options.commandsPath, "**", "*.{ts,js}"),
			Command,
		);
		console.log(chalk.green(`Loaded ${chalk.cyan(commands.length)} files!`));

		for (const command of commands) {
			console.log(
				chalk.yellow(`Loading command ${chalk.cyan(command.name)}...`),
			);
			this.commands.set(command.name, command);
			this.categories.add(command.category);
			console.log(chalk.green(`Loaded command ${chalk.cyan(command.name)}!`));
		}

		console.log(chalk.yellow("Registering application commands..."));
		const applicationCommands = this.options.dev
			? await this.fetchApplicationCommands(this.options.devGuildId)
			: await this.fetchApplicationCommands();

		if (applicationCommands === undefined) {
			console.error(chalk.red("Failed to fetch application commands!"));
			return commands.length;
		}

		// create/edit application commands
		for (const command of this.commands.values()) {
			console.log(
				chalk.yellow(
					`Fetching application command for ${chalk.cyan(command.name)}...`,
				),
			);
			const applicationCommand = applicationCommands.find(
				(appCommand) => appCommand.name === command.name,
			);

			if (applicationCommand === undefined) {
				console.log(
					chalk.yellow(
						`Application command for ${chalk.cyan(
							command.name,
						)} not found! Creating...`,
					),
				);
				const createdApplicationCommand = await command.create(
					this as Client<true>,
				);
				if (createdApplicationCommand === undefined) {
					console.error(
						chalk.red(
							`Failed to create application command for ${chalk.cyan(
								command.name,
							)}!`,
						),
					);

					continue;
				}
				applicationCommands.set(
					createdApplicationCommand.id,
					createdApplicationCommand,
				);
				console.log(
					chalk.green(
						`Created application command for ${chalk.cyan(command.name)}!`,
					),
				);

				continue;
			}

			console.log(
				chalk.green(
					`Found application command for ${chalk.cyan(command.name)}!`,
				),
			);
			if (!this.options.editApplicationCommands) {
				continue;
			}
			console.log(
				chalk.yellow(
					`Checking if application command for ${chalk.cyan(
						command.name,
					)} matches...`,
				),
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
				options: applicationCommand.options,
			});
			const cleanedLocalCommand = quickClean({
				name: command.name,
				description,
				type,
				defaultMemberPermissions: command.permissions.valueOf(),
				options: command.options,
			});

			if (equals(cleanedLocalCommand, cleanedApplicationCommand)) {
				console.log(
					chalk.green(
						`Application command for ${chalk.cyan(command.name)} matches!`,
					),
				);

				continue;
			}

			console.log(
				chalk.yellow(
					`Application command for ${chalk.cyan(
						command.name,
					)} does not match ${chalk.cyan(command.name)}! Editing...`,
				),
			);
			const editedApplicationCommand = await applicationCommand.edit(
				cleanedLocalCommand,
			);
			applicationCommands.set(
				editedApplicationCommand.id,
				editedApplicationCommand,
			);
			console.log(
				chalk.green(
					`Edited application command for ${chalk.cyan(command.name)}!`,
				),
			);
		}

		// delete application commands
		if (this.options.deleteUnusedApplicationCommands) {
			console.log(chalk.yellow("Finding unused application commands..."));
			const toDelete = applicationCommands.filter(
				(applicationCommand) => !this.commands.has(applicationCommand.name),
			);

			if (toDelete.size === 0) {
				console.log(chalk.green("No unused application commands found!"));

				return commands.length;
			}

			console.log(
				chalk.yellow(
					`Found ${chalk.cyan(toDelete.size)} unused application commands!`,
				),
			);

			for (const applicationCommand of toDelete.values()) {
				console.log(
					chalk.yellow(
						`Deleting application command ${chalk.cyan(
							applicationCommand.name,
						)}...`,
					),
				);
				const deletedApplicationCommand = await applicationCommand.delete();
				applicationCommands.delete(deletedApplicationCommand.id);
				console.log(
					chalk.green(
						`Deleted application command ${chalk.cyan(
							applicationCommand.name,
						)}!`,
					),
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
		guildId?: string,
	): Promise<Collection<string, ApplicationCommand> | undefined> {
		return this.application?.commands.fetch({
			cache: true,
			force: true,
			guildId,
		});
	}
}
