/** @format */

import {
  ApplicationCommand,
  ApplicationCommandData,
  ApplicationCommandOption,
  ApplicationCommandType,
  Collection,
  Snowflake
} from "discord.js";
import { CommandFunction } from "../interfaces/CommandFunction";
import { CommandOptions } from "../interfaces/CommandOptions";
import { Client } from "../structures/Client";
import { Permission } from "../interfaces/Permission";
import { isEmpty } from "lodash";

export class Command {
  public name: string;
  public description: string;
  /** @deprecated Deprecated due to message content commands phasing out. */
  public aliases: string[];
  /** @deprecated Deprecated due to message content commands phasing out. */
  public permissions: Permission[];
  public category: string;
  public guildIDs: Snowflake[];
  // public build: CommandBuilder;
  public options: ApplicationCommandOption[];
  public type: ApplicationCommandType;
  public run: CommandFunction;

  public constructor(options: CommandOptions) {
    this.name = options.name;
    this.description = options.description;
    this.aliases = options.aliases || [];
    this.permissions = options.permissions || [];
    this.category = options.category;
    this.guildIDs = options.guildIDs || [];
    // this.build = options.build;
    this.options = options.options || [];
    this.type = options.type || "CHAT_INPUT";
    this.run = options.run;
  }

  public async createApplicationCommand(
    client: Client,
    build?: boolean
  ): Promise<ApplicationCommand | ApplicationCommand[]> {
    const applicationCommand = await this.fetchApplicationCommand(client);

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

  public async fetchApplicationCommand(
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
