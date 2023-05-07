import { ApplicationCommandType, PermissionFlagsBits } from "discord.js";
import fse from "fs-extra";
import inquirer from "inquirer";
import { resolve } from "path";
import type { CreateCommandAnswers, CreateCommandOptions } from "../types";
import { getTemplatesDirectory } from "../utils/file";

const applicationCommandTypes = Object.keys(ApplicationCommandType).filter(
	(key) => isNaN(parseInt(key))
) as (keyof typeof ApplicationCommandType)[];

const permissions = Object.keys(PermissionFlagsBits).filter((key) =>
	isNaN(parseInt(key))
) as (keyof typeof PermissionFlagsBits)[];

const templatesDirectory = getTemplatesDirectory(import.meta.url);

/**
 * Create a new Ferod command.
 */
export async function createFerodCommand(
	options: CreateCommandOptions
): Promise<void> {
	const answers = await getAnswers(options);

	if (answers.name === "") {
		console.log("Name field is required.");

		return;
	}
	if (answers.category === "") {
		console.log("Category field is required.");

		return;
	}

	const defaultPermissions = answers.defaultPermissions.map(
		(permission) => `PermissionFlagsBits.${permission}`
	);

	const name = options.name ?? answers.name.replace(/\.[^/.]+$/, "");
	const commandType = `ApplicationCommandType.${answers.type}`;

	let command = fse
		.readFileSync(resolve(templatesDirectory, "command/example.ts"))
		.toString()
		.replace("NAME", name)
		.replace("DESCRIPTION", answers.description)
		.replace("CATEGORY", answers.category)
		.replace("PermissionFlagsBits.SendMessages", defaultPermissions.join(", "))
		.replace("ApplicationCommandType.ChatInput", commandType);

	if (command.includes("(ApplicationCommandType.ChatInput)")) {
		command = command
			.replace("{ ApplicationCommandType,", "{")
			.replace(/\s+\.setType\(ApplicationCommandType\.ChatInput\)/, "");
	}

	if (command.includes(".setPermissions()")) {
		command = command
			.replace('\nimport { PermissionFlagsBits } from "discord.js";', "")
			.replace(", PermissionFlagsBits", "")
			.replace(/\s+\.setPermissions\(\)/, "");
	}

	const projectDirectory = process.cwd();
	const indexTSPath = resolve(projectDirectory, "src/index.ts");
	const indexJSPath = resolve(projectDirectory, "src/index.js");
	const indexTSExists = fse.existsSync(indexTSPath);
	const indexJSExists = fse.existsSync(indexJSPath);
	if (!indexTSExists && !indexJSExists) {
		throw new Error("No index.ts or index.js file found.");
	} else if (indexTSExists && indexJSExists) {
		throw new Error("Both index.ts and index.js files found.");
	}
	const fileExtension = indexTSExists ? "ts" : "js";

	const configPath = resolve(projectDirectory, "src/config/config.json");
	const config = fse.readJSONSync(configPath);
	const commandsDirectory = resolve(
		projectDirectory,
		"src",
		config.commandsPath
	);

	const commandPath = resolve(commandsDirectory, `${name}.${fileExtension}`);

	if (fse.existsSync(commandPath)) {
		throw new Error(`${name}.${fileExtension} already exists.`);
	}

	fse.writeFileSync(commandPath, command);
}

/**
 * Get the answers to the questions
 * @param options The options passed to the command
 * @returns The answers to the questions
 */
async function getAnswers(
	options: CreateCommandOptions
): Promise<CreateCommandAnswers> {
	return await inquirer.prompt<CreateCommandAnswers>([
		{
			name: "name",
			type: "input",
			message: "What is the name of the command?",
			when: () => options.name === undefined
		},
		{
			name: "description",
			type: "input",
			message: "What is the description of the command?"
		},
		{
			name: "category",
			type: "input",
			message: "What is the category of the command?"
		},
		{
			name: "defaultPermissions",
			type: "checkbox",
			message: "What are the default permissions of the command?",
			choices: permissions
		},
		{
			name: "type",
			type: "list",
			message: "What type of command do you want to create?",
			choices: applicationCommandTypes
		}
	]);
}
