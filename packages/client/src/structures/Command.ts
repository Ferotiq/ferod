import * as Discord from "discord.js";
import { Client } from "./client";
import { CommandFunction, CommandOptions } from "../types";

/**
 * A class to easily create commands that interop with Fero-DC
 */
export class CommandBuilder<
  T extends Discord.ApplicationCommandType = Discord.ApplicationCommandType.ChatInput
> {
  private _data: Partial<CommandOptions<T>> = {};

  /**
   * The data of this command
   */
  public get data(): Required<CommandOptions<T>> {
    if (
      this._data.name === undefined ||
      this._data.description === undefined ||
      this._data.category === undefined ||
      this._data.run === undefined
    ) {
      throw new Error("Missing required options");
    }

    const options = {
      name: this._data.name,
      description: this._data.description,
      category: this._data.category,
      options: this._data.options ?? [],
      type: this._data.type ?? Discord.ApplicationCommandType.ChatInput,
      run: this._data.run
    };

    return options as Required<CommandOptions<T>>;
  }

  /**
   * Set the name
   */
  public name(name: string): this {
    this._data.name = name;

    return this;
  }

  /**
   * Set the description
   */
  public description(description: string): this {
    this._data.description = description;

    return this;
  }

  /**
   * Sets the category
   */
  public category(category: string): this {
    this._data.category = category;

    return this;
  }

  /**
   * Sets the options
   */
  public options(
    ...options:
      | Discord.ApplicationCommandOptionData[]
      | Discord.ApplicationCommandOptionData[][]
  ): this {
    this._data.options = options.flat();

    return this;
  }

  /**
   * Sets the type
   */
  public type(type: T): this {
    this._data.type = type;

    return this;
  }

  /**
   * Sets the run function
   */
  public run(run: CommandFunction<T>): this {
    this._data.run = run;

    return this;
  }

  /**
   * The application command data from this command
   */
  public get applicationCommandData(): Discord.ApplicationCommandData {
    return {
      name: this.data.name,
      description: this.data.description,
      options: this.data.options,
      type: this.data.type
    };
  }

  /**
   * Creates an application command on Discord from the options of this command
   * @param client The client to create the command on
   */
  public async create(
    client: Client<true>
  ): Promise<Discord.ApplicationCommand | Discord.ApplicationCommand[]> {
    const applicationCommand = await this.fetch(client);

    if (applicationCommand !== undefined) {
      return applicationCommand;
    }

    const app = await (client.options.dev
      ? client.application.commands.create(
          this.applicationCommandData,
          client.options.devGuildId
        )
      : client.application.commands.create(this.applicationCommandData)
    ).catch(() => undefined);

    if (app === undefined) {
      throw Error(
        `Could not create application command for ${this.data.name}.`
      );
    } else if (Array.isArray(app) && app.includes(undefined)) {
      throw Error(
        `Could not create application command for some guilds for ${this.data.name}.`
      );
    }

    return app as Discord.ApplicationCommand | Discord.ApplicationCommand[];
  }

  /**
   * Fetches the command from Discord
   * @param client The client to fetch the command from
   */
  public async fetch(
    client: Client
  ): Promise<Discord.ApplicationCommand | undefined> {
    const applicationCommands = client.options.dev
      ? await client.fetchApplicationCommands(client.options.devGuildId)
      : await client.fetchApplicationCommands();

    if (applicationCommands === undefined) {
      return undefined;
    }

    const command = applicationCommands.find(
      (appCmd) => appCmd.name === this.data.name
    );

    return command;
  }

  /**
   * Edit this application command on Discord with the options of this command
   * @param client The client to edit the command on
   */
  public async edit(client: Client): Promise<Discord.ApplicationCommand> {
    let applicationCommand = await this.fetch(client);

    if (!applicationCommand) {
      applicationCommand = (await this.create(
        client
      )) as Discord.ApplicationCommand;
    }

    return applicationCommand.edit(this.applicationCommandData);
  }

  /**
   * Deletes this command from Discord
   * @param client The client to delete the command on
   */
  public async delete(
    client: Client
  ): Promise<Discord.ApplicationCommand | undefined> {
    const applicationCommand = await this.fetch(client);

    if (applicationCommand) {
      return applicationCommand.delete();
    }

    return undefined;
  }

  /**
   * Outputs a string representation of how to use this command
   * @param client The client to fetch the command from
   */
  public async getUsage(client: Client): Promise<string | undefined> {
    const applicationCommand = await this.fetch(client);

    const args = applicationCommand?.options;

    if (!args) {
      return undefined;
    }

    const finishedArgs: string[] = [];

    if (
      args.some(
        (arg) => arg.type === Discord.ApplicationCommandOptionType.Subcommand
      )
    ) {
      const subCommands = args.filter(
        (arg) => arg.type === Discord.ApplicationCommandOptionType.Subcommand
      ) as Discord.ApplicationCommandSubCommand[];

      finishedArgs.push(
        ...subCommands.map(
          (subCommand) =>
            `\`${this.data.name} ${subCommand.name}${
              subCommand.options && subCommand.options.length
                ? ` ${subCommand.options
                    .map(
                      (option) =>
                        `<${option.name}: ${
                          Discord.ApplicationCommandOptionType[option.type]
                        }>`
                    )
                    .join(" ")}`
                : ""
            }\``
        )
      );
    }

    if (
      args.some(
        (arg) =>
          arg.type === Discord.ApplicationCommandOptionType.SubcommandGroup
      )
    ) {
      const subCommandGroups = args.filter(
        (group) =>
          group.type === Discord.ApplicationCommandOptionType.SubcommandGroup
      ) as Discord.ApplicationCommandSubGroup[];

      for (const subCommandGroup of subCommandGroups) {
        const name = subCommandGroup.name;

        const subCommands = subCommandGroup.options || [];

        finishedArgs.push(
          ...subCommands.map(
            (subCommand) =>
              `\`${this.data.name} ${name} ${subCommand.name}${
                subCommand.options && subCommand.options.length
                  ? ` ${subCommand.options
                      .map(
                        (option) =>
                          `<${option.name}: ${
                            Discord.ApplicationCommandOptionType[option.type]
                          }>`
                      )
                      .join(" ")}`
                  : ""
              }\``
          )
        );
      }
    }

    if (
      !args.some((arg) =>
        ["SUB_COMMAND", "SUB_COMMAND_GROUP"].includes(
          Discord.ApplicationCommandOptionType[arg.type]
        )
      )
    ) {
      finishedArgs.push(
        `\`/${this.data.name} ${args
          .map(
            (arg) =>
              `<${arg.name}: ${Discord.ApplicationCommandOptionType[arg.type]}>`
          )
          .join(" ")}\``
      );
    }

    return finishedArgs.join("\n");
  }

  /**
   * Outputs a string representation of the arguments this command has
   * @param client The client to fetch the command from
   */
  public async getArguments(client: Client): Promise<string | undefined> {
    const applicationCommand = await this.fetch(client);

    const args = applicationCommand?.options;

    if (!args) {
      return undefined;
    }

    const finishedArgs: string[] = [];

    finishedArgs.push(
      ...args.map(
        (arg) =>
          `\`${arg.name} (${Discord.ApplicationCommandOptionType[arg.type]}${
            (arg as Discord.BaseApplicationCommandOptionsData).required
              ? ""
              : ", optional"
          })\`: ${arg.description}`
      )
    );

    if (
      args.some(
        (arg) => arg.type === Discord.ApplicationCommandOptionType.Subcommand
      )
    ) {
      const subCommands = args.filter(
        (arg) => arg.type === Discord.ApplicationCommandOptionType.Subcommand
      ) as Discord.ApplicationCommandSubCommand[];

      for (const subCommand of subCommands) {
        if (!subCommand.options) {
          continue;
        }

        finishedArgs.push(
          ...subCommand.options.map(
            (option) =>
              `\`${subCommand.name}.${option.name} (${
                Discord.ApplicationCommandOptionType[option.type]
              }${option.required ? "" : ", optional"})\`: ${option.description}`
          )
        );
      }
    }

    if (
      args.some(
        (arg) =>
          arg.type === Discord.ApplicationCommandOptionType.SubcommandGroup
      )
    ) {
      const subCommandGroups = args.filter(
        (arg) =>
          arg.type === Discord.ApplicationCommandOptionType.SubcommandGroup
      ) as Discord.ApplicationCommandSubGroup[];

      for (const subCommandGroup of subCommandGroups) {
        const subCommands = subCommandGroup.options || [];

        for (const subCommand of subCommands) {
          if (!subCommand.options) {
            continue;
          }

          finishedArgs.push(
            ...subCommand.options.map(
              (option) =>
                `\`${subCommand.name}.${option.name} (${
                  Discord.ApplicationCommandOptionType[option.type]
                }${option.required ? "" : ", optional"})\`: ${
                  option.description
                }`
            )
          );
        }
      }
    }

    return finishedArgs.join("\n");
  }
}
