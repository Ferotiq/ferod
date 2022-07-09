// imports
// discord.js
import * as Discord from "discord.js";

// structures
import { Command } from "./Command";

// types
import type { ClientOptions, GenericEvent } from "../types";

// file system
import glob from "glob";
import { promisify } from "util";
import { existsSync, mkdirSync } from "fs";
import { resolve } from "path";
import { isEqual } from "lodash";
import { Event } from "./Event";

/**
 * A simple yet powerful client that extends Discord.JS's client and automates many features for you
 * @example
 * ```ts
 * import { Client } from "fero-dc";
 * import { config } from "dotenv";
 * import conf from "./config.json";
 * import { join } from "path";
 *
 * // load .env
 * config();
 *
 * // setting token
 * const options = { ...conf, token: process.env.TOKEN };
 *
 * // create a new client
 * const client = new Client(options, __dirname);
 *
 * // start the client
 * client.start();
 * ```
 */
class Client<T extends boolean = boolean> extends Discord.Client<T> {
  public declare options: ClientOptions;
  public commands = new Discord.Collection<string, Command>();
  public categories: string[] = [];
  private glob = promisify(glob);

  /**
   * Creates a new client
   * @param options The options for the client
   * @param dirname The path that the client is being constructed from (necessary for loading commands/events)
   */
  public constructor(options: ClientOptions, dirname: string) {
    super(options);

    this.options = options;

    if (dirname !== undefined) {
      this.options.commandsPath = resolve(dirname, options.commandsPath);
      this.options.eventsPath = resolve(dirname, options.eventsPath);
    }
  }

  /**
   * Checks and adds commands/events folders.
   */
  private checkPaths() {
    // commands
    if (!existsSync(this.options.commandsPath)) {
      mkdirSync(this.options.commandsPath, { recursive: true });
      console.warn(
        "The commands directory has been created using the path provided."
      );
    }

    // events
    if (!existsSync(this.options.eventsPath)) {
      mkdirSync(this.options.eventsPath, { recursive: true });
      console.warn(
        "The events directory has been created using the path provided."
      );
    }
  }

  /**
   * Imports a file and returns the generic type
   * @param path The path to import
   * @param expectedClass The class to check against
   */
  private async import<T>(path: string, expectedClass?: any): Promise<T> {
    const file = await import(path);
    const obj: T = file.default ?? file;

    if (expectedClass !== undefined && !(obj instanceof expectedClass)) {
      throw new Error(`${path} does not return ${expectedClass.name}`);
    }

    return obj;
  }

  /**
   * Starts the client
   * @param token The token to use for the client
   */
  public async start(token: string): Promise<void> {
    await this.login(token);

    const events = await this.load();

    if (this.options.commandLoadedMessage) {
      console.table(Object.fromEntries(this.commands), [
        "description",
        "type",
        "options",
        "category",
        "guilds"
      ]);
    }

    console.log(
      `Loaded ${this.commands.size} commands and ${events.length} events.`
    );
  }

  /**
   * Loads commands, events, and application commands into the bot.
   */
  public async load(): Promise<GenericEvent[]> {
    this.checkPaths();

    // add commands
    const commandFiles = await this.glob(
      `${this.options.commandsPath}/**/*.{ts,js}`
    );

    const commands = await Promise.all(
      commandFiles.map((fileName) => this.import<Command>(fileName, Command))
    );

    for (const command of commands) {
      this.commands.set(command.name, command);
    }

    this.categories = [...new Set(this.commands.map((v) => v.category))];

    // add events
    const eventFiles = await this.glob(
      `${this.options.eventsPath}/**/*.{ts,js}`
    );

    const events = await Promise.all(
      eventFiles.map((fileName) => this.import<GenericEvent>(fileName, Event))
    );

    for (const event of events) {
      this.on(event.event, event.run.bind(null, this as Client<true>));
    }

    const applicationCommands = await this.fetchApplicationCommands();

    if (applicationCommands) {
      // create/edit application commands
      for (const command of this.commands.values()) {
        const applicationCommand = applicationCommands.find(
          (appCmd) =>
            command.name === appCmd.name &&
            appCmd.guildId !== null &&
            command.guilds.includes(appCmd.guildId)
        );

        if (applicationCommand === undefined) {
          command.create(this as Client<true>);

          continue;
        }

        if (!this.options.editApplicationCommands) {
          continue;
        }

        if (
          !isEqual(command.applicationCommandData, {
            name: applicationCommand.name,
            description: applicationCommand.description,
            options: applicationCommand.options,
            type: applicationCommand.type
          })
        ) {
          continue;
        }

        command.edit(this);
      }

      // delete application commands
      for (const applicationCommand of applicationCommands.values()) {
        if (
          this.options.deleteUnusedApplicationCommands &&
          !this.commands.find((cmd) => cmd.name === applicationCommand.name)
        ) {
          applicationCommand.delete();
        }
      }
    }

    return events;
  }

  /**
   * Fetch all the application commands from the bot
   * @param guildID The guild to fetch from
   */
  public async fetchApplicationCommands(
    guildID?: string
  ): Promise<
    Discord.Collection<string, Discord.ApplicationCommand> | undefined
  > {
    const options: Discord.FetchApplicationCommandOptions = {
      cache: true,
      force: true
    };

    if (guildID) {
      options.guildId = guildID;
    }

    const commands = await this.application?.commands.fetch(options);

    return commands;
  }

  /**
   * Gets all the commands that are in the specified category
   * @param category The category to get commands from
   */
  public getCommandsByCategory(
    category: string
  ): Discord.Collection<string, Command> {
    return this.commands.filter((cmd) => cmd.category === category);
  }
}

// exports
export { Client };
