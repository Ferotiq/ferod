import chalk from "chalk";
import {
	ApplicationCommand,
	ApplicationCommandOptionType,
	ApplicationCommandType,
	PermissionsBitField,
	type ApplicationCommandData,
	type ApplicationCommandOption,
	type ApplicationCommandOptionData,
	type ApplicationCommandSubCommand,
	type ApplicationCommandSubGroup,
	type PermissionResolvable,
} from "discord.js";
import type { CommandFunction, CommandOptions, Option } from "../types.js";
import { Client } from "./client.js";

/**
 * A class to easily create commands that interop with Ferod
 */
export class Command<
	TType extends ApplicationCommandType = ApplicationCommandType.ChatInput
> {
	private _name?: string;
	private _description?: string;
	private _category?: string;
	private _options?: ApplicationCommandOptionData[];
	private _permissions?: PermissionResolvable[];
	private _type?: TType;
	private _executor?: CommandFunction<TType>;

	/**
	 * Creates a new command
	 * @param options The options for the command
	 */
	public constructor(options?: CommandOptions<TType>) {
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
	public get data(): ApplicationCommandData {
		return {
			name: this.name,
			description: this.description,
			options: this.options,
			type: this.type,
			defaultMemberPermissions: this.permissions,
		};
	}

	/**
	 * The name of the command
	 */
	public get name(): string {
		if (this._name === undefined) {
			throw new Error(chalk.red("Missing required property: name"));
		}

		return this._name;
	}

	/**
	 * The description of the command
	 */
	public get description(): string {
		// TODO: Do this on the type level
		if (this._description === undefined && this.type === ApplicationCommandType.ChatInput) {
			throw new Error(chalk.red("Missing required property: description"));
		}

		return this._description ?? "";
	}

	/**
	 * The category of the command
	 */
	public get category(): string {
		if (this._category === undefined) {
			throw new Error(chalk.red("Missing required property: category"));
		}

		return this._category;
	}

	/**
	 * The options of the command
	 */
	public get options(): ApplicationCommandOptionData[] {
		return this._options ?? [];
	}

	/**
	 * The permissions of the command
	 */
	public get permissions(): PermissionsBitField {
		return new PermissionsBitField(this._permissions ?? []);
	}

	/**
	 * The type of the command
	 */
	public get type(): TType {
		return this._type ?? (ApplicationCommandType.ChatInput as TType);
	}

	/**
	 * The executor function of the command
	 */
	public get executor(): CommandFunction<TType> {
		if (this._executor === undefined) {
			throw new Error(chalk.red("Missing required property: executor"));
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
		// TODO: Do this on the type level
		if (this.type !== ApplicationCommandType.ChatInput) {
			throw new Error(
				chalk.red(
					"Only commands of type ChatInput may have a description",
				),
			);
		}

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
			| ApplicationCommandOptionData[]
			| ApplicationCommandOptionData[][]
	): this {
		this._options = options.flat();

		return this;
	}

	/**
	 * Adds an option
	 * @param option The option to add
	 */
	public addOption(option: ApplicationCommandOptionData): this {
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
		...permissions: PermissionResolvable[] | PermissionResolvable[][]
	): this {
		this._permissions = permissions.flat();

		return this;
	}

	/**
	 * Sets the type
	 * @param type The type of the command
	 */
	public setType<Type2 extends ApplicationCommandType>(
		type: Type2,
	): Command<Type2> {
		this._type = type as unknown as TType;

		return this as unknown as Command<Type2>;
	}

	/**
	 * Sets the executor function
	 * @param executor The function to run when the command is executed
	 */
	public setExecutor(executor: CommandFunction<TType>): this {
		this._executor = executor;

		return this;
	}

	/**
	 * Creates an application command on Discord from the options of this command
	 * @param client The client to create the command on
	 */
	public async create(
		client: Client<true>,
	): Promise<ApplicationCommand | undefined> {
		let applicationCommand = await this.fetch(client);
		applicationCommand ??= await client.application.commands
			.create(
				this.data,
				client.options.dev ? client.options.devGuildId : undefined,
			)
			.catch(() => undefined);

		return applicationCommand;
	}

	/**
	 * Fetches the command from Discord
	 * @param client The client to fetch the command from
	 */
	public async fetch(client: Client): Promise<ApplicationCommand | undefined> {
		const applicationCommands = await client.fetchApplicationCommands(
			client.options.dev ? client.options.devGuildId : undefined,
		);

		return applicationCommands?.find((appCmd) => appCmd.name === this.name);
	}

	/**
	 * Edit this application command on Discord with the options of this command
	 * @param client The client to edit the command on
	 */
	public async edit(client: Client): Promise<ApplicationCommand | undefined> {
		let applicationCommand = await this.fetch(client);
		applicationCommand ??= await this.create(client);

		return applicationCommand?.edit(this.data);
	}

	/**
	 * Deletes this command from Discord
	 * @param client The client to delete the command on
	 */
	public async delete(client: Client): Promise<ApplicationCommand | undefined> {
		const applicationCommand = await this.fetch(client);

		return applicationCommand?.delete();
	}

	/**
	 * A string representation of how to use this command
	 */
	public get usage(): string {
		const type = ApplicationCommandOptionType.Subcommand;
		const groupType = ApplicationCommandOptionType.SubcommandGroup;

		const lines = this.optionsTree.map((options) => {
			const optionsString = options
				.map((option) => {
					if (option.type === type || option.type === groupType) {
						return option.name;
					}

					const name = option.optional
						? `[${option.name}]`
						: `<${option.name}>`;

					return name;
				})
				.join(" ");

			return `\`/${this.name} ${optionsString}\``;
		});

		return lines.join("\n");
	}

	/**
	 * A string representation of the arguments this command has
	 */
	public get arguments(): string {
		const lines: string[] = [];

		for (const options of this.optionsTree) {
			const [option1, option2, ...rest] = options;

			const type1 = ApplicationCommandOptionType[option1.type];
			const optional1 = option1.optional ? "?" : "";
			const description1 = option1.description;

			const line = `\`${option1.name} (${type1}${optional1})\`: ${description1}`;

			if (!lines.includes(line)) {
				lines.push("", line);
			}

			if (option1.type === ApplicationCommandOptionType.SubcommandGroup) {
				const type2 = ApplicationCommandOptionType[option2.type];
				const optional2 = option2.optional ? "?" : "";
				const description2 = option2.description;

				lines.push(
					`\`${option1.name} ${option2.name} (${type2}${optional2})\`: ${description2}`,
				);

				for (const option of rest) {
					const type = ApplicationCommandOptionType[option.type];
					const optional = option.optional ? "?" : "";
					const description = option.description;

					lines.push(
						`\`${option1.name} ${option2.name} ${option.name} (${type}${optional})\`: ${description}`,
					);
				}
			} else if (option1.type === ApplicationCommandOptionType.Subcommand) {
				for (const option of [option2, ...rest]) {
					const type = ApplicationCommandOptionType[option.type];
					const optional = option.optional ? "?" : "";
					const description = option.description;

					lines.push(
						`\`${option1.name} ${option.name} (${type}${optional})\`: ${description}`,
					);
				}
			}
		}

		return lines.join("\n");
	}

	/**
	 * Convert this command's options to a tree
	 */
	private get optionsTree(): Option[][] {
		const options = this.options;

		const tree: Option[][] = [];

		const subCommandGroups = options.filter(
			(option) => option.type === ApplicationCommandOptionType.SubcommandGroup,
		) as ApplicationCommandSubGroup[];

		const subCommands = options.filter(
			(option) => option.type === ApplicationCommandOptionType.Subcommand,
		) as ApplicationCommandSubCommand[];

		if (subCommandGroups.length > 0) {
			for (const subCommandGroup of subCommandGroups) {
				const subCommandsFromGroup = subCommandGroup.options ?? [];

				for (const subCommand of subCommandsFromGroup) {
					if (!subCommand.options) {
						continue;
					}

					tree.push([
						{
							name: subCommandGroup.name,
							description: subCommandGroup.description,
							type: subCommandGroup.type,
							optional: true,
						},
						{
							name: subCommand.name,
							description: subCommand.description,
							type: subCommand.type,
							optional: true,
						},
						...subCommand.options.map(
							({ name, description, type, required }) => ({
								name,
								description,
								type,
								optional: !required,
							}),
						),
					]);
				}
			}
		} else if (subCommands.length > 0) {
			for (const subCommand of subCommands) {
				if (!subCommand.options) {
					continue;
				}

				tree.push([
					{
						name: subCommand.name,
						description: subCommand.description,
						type: subCommand.type,
						optional: true,
					},
					...subCommand.options.map(
						({ name, description, type, required }) => ({
							name,
							description,
							type,
							optional: !required,
						}),
					),
				]);
			}
		} else {
			tree.push(
				...(
					options as Exclude<
						ApplicationCommandOption,
						ApplicationCommandSubCommand | ApplicationCommandSubGroup
					>[]
				).map(({ name, description, type, required }) => [
					{
						name,
						description,
						type,
						optional: !required,
					},
				]),
			);
		}

		return tree;
	}
}
