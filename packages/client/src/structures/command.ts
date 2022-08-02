import * as Discord from "discord.js";
import { Client } from "./client";
import { CommandFunction, CommandOptions, Option } from "../types";

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

    return app;
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
   */
  public getUsage(): string {
    const optionTree = this.getOptionsTree();

    const lines: string[] = optionTree.map(
      (options) =>
        `\`/${this.data.name} ${options
          .map((option) => {
            if (
              [
                Discord.ApplicationCommandOptionType.SubcommandGroup,
                Discord.ApplicationCommandOptionType.Subcommand
              ].includes(option.type)
            ) {
              return option.name;
            }

            const name = option.optional ? `[${option.name}]` : option.name;

            return `<${name}>`;
          })
          .join(" ")}\``
    );

    return lines.join("\n");
  }

  /**
   * Outputs a string representation of the arguments this command has
   */
  public getArguments(): string {
    const lines: string[] = [];

    for (const options of this.getOptionsTree()) {
      for (const option of options) {
        if (
          option.type === Discord.ApplicationCommandOptionType.SubcommandGroup
        ) {
          const line = `\`${option.name}\`: ${option.description}`;

          if (!lines.includes(line)) {
            lines.push(line);
          }
        } else if (
          option.type === Discord.ApplicationCommandOptionType.Subcommand
        ) {
          const subCommandGroup = options[0];

          const line =
            subCommandGroup &&
            subCommandGroup.type ===
              Discord.ApplicationCommandOptionType.SubcommandGroup
              ? `\`${subCommandGroup.name} ${option.name}\`: ${option.description}`
              : `\`${option.name}\`: ${option.description}`;

          lines.push(line);
        } else {
          const subCommandGroup = options[0];
          const subCommand = options[1];

          let line = "`";

          if (
            subCommandGroup &&
            subCommandGroup.type ===
              Discord.ApplicationCommandOptionType.SubcommandGroup
          ) {
            line += `${subCommandGroup.name} `;
          }

          if (
            subCommand &&
            subCommand.type === Discord.ApplicationCommandOptionType.Subcommand
          ) {
            line += `${subCommand.name} `;
          }

          const name = option.optional ? `[${option.name}]` : option.name;

          line += `${name} (${
            Discord.ApplicationCommandOptionType[option.type]
          })\`: ${option.description}`;

          lines.push(line);
        }
      }
    }

    return lines.join("\n");
  }

  /**
   * Convert this command's options to a tree
   */
  public getOptionsTree(): Option[][] {
    const options = this.data.options;

    const tree: Option[][] = [];

    if (
      options.some(
        (option) =>
          option.type === Discord.ApplicationCommandOptionType.SubcommandGroup
      )
    ) {
      const subCommandGroups = options.filter(
        (option) =>
          option.type === Discord.ApplicationCommandOptionType.SubcommandGroup
      ) as Discord.ApplicationCommandSubGroup[];

      for (const subCommandGroup of subCommandGroups) {
        const subCommands = (subCommandGroup.options ??
          []) as Discord.ApplicationCommandSubCommand[];

        for (const subCommand of subCommands) {
          if (!subCommand.options) {
            continue;
          }

          tree.push([
            {
              name: subCommandGroup.name,
              description: subCommandGroup.description,
              type: subCommandGroup.type,
              optional: true
            },
            {
              name: subCommand.name,
              description: subCommand.description,
              type: subCommand.type,
              optional: true
            },
            ...subCommand.options.map(
              ({ name, description, type, required }) => ({
                name,
                description,
                type,
                optional: !required
              })
            )
          ]);
        }
      }
    } else if (
      options.some(
        (option) =>
          option.type === Discord.ApplicationCommandOptionType.Subcommand
      )
    ) {
      const subCommands = options.filter(
        (option) =>
          option.type === Discord.ApplicationCommandOptionType.Subcommand
      ) as Discord.ApplicationCommandSubCommand[];

      for (const subCommand of subCommands) {
        if (!subCommand.options) {
          continue;
        }

        tree.push([
          {
            name: subCommand.name,
            description: subCommand.description,
            type: subCommand.type,
            optional: true
          },
          ...subCommand.options.map(
            ({ name, description, type, required }) => ({
              name,
              description,
              type,
              optional: !required
            })
          )
        ]);
      }
    } else {
      tree.push(
        ...(
          options as (
            | Discord.ApplicationCommandNonOptions
            | Discord.ApplicationCommandChannelOption
            | Discord.ApplicationCommandChoicesOption
          )[]
        ).map(({ name, description, type, required }) => [
          {
            name,
            description,
            type,
            optional: !required
          }
        ])
      );
    }

    return tree;
  }
}
