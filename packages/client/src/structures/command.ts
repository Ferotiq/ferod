import * as Discord from "discord.js";
import { CommandFunction, CommandOptions, Option } from "../types";
import { Client } from "./client";

/**
 * A class to easily create commands that interop with Fero-DC
 */
export class Command<
  T extends Discord.ApplicationCommandType = Discord.ApplicationCommandType.ChatInput
> {
  private _name?: string;
  private _description?: string;
  private _category?: string;
  private _options?: Discord.ApplicationCommandOptionData[];
  private _permissions?: Discord.PermissionResolvable[];
  private _type?: T;
  private _executor?: CommandFunction<T>;

  /**
   * Creates a new command
   * @param options The options for the command
   */
  public constructor(options?: CommandOptions<T>) {
    if (options !== undefined) {
      this._name = options.name;
      this._description = options.description;
      this._category = options.category;
      this._options = options.options ?? [];
      this._permissions = options.permissions ?? [];
      this._type = options.type;
      this._executor = options.executor;
    }
  }

  /**
   * The application command data from this command
   */
  public get data(): Discord.ApplicationCommandData {
    return {
      name: this.name,
      description: this.description,
      options: this.options,
      type: this.type,
      defaultMemberPermissions: this.permissions
    };
  }

  /**
   * The name of the command
   */
  public get name(): string {
    if (this._name === undefined) {
      throw new Error("Missing required property: name");
    }

    return this._name;
  }

  /**
   * The description of the command
   */
  public get description(): string {
    if (this._description === undefined) {
      throw new Error("Missing required property: description");
    }

    return this._description;
  }

  /**
   * The category of the command
   */
  public get category(): string {
    if (this._category === undefined) {
      throw new Error("Missing required property: category");
    }

    return this._category;
  }

  /**
   * The options of the command
   */
  public get options(): Discord.ApplicationCommandOptionData[] {
    return this._options ?? [];
  }

  /**
   * The permissions of the command
   */
  public get permissions(): Discord.PermissionResolvable[] {
    return this._permissions ?? [];
  }

  /**
   * The type of the command
   */
  public get type(): T {
    return this._type ?? (Discord.ApplicationCommandType.ChatInput as T);
  }

  /**
   * The executor function of the command
   */
  public get executor(): CommandFunction<T> {
    if (this._executor === undefined) {
      throw new Error("Missing required property: executor");
    }

    return this._executor;
  }

  /**
   * Set the name
   * @param name The name of the command
   */
  public setName(name: string): this {
    this._name = name;

    return this;
  }

  /**
   * Set the description
   * @param description The description of the command
   */
  public setDescription(description: string): this {
    this._description = description;

    return this;
  }

  /**
   * Sets the category
   * @param category The category of the command
   */
  public setCategory(category: string): this {
    this._category = category;

    return this;
  }

  /**
   * Sets the options
   * @param options The options of the command
   */
  public setOptions(
    ...options:
      | Discord.ApplicationCommandOptionData[]
      | Discord.ApplicationCommandOptionData[][]
  ): this {
    this._options = options.flat();

    return this;
  }

  /**
   * Adds an option
   * @param option The option to add
   */
  public addOption(option: Discord.ApplicationCommandOptionData): this {
    if (this._options === undefined) {
      this._options = [];
    }

    this._options.push(option);

    return this;
  }

  /**
   * Sets the permissions
   * @param permissions The permissions of the command
   */
  public setPermissions(
    ...permissions:
      | Discord.PermissionResolvable[]
      | Discord.PermissionResolvable[][]
  ): this {
    this._permissions = permissions.flat();

    return this;
  }

  /**
   * Sets the type
   * @param type The type of the command
   */
  public setType(type: T): this {
    this._type = type;

    return this;
  }

  /**
   * Sets the executor function
   * @param executor The function to run when the command is executed
   */
  public setExecutor(executor: CommandFunction<T>): this {
    this._executor = executor;

    return this;
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

    const app = await (client.clientOptions.dev
      ? client.application.commands.create(
          this.data,
          client.clientOptions.devGuildId
        )
      : client.application.commands.create(this.data)
    ).catch(() => undefined);

    if (app === undefined) {
      throw Error(`Could not create application command for ${this.name}.`);
    } else if (Array.isArray(app) && app.includes(undefined)) {
      throw Error(
        `Could not create application command for some guilds for ${this.name}.`
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
    const applicationCommands = client.clientOptions.dev
      ? await client.fetchApplicationCommands(client.clientOptions.devGuildId)
      : await client.fetchApplicationCommands();

    if (applicationCommands === undefined) {
      return undefined;
    }

    const command = applicationCommands.find(
      (appCmd) => appCmd.name === this.name
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

    return applicationCommand.edit(this.data);
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
        `\`/${this.name} ${options
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
    const options = this.options;

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
