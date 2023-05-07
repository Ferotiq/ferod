import { ApplicationCommandType, PermissionFlagsBits } from "discord.js";
import fse from "fs-extra";
import inquirer from "inquirer";
import { dirname, resolve } from "path";
import { fileURLToPath } from "url";

const applicationCommandTypes = Object.keys(ApplicationCommandType).filter(
	(key) => isNaN(parseInt(key))
) as (keyof typeof ApplicationCommandType)[];

const permissions = Object.keys(PermissionFlagsBits).filter((key) =>
	isNaN(parseInt(key))
) as (keyof typeof PermissionFlagsBits)[];

interface Answers {
	name: string;
	description: string;
	category: string;
	defaultPermissions: (keyof typeof PermissionFlagsBits)[];
	type: keyof typeof ApplicationCommandType;
}

const __dirname = dirname(fileURLToPath(import.meta.url));
const templatesDirectory = resolve(__dirname, "../templates");

/**
 * Create a new Ferod command.
 */
export async function createFerodCommand(): Promise<void> {
	const answers = await getAnswers();

	const defaultPermissions = answers.defaultPermissions.map(
		(permission) => `PermissionFlagsBits.${permission}`
	);

	const name = answers.name.replace(/\.[^/.]+$/, "");
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
async function getAnswers(): Promise<Answers> {
	return await inquirer.prompt<Answers>([
		{
			name: "name",
			type: "input",
			message: "What is the name of the command?"
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
