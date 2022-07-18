import * as Discord from "discord.js";
import { CommandBuilder } from "./command";
import { EventBuilder } from "./event";
import type { ClientOptions } from "../types";
import glob from "glob";
import { promisify } from "util";
import { existsSync, mkdirSync } from "fs";
import { resolve } from "path";
import _ from "lodash";

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
export class Client<T extends boolean = boolean> extends Discord.Client<T> {
  public declare options: ClientOptions;
  public commands = new Discord.Collection<string, CommandBuilder>();
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
      console.table(
        Object.fromEntries(
          [...this.commands.entries()].map((v) => [
            v[0],
            {
              ...v[1].data,
              type: Discord.ApplicationCommandType[v[1].data.type]
            }
          ])
        ),
        ["description", "type", "options", "category"]
      );
    }

    console.log(
      `Loaded ${this.commands.size} commands and ${events.length} events.`
    );

    this.emit("ready", this as Client<true>);
  }

  /**
   * Loads commands, events, and application commands into the bot.
   */
  public async load(): Promise<EventBuilder[]> {
    this.checkPaths();

    // add commands
    const commandFiles = await this.glob(
      `${this.options.commandsPath}/**/*.{ts,js}`
    );

    const commands = await Promise.all(
      commandFiles.map((fileName) =>
        this.import<CommandBuilder>(fileName, CommandBuilder)
      )
    );

    for (const command of commands) {
      this.commands.set(command.data.name, command);
    }

    this.categories = [...new Set(this.commands.map((v) => v.data.category))];

    // add events
    const eventFiles = await this.glob(
      `${this.options.eventsPath}/**/*.{ts,js}`
    );

    const events = await Promise.all(
      eventFiles.map((fileName) =>
        this.import<EventBuilder>(fileName, EventBuilder)
      )
    );

    for (const event of events) {
      this.on(
        event.data.event,
        event.data.run.bind(null, this as Client<true>)
      );
    }

    const applicationCommands = this.options.dev
      ? await this.fetchApplicationCommands(this.options.devGuildId)
      : await this.fetchApplicationCommands();

    if (applicationCommands) {
      // create/edit application commands
      for (const command of this.commands.values()) {
        const applicationCommand = applicationCommands.find(
          (appCmd) => appCmd.name === command.data.name
        );

        if (applicationCommand === undefined) {
          await command.create(this as Client<true>);

          console.log(`Created application command ${command.data.name}`);

          continue;
        }

        if (!this.options.editApplicationCommands) {
          continue;
        }

        const stripOption = (option: Discord.ApplicationCommandOptionData) =>
          _(option)
            .omitBy(_.isNil)
            .omitBy((v) => Array.isArray(v) && _.isEmpty(v))
            .value();

        const cmdObject = {
          name: applicationCommand.name,
          description: applicationCommand.description,
          type: applicationCommand.type,
          options: applicationCommand.options.map(stripOption)
        };

        const type =
          command.data.type ?? Discord.ApplicationCommandType.ChatInput;

        const description =
          type === Discord.ApplicationCommandType.ChatInput
            ? command.data.description ?? "No description provided"
            : "";

        const commandObject = {
          name: command.data.name,
          description,
          type,
          options: (command.data.options ?? []).map(stripOption)
        };

        if (_.isEqual(cmdObject, commandObject)) {
          continue;
        }

        await applicationCommand.edit({
          ...commandObject,
          options: command.data
            .options as Discord.ApplicationCommandOptionData[]
        });

        console.log(`Edited application command ${command.data.name}`);
      }

      // delete application commands
      for (const applicationCommand of applicationCommands.values()) {
        if (
          this.options.deleteUnusedApplicationCommands &&
          !this.commands.has(applicationCommand.name)
        ) {
          await applicationCommand.delete();

          console.log(`Deleted application command ${applicationCommand.name}`);
        }
      }
    }

    return events;
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
  ): Discord.Collection<string, CommandBuilder> {
    return this.commands.filter((cmd) => cmd.data.category === category);
  }
}
