import {
  ApplicationCommand,
  ApplicationCommandData,
  ApplicationCommandOptionData,
  ApplicationCommandSubCommand,
  ApplicationCommandSubGroup,
  ApplicationCommandType,
  BaseApplicationCommandOptionsData
} from "discord.js";

import { Client } from "./client";
import { toPascalCase } from "../util/toPascalCase";
import { CommandFunction, CommandOptions } from "../types";

/**
 * A class to easily create commands that interop with Fero-DC
 */
export class Command<T extends ApplicationCommandType = "CHAT_INPUT"> {
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
      type: this._data.type ?? "CHAT_INPUT",
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
  public options(options: ApplicationCommandOptionData[]): this {
    this._data.options = options;

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
  public get applicationCommandData(): ApplicationCommandData {
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
  ): Promise<ApplicationCommand | ApplicationCommand[]> {
    const applicationCommand = await this.fetch(client);

    if (applicationCommand !== undefined) {
      return applicationCommand;
    }

    const app = await (client.options.dev
      ? client.application.commands.create(
          this.applicationCommandData,
          client.options.devGuildID
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

    return app as ApplicationCommand | ApplicationCommand[];
  }

  /**
   * Fetches the command from Discord
   * @param client The client to fetch the command from
   */
  public async fetch(client: Client): Promise<ApplicationCommand | undefined> {
    const applicationCommands = client.options.dev
      ? await client.fetchApplicationCommands(client.options.devGuildID)
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
  public async edit(client: Client): Promise<ApplicationCommand> {
    let applicationCommand = await this.fetch(client);

    if (!applicationCommand) {
      applicationCommand = (await this.create(client)) as ApplicationCommand;
    }

    return applicationCommand.edit(this.applicationCommandData);
  }

  /**
   * Deletes this command from Discord
   * @param client The client to delete the command on
   */
  public async delete(client: Client): Promise<ApplicationCommand | undefined> {
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

    if (args.some((arg) => arg.type === "SUB_COMMAND")) {
      const subCommands = args.filter(
        (arg) => arg.type === "SUB_COMMAND"
      ) as ApplicationCommandSubCommand[];

      finishedArgs.push(
        ...subCommands.map(
          (subCommand) =>
            `\`${this.data.name} ${subCommand.name}${
              subCommand.options && subCommand.options.length
                ? ` ${subCommand.options
                    .map(
                      (option) =>
                        `<${option.name}: ${toPascalCase(option.type)}>`
                    )
                    .join(" ")}`
                : ""
            }\``
        )
      );
    }

    if (args.some((arg) => arg.type === "SUB_COMMAND_GROUP")) {
      const subCommandGroups = args.filter(
        (group) => group.type === "SUB_COMMAND_GROUP"
      ) as ApplicationCommandSubGroup[];

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
                          `<${option.name}: ${toPascalCase(option.type)}>`
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
        ["SUB_COMMAND", "SUB_COMMAND_GROUP"].includes(arg.type)
      )
    ) {
      finishedArgs.push(
        `\`/${this.data.name} ${args
          .map((arg) => `<${arg.name}: ${toPascalCase(arg.type)}>`)
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
          `\`${arg.name} (${toPascalCase(arg.type)}${
            (arg as BaseApplicationCommandOptionsData).required
              ? ""
              : ", optional"
          })\`: ${arg.description}`
      )
    );

    if (args.some((arg) => arg.type === "SUB_COMMAND")) {
      const subCommands = args.filter(
        (arg) => arg.type === "SUB_COMMAND"
      ) as ApplicationCommandSubCommand[];

      for (const subCommand of subCommands) {
        if (!subCommand.options) {
          continue;
        }

        finishedArgs.push(
          ...subCommand.options.map(
            (option) =>
              `\`${subCommand.name}.${option.name} (${toPascalCase(
                option.type
              )}${option.required ? "" : ", optional"})\`: ${
                option.description
              }`
          )
        );
      }
    }

    if (args.some((arg) => arg.type === "SUB_COMMAND_GROUP")) {
      const subCommandGroups = args.filter(
        (arg) => arg.type === "SUB_COMMAND_GROUP"
      ) as ApplicationCommandSubGroup[];

      for (const subCommandGroup of subCommandGroups) {
        const subCommands = subCommandGroup.options || [];

        for (const subCommand of subCommands) {
          if (!subCommand.options) {
            continue;
          }

          finishedArgs.push(
            ...subCommand.options.map(
              (option) =>
                `\`${subCommand.name}.${option.name} (${toPascalCase(
                  option.type
                )}${option.required ? "" : ", optional"})\`: ${
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
