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
 * Create a new Ferod app.
 */
export async function createFerodCommand(): Promise<void> {
	const answers = await getAnswers();

	const defaultPermissions = answers.defaultPermissions.map(
		(permission) => `PermissionFlagsBits.${permission}`
	);

	const commandType = `ApplicationCommandType.${answers.type}`;

	let command = fse
		.readFileSync(resolve(templatesDirectory, "command/example.ts"))
		.toString()
		.replace("NAME", answers.name)
		.replace("DESCRIPTION", answers.description)
		.replace("CATEGORY", answers.category)
		.replace("PermissionFlagsBits.SendMessages", defaultPermissions.join(", "))
		.replace("ApplicationCommandType.ChatInput", commandType);

	if (command.includes("(ApplicationCommandType.ChatInput)")) {
		// delete the line and remove type from import
		command = command
			.replace("{ ApplicationCommandType,", "{")
			.replace(/\s+\.setType\(ApplicationCommandType\.ChatInput\)/, "");
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

	const commandPath = resolve(
		commandsDirectory,
		`${answers.name}.${fileExtension}`
	);

	if (fse.existsSync(commandPath)) {
		throw new Error(`${answers.name}.${fileExtension} already exists.`);
	}

	fse.writeFileSync(commandPath, command);
}

/**
 * Prompts the user for answers.
 * @returns The answers.
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
			choices: permissions,
			default: ["SendMessages"]
		},
		{
			name: "type",
			type: "list",
			message: "What type of command do you want to create?",
			choices: applicationCommandTypes
		}
	]);
}
