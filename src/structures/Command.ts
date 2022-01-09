/** @format */

import { ApplicationCommand, ApplicationCommandData } from "discord.js";
import { CommandBuilder } from "../interfaces/CommandBuilder";
import { CommandFunction } from "../interfaces/CommandFunction";
import { CommandOptions } from "../interfaces/CommandOptions";
import { Client } from "../structures/Client";
import { SlashCommandBuilder } from "@discordjs/builders";
import { RESTPostAPIApplicationCommandsJSONBody } from "discord-api-types";
import { Permission } from "../interfaces/Permission";

export class Command {
  public name: string;
  public description: string;
  /** @deprecated Deprecated due to message content commands phasing out. */
  public aliases: string[] | undefined;
  /** @deprecated Deprecated due to message content commands phasing out. */
  public permissions: Permission[] | undefined;
  public category: string;
  public guildID: string | undefined;
  public build: CommandBuilder;
  public run: CommandFunction;

  public constructor(options: CommandOptions) {
    this.name = options.name;
    this.description = options.description;
    this.aliases = options.aliases;
    this.permissions = options.permissions;
    this.category = options.category;
    this.guildID = options.guildID;
    this.build = options.build;
    this.run = options.run;
  }

  public async createApplicationCommand(
    client: Client,
    build?: boolean
  ): Promise<ApplicationCommand | RESTPostAPIApplicationCommandsJSONBody> {
    const applicationCommand = await this.fetchApplicationCommand(client);

    if (applicationCommand !== undefined && !build) return applicationCommand;

    const builder = new SlashCommandBuilder();

    builder.setName(this.name);

    builder.setDescription(this.description);

    const newBuilder = await this.build(builder);

    const command = newBuilder.toJSON();

    if (build === true) return command;

    const app = await client.application?.commands.create(
      command,
      this.guildID
    );

    if (app === undefined)
      throw Error(`Could not create application command for ${this.name}.`);

    return app;
  }

  public async fetchApplicationCommand(
    client: Client
  ): Promise<ApplicationCommand<{}> | undefined> {
    const applicationCommands = await client.fetchSlashCommands(this.guildID);

    if (applicationCommands === undefined) return undefined;

    const command = applicationCommands.find(
      v =>
        v.name === this.name &&
        (v.guildId !== null ? v.guildId === this.guildID : true)
    );

    return command;
  }

  public async editApplicationCommand(
    client: Client
  ): Promise<ApplicationCommand> {
    let slashCommand = await this.fetchApplicationCommand(client);

    const toEdit: ApplicationCommandData = (await this.createApplicationCommand(
      client,
      true
    )) as ApplicationCommandData;

    if (!slashCommand)
      slashCommand = (await this.createApplicationCommand(
        client,
        false
      )) as ApplicationCommand;

    return slashCommand.edit(toEdit);
  }

  public async deleteApplicationCommand(
    client: Client
  ): Promise<ApplicationCommand | undefined> {
    const slashCommand = await this.fetchApplicationCommand(client);

    if (slashCommand) return slashCommand.delete();

    return undefined;
  }
}
