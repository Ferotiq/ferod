// imports
// discord.js
import {
  Client as DiscordClient,
  Collection,
  ApplicationCommand,
  FetchApplicationCommandOptions,
  ClientEvents
} from "discord.js";

// structures
import { Command } from "./Command";

// types
import { Event } from "../types";
import { ClientOptions } from "../types";

// file system
import glob from "glob";
import { promisify } from "util";
import { existsSync, mkdirSync } from "fs";
import { resolve } from "path";

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
class Client extends DiscordClient {
  public declare options: ClientOptions;
  public commands = new Collection<string, Command>();
  public categories: string[] = [];
  private glob = promisify(glob);

  /**
   * Creates a new client
   * @param options The options for the client
   * @param dirname The path that the client is being constructed from (necessary for loading commands/events)
   */
  public constructor(options: ClientOptions, dirname: string) {
    super(options);

    if (dirname !== undefined) {
      options.commandsPath = resolve(dirname, options.commandsPath);
      options.eventsPath = resolve(dirname, options.eventsPath);
    }

    this.options = options;
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
   */
  private async import<T>(path: string): Promise<T> {
    return (await import(path)).default || (await import(path));
  }

  /**
   * (Re)loads commands, events, and slash commands into the bot.
   */
  public async reload(): Promise<string> {
    this.checkPaths();

    // add commands
    const commandFiles = await this.glob(
      `${this.options.commandsPath}/**/*{.ts,.js}`
    );

    const commands = await Promise.all(
      commandFiles.map((fileName) => this.import<Command>(fileName))
    );

    commands.forEach(async (command) => {
      this.commands.set(command.name, command);

      await command.constructPermissions(this);
    });

    this.categories = [...new Set(this.commands.map((v) => v.category))];

    // // help command
    // if (
    //   (this.options.builtInHelpCommand === "js" ||
    //     this.options.builtInHelpCommand === "ts") &&
    //   !commands.find((cmd) => cmd.name === "help")
    // ) {
    //   copyFileSync(
    //     join(
    //       __dirname,
    //       "../../",
    //       this.options.builtInHelpCommand === "ts" ? "src" : "dist",
    //       "commands",
    //       `help.${this.options.builtInHelpCommand}`
    //     ),
    //     join(
    //       this.options.commandsPath,
    //       `help.${this.options.builtInHelpCommand}`
    //     )
    //   );
    // }

    if (this.options.commandLoadedMessage) {
      console.table(Object.fromEntries(this.commands), [
        "description",
        "type",
        "options",
        "category",
        "guilds"
      ]);
    }

    // add events
    const eventFiles = await this.glob(
      `${this.options.eventsPath}/**/*{.ts,.js}`
    );

    const events = await Promise.all(
      eventFiles.map((fileName) =>
        this.import<Event<keyof ClientEvents>>(fileName)
      )
    );

    events.forEach((event) => this.on(event.event, event.run.bind(null, this)));

    if (this.options.eventLoadedMessage) {
      console.table(
        Object.fromEntries(events.map((event) => [event.event, event])),
        ["run"]
      );
    }

    await this.login(this.options.token);

    const slashCommands = await this.fetchSlashCommands();

    let uploadedSlashCommands = 0,
      deletedSlashCommands = 0;

    if (slashCommands) {
      // edit slash commands
      this.commands.forEach(async (cmd) => {
        const slashCommand = slashCommands.find(
          (slash) =>
            cmd.name === slash.name &&
            (slash.guildId ? cmd.guilds.includes(slash.guildId) : cmd.global)
        );

        if (slashCommand && this.options.editSlashCommands) {
          cmd.edit(this);

          uploadedSlashCommands++;
        } else if (!slashCommand) {
          const newSlashCommands = await cmd.create(this);

          if (Array.isArray(newSlashCommands)) {
            newSlashCommands.forEach((newSlashCommand) =>
              newSlashCommand.permissions.set({ permissions: cmd.permissions })
            );
          } else {
            newSlashCommands.permissions.set({ permissions: cmd.permissions });
          }

          uploadedSlashCommands++;
        }
      });

      // delete slash commands
      slashCommands.forEach((slashCommand) => {
        if (
          this.options.deleteUnusedSlashCommands &&
          !this.commands.find((cmd) => cmd.name === slashCommand.name)
        ) {
          slashCommand.delete();
          deletedSlashCommands++;
        }
      });
    }

    return `Reloaded ${commandFiles.length} commands;\nReloaded ${eventFiles.length} events;\nUpdated/Uploaded ${uploadedSlashCommands} slash commands;\nDeleted ${deletedSlashCommands} slash commands;`;
  }

  /**
   * Fetch all the slash commands from the bot
   * @param guildID The guild to fetch from
   */
  public async fetchSlashCommands(
    guildID?: string
  ): Promise<Collection<string, ApplicationCommand> | undefined> {
    const options: FetchApplicationCommandOptions = {
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
  public getCommandsByCategory(category: string): Collection<string, Command> {
    return this.commands.filter((cmd) => cmd.category === category);
  }
}

// exports
export { Client };
