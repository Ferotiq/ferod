/** @format */

import {
  ApplicationCommand,
  ApplicationCommandData,
  ApplicationCommandOption,
  ApplicationCommandPermissions,
  ApplicationCommandSubCommand,
  ApplicationCommandType,
  Collection,
  Snowflake
} from "discord.js";
import { CommandFunction } from "../interfaces/CommandFunction";
import { CommandOptions } from "../interfaces/CommandOptions";
import { Client } from "../structures/Client";
import { Permission } from "../interfaces/Permission";
import { isEmpty } from "lodash";
import { toPascalCase } from "../functions/toPascalCase";

export class Command {
  public name: string;
  public description: string;
  /** @deprecated Deprecated due to message content commands phasing out. */
  public aliases: string[];
  /** @deprecated Deprecated due to message content commands phasing out. */
  public legacyPermissions: Permission[];
  public permissions: ApplicationCommandPermissions[];
  public category: string;
  public guildIDs: Snowflake[];
  public options: ApplicationCommandOption[];
  public type: ApplicationCommandType;
  public run: CommandFunction;

  public constructor(options: CommandOptions) {
    this.name = options.name;
    this.description = options.description;
    this.aliases = options.aliases || [];
    this.legacyPermissions = options.legacyPermissions || [];
    this.permissions = options.permissions || [];
    this.category = options.category;
    this.guildIDs = options.guildIDs || [];
    this.options = options.options || [];
    this.type = options.type || "CHAT_INPUT";
    this.run = options.run;
  }

  public async create(
    client: Client,
    build?: boolean
  ): Promise<ApplicationCommand | ApplicationCommand[]> {
    const applicationCommand = await this.fetch(client);

    if (applicationCommand !== undefined && !build) return applicationCommand;
    const app = isEmpty(this.guildIDs)
      ? await client.application?.commands.create({
          name: this.name,
          description: this.description,
          type: this.type,
          options: this.options
        })
      : await Promise.all(
          this.guildIDs?.map(guildID =>
            client.application?.commands.create(
              {
                name: this.name,
                description: this.description,
                type: this.type,
                options: this.options
              },
              guildID
            )
          )
        );

    if (app === undefined)
      throw Error(`Could not create application command for ${this.name}.`);
    else if (Array.isArray(app) && app.includes(undefined))
      throw Error(
        `Could not create application command for some guilds for ${this.name}.`
      );

    return app as ApplicationCommand | ApplicationCommand[];
  }

  public async fetch(
    client: Client
  ): Promise<ApplicationCommand<{}> | undefined> {
    const applicationCommands = isEmpty(this.guildIDs)
      ? await client.fetchSlashCommands()
      : (
          await Promise.all(
            this.guildIDs?.map(guildID => client.fetchSlashCommands(guildID)) ||
              []
          )
        ).reduce(
          (prev, cur) =>
            prev?.concat(cur || new Collection<string, ApplicationCommand>()),
          new Collection<string, ApplicationCommand>()
        );

    if (applicationCommands === undefined) return undefined;

    const command = applicationCommands.find(
      v =>
        v.name === this.name &&
        (v.guildId !== null
          ? this.guildIDs?.includes(v.guildId) || false
          : true)
    );

    return command;
  }

  public async edit(client: Client): Promise<ApplicationCommand> {
    let slashCommand = await this.fetch(client);

    const toEdit: ApplicationCommandData = (await this.create(
      client,
      true
    )) as ApplicationCommandData;

    if (!slashCommand)
      slashCommand = (await this.create(client, false)) as ApplicationCommand;

    return slashCommand.edit(toEdit);
  }

  public async delete(client: Client): Promise<ApplicationCommand | undefined> {
    const slashCommand = await this.fetch(client);

    if (slashCommand) return slashCommand.delete();

    return undefined;
  }

  public async getUsage(client: Client): Promise<string | undefined> {
    const slashCommand = await this.fetch(client);

    const args = slashCommand?.options;

    if (!args) return undefined;

    const finishedArgs: string[] = [];

    if (args.some(arg => arg.type === "SUB_COMMAND")) {
      const subCommands = args.filter(
        arg => arg.type === "SUB_COMMAND"
      ) as ApplicationCommandSubCommand[];

      finishedArgs.push(
        ...subCommands.map(
          subCommand =>
            `\`${this.name} ${subCommand.name}${
              subCommand.options && subCommand.options.length
                ? " " +
                  subCommand.options
                    .map(
                      option => `<${option.name}: ${toPascalCase(option.type)}>`
                    )
                    .join(" ")
                : ""
            }\``
        )
      );
    }

    if (args.some(arg => arg.type === "SUB_COMMAND_GROUP")) {
      const subCommandGroups = args.filter(
        arg => arg.type === "SUB_COMMAND_GROUP"
      ) as ApplicationCommandOption[];

      subCommandGroups.forEach(subCommandGroup => {
        const name = subCommandGroup.name;

        if (subCommandGroup.type !== "SUB_COMMAND_GROUP") return;

        const subCommands = subCommandGroup.options || [];

        finishedArgs.push(
          ...subCommands.map(
            subCommand =>
              `\`${this.name} ${name} ${subCommand.name}${
                subCommand.options && subCommand.options.length
                  ? " " +
                    subCommand.options
                      .map(
                        option =>
                          `<${option.name}: ${toPascalCase(option.type)}>`
                      )
                      .join(" ")
                  : ""
              }\``
          )
        );
      });
    }

    if (
      !args.some(arg => ["SUB_COMMAND", "SUB_COMMAND_GROUP"].includes(arg.type))
    )
      finishedArgs.push(
        `\`/${this.name} ${args
          .map(arg => `<${arg.name}: ${toPascalCase(arg.type)}>`)
          .join(" ")}\``
      );

    return finishedArgs.join("\n");
  }

  public async getArguments(client: Client): Promise<string | undefined> {
    const slashCommand = await this.fetch(client);

    const args = slashCommand?.options;

    if (!args) return undefined;

    const finishedArgs: string[] = [];

    finishedArgs.push(
      ...args.map(
        arg =>
          `\`${arg.name} (${toPascalCase(arg.type)}${
            // @ts-ignore
            arg.required ? "" : ", optional"
          })\`: ${arg.description}`
      )
    );

    if (args.some(arg => arg.type === "SUB_COMMAND")) {
      const subCommands = args.filter(
        arg => arg.type === "SUB_COMMAND"
      ) as ApplicationCommandSubCommand[];

      subCommands.forEach(subCommand => {
        if (!subCommand.options) return;

        finishedArgs.push(
          ...subCommand.options.map(
            option =>
              `\`${subCommand.name}.${option.name} (${toPascalCase(
                option.type
              )}${option.required ? "" : ", optional"})\`: ${
                option.description
              }`
          )
        );
      });
    }

    if (args.some(arg => arg.type === "SUB_COMMAND_GROUP")) {
      const subCommandGroups = args.filter(
        arg => arg.type === "SUB_COMMAND_GROUP"
      );

      subCommandGroups.forEach(subCommandGroup => {
        if (subCommandGroup.type !== "SUB_COMMAND_GROUP") return;

        const subCommands = subCommandGroup.options || [];

        subCommands.forEach(subCommand => {
          if (!subCommand.options) return;

          finishedArgs.push(
            ...subCommand.options.map(
              option =>
                `\`${subCommand.name}.${option.name} (${toPascalCase(
                  option.type
                )}${option.required ? "" : ", optional"})\`: ${
                  option.description
                }`
            )
          );
        });
      });
    }

    return finishedArgs.join("\n");
  }
}
