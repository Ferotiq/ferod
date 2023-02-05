import * as Discord from "discord.js";
import * as fs from "fs";
import glob from "glob";
import _ from "lodash";
import { resolve } from "path";
import { pathToFileURL } from "url";
import { promisify } from "util";
import type { ClientOptions } from "../types";
import { quickClean } from "../util/misc";
import { Command } from "./command";
import { EventListener } from "./event-listener";

/**
 * A simple yet powerful Discord.JS client that automates many features for you
 */
export class Client<T extends boolean = boolean> extends Discord.Client<T> {
  // With how Discord.JS now defines Client.prototype.options, we cannot override it.
  public clientOptions: ClientOptions;
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

    this.clientOptions = {
      ...options,
      commandsPath: resolve(dirname, options.commandsPath),
      eventListenersPath: resolve(dirname, options.eventListenersPath)
    };

    if (options.dev && !options.devGuildId) {
      throw new Error(
        "You must provide a dev guild id if you are in dev mode."
      );
    }
  }

  /**
   * Checks and adds commands/events folders.
   */
  private checkPaths() {
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
   * Imports a file and returns the generic type
   * @param path The path to import
   * @param expectedClass The class to check against
   */
  private async import<T>(path: string, expectedClass?: any): Promise<T> {
    const file = await import(path);
    const obj: T = file.default ?? file;

    if (expectedClass !== undefined && !(obj instanceof expectedClass)) {
      throw new Error(`${path} does not export ${expectedClass.name}`);
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

    if (this.clientOptions.commandLoadedMessage) {
      const commandEntries = this.commands.map((command, name) => [
        name,
        {
          ...command.data,
          type: Discord.ApplicationCommandType[command.data.type]
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
    const commandFiles = await this.glob(
      pathToFileURL(
        `${this.clientOptions.commandsPath}/**/*.{ts,js}`
      ).toString()
    );

    const commands = await Promise.all(
      commandFiles.map((fileName) => this.import<Command>(fileName, Command))
    );

    for (const command of commands) {
      this.commands.set(command.data.name, command);
    }

    this.categories = [
      ...new Set(this.commands.map((command) => command.data.category))
    ];

    // add events
    const eventFiles = await this.glob(
      pathToFileURL(
        `${this.clientOptions.eventListenersPath}/**/*.{ts,js}`
      ).toString()
    );

    const events = await Promise.all(
      eventFiles.map((fileName) =>
        this.import<EventListener>(fileName, EventListener)
      )
    );

    for (const event of events) {
      this.on(
        event.data.event,
        event.data.listener.bind(null, this as Client<true>)
      );
    }

    const applicationCommands = this.clientOptions.dev
      ? await this.fetchApplicationCommands(this.clientOptions.devGuildId)
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

        if (!this.clientOptions.editApplicationCommands) {
          continue;
        }

        const type =
          command.data.type ?? Discord.ApplicationCommandType.ChatInput;

        const description =
          type === Discord.ApplicationCommandType.ChatInput
            ? command.data.description ?? "No description provided"
            : "";

        const toEdit = quickClean({
          name: command.data.name,
          description,
          type,
          options: command.data.options ?? []
        });

        if (
          _.isEqual(
            toEdit,
            quickClean({
              name: applicationCommand.name,
              description: applicationCommand.description,
              type: applicationCommand.type,
              options: applicationCommand.options
            })
          )
        ) {
          continue;
        }

        await applicationCommand.edit({
          ...toEdit,
          options: command.data.options
        });

        console.log(`Edited application command ${command.data.name}`);
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
            .filter((appCmd) => !this.commands.has(appCmd.name))
            .values()
        ];

        for (const applicationCommand of toDelete) {
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
  ): Discord.Collection<string, Command> {
    return this.commands.filter((cmd) => cmd.data.category === category);
  }
}
