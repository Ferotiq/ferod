import { Events } from "discord.js";
import fse from "fs-extra";
import inquirer from "inquirer";
import { resolve } from "path";
import type {
	CreateEventListenerAnswers,
	CreateEventListenerOptions,
} from "../types.js";
import { getTemplatesDirectory } from "../utils/file.js";

const events = Object.keys(Events) as (keyof typeof Events)[];

const templatesDirectory = getTemplatesDirectory(import.meta.url);

/**
 * Create a new Ferod event listener.
 */
export async function createFerodEventListener(
	options: CreateEventListenerOptions,
): Promise<void> {
	const answers = await getAnswers(options);

	if (answers.name === "") {
		console.log("Name field is required.");

		return;
	}

	const name = options.name ?? answers.name.replace(/\.[^/.]+$/, "");
	const event = answers.event;

	const eventListener = fse
		.readFileSync(resolve(templatesDirectory, "event-listener/example.ts"))
		.toString()
		.replace("InteractionCreate", event);

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
	const eventListenersDirectory = resolve(
		projectDirectory,
		"src",
		config.eventListenersPath,
	);

	const eventListenerPath = resolve(
		eventListenersDirectory,
		`${name}.${fileExtension}`,
	);

	if (fse.existsSync(eventListenerPath)) {
		throw new Error(`${name}.${fileExtension} already exists.`);
	}

	fse.writeFileSync(eventListenerPath, eventListener);
}

/**
 * Get the answers to the questions
 * @param options The options passed to the command
 * @returns The answers to the questions
 */
async function getAnswers(
	options: CreateEventListenerOptions,
): Promise<CreateEventListenerAnswers> {
	const answers = await inquirer.prompt<CreateEventListenerAnswers>([
		{
			name: "name",
			type: "input",
			message: "What is the name of the listener?",
			when: () => options.name === undefined,
		},
		{
			name: "event",
			type: "list",
			message: "What event do you want to listen to?",
			choices: events,
		},
	]);

	return answers;
}
