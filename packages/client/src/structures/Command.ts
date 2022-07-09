import {
  ApplicationCommand,
  ApplicationCommandData,
  ApplicationCommandOptionData,
  ApplicationCommandSubCommand,
  ApplicationCommandSubGroup,
  ApplicationCommandType,
  BaseApplicationCommandOptionsData,
  Collection,
  Snowflake
} from "discord.js";

import { Client } from "../structures/Client";
import { isEmpty } from "lodash";
import { toPascalCase } from "../util/toPascalCase";
import { CommandOptions, GenericCommandFunction } from "../types";

/**
 * A class to easily create commands that interop with Fero-DC
 */
export class Command {
  public name: string;
  public description: string;
  public category: string;
  public guilds: Snowflake[];
  public options: ApplicationCommandOptionData[];
  public type: ApplicationCommandType;
  public run: GenericCommandFunction;

  /**
   * Creates a new command
   * @param options A config that contains the options for the command
   */
  public constructor(options: CommandOptions) {
    this.name = options.name;
    this.description = options.description;
    this.category = options.category;
    this.guilds = options.guilds ?? [];
    this.options = options.options || [];
    this.type = options.type ?? "CHAT_INPUT";
    this.run = options.run;
  }

  /**
   * The application command data from this command
   */
  public get applicationCommandData(): ApplicationCommandData {
    return {
      name: this.name,
      description: this.description,
      options: this.options,
      type: this.type
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

    const app = isEmpty(this.guilds)
      ? await client.application.commands
          .create(this.applicationCommandData)
          .catch(() => undefined)
      : await Promise.all(
          this.guilds.map((guildID) =>
            client.application.commands
              .create(this.applicationCommandData, guildID)
              .catch(() => undefined)
          )
        );

    if (app === undefined) {
      throw Error(`Could not create application command for ${this.name}.`);
    } else if (Array.isArray(app) && app.includes(undefined)) {
      throw Error(
        `Could not create application command for some guilds for ${this.name}.`
      );
    }

    return app as ApplicationCommand | ApplicationCommand[];
  }

  /**
   * Fetches the command from Discord
   * @param client The client to fetch the command from
   */
  public async fetch(client: Client): Promise<ApplicationCommand | undefined> {
    const applicationCommands = isEmpty(this.guilds)
      ? await client.fetchApplicationCommands()
      : (
          await Promise.all(
            this.guilds?.map((guildID) =>
              client.fetchApplicationCommands(guildID)
            ) || []
          )
        ).reduce(
          (prev, cur) =>
            prev?.concat(cur ?? new Collection<string, ApplicationCommand>()),
          new Collection<string, ApplicationCommand>()
        );

    if (applicationCommands === undefined) {
      return undefined;
    }

    const command = applicationCommands.find(
      (v) =>
        v.name === this.name &&
        (v.guildId !== null ? this.guilds?.includes(v.guildId) || false : true)
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
    const slashCommand = await this.fetch(client);

    if (slashCommand) {
      return slashCommand.delete();
    }

    return undefined;
  }

  /**
   * Outputs a string representation of how to use this command
   * @param client The client to fetch the command from
   */
  public async getUsage(client: Client): Promise<string | undefined> {
    const slashCommand = await this.fetch(client);

    const args = slashCommand?.options;

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
            `\`${this.name} ${subCommand.name}${
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
              `\`${this.name} ${name} ${subCommand.name}${
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
        `\`/${this.name} ${args
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
    const slashCommand = await this.fetch(client);

    const args = slashCommand?.options;

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
