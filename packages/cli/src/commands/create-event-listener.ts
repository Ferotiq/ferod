import { Events } from "discord.js";
import inquirer from "inquirer";

const events = Object.keys(Events) as (keyof typeof Events)[];

interface Answers {
	fileName: string;
	event: keyof typeof Events;
}

/**
 * Create a new Ferod app.
 */
export async function createFerodEventListener(): Promise<void> {
	const answers: Answers = await inquirer.prompt([
		{
			name: "fileName",
			type: "input",
			message: "What is the file name?"
		},
		{
			name: "event",
			type: "list",
			message: "What event do you want to listen to?",
			choices: events
		}
	]);

	const event = Events[answers.event];

	console.log(event);
}
