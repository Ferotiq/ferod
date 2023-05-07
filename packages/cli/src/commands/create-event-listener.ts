import { Events } from "discord.js";
import fse from "fs-extra";
import inquirer from "inquirer";
import { dirname, resolve } from "path";
import { fileURLToPath } from "url";

const events = Object.keys(Events) as (keyof typeof Events)[];

interface Answers {
	name: string;
	event: keyof typeof Events;
}

const __dirname = dirname(fileURLToPath(import.meta.url));
const templatesDirectory = resolve(__dirname, "../templates");

/**
 * Create a new Ferod event listener.
 */
export async function createFerodEventListener(): Promise<void> {
	const answers = await getAnswers();

	const name = answers.name.replace(/\.[^/.]+$/, "");
	const event = Events[answers.event];

	const eventListener = fse
		.readFileSync(resolve(templatesDirectory, "event-listener/example.ts"))
		.toString()
		.replace("interactionCreate", event);

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
		config.eventListenersPath
	);

	const eventListenerPath = resolve(
		eventListenersDirectory,
		`${name}.${fileExtension}`
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
async function getAnswers(): Promise<Answers> {
	const answers = await inquirer.prompt<Answers>([
		{
			name: "name",
			type: "input",
			message: "What is the name of the listener?"
		},
		{
			name: "event",
			type: "list",
			message: "What event do you want to listen to?",
			choices: events
		}
	]);

	return answers;
}
