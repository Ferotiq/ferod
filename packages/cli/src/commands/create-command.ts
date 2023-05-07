import { ApplicationCommandType } from "discord.js";
import inquirer from "inquirer";

const applicationCommandOptionTypes = Object.keys(
	ApplicationCommandType
).filter((key) =>
	isNaN(parseInt(key))
) as (keyof typeof ApplicationCommandType)[];

interface Answers {
	fileName: string;
	name: string;
	description: string;
	category: string;
	type: keyof typeof ApplicationCommandType;
}

/**
 * Create a new Ferod app.
 */
export async function createFerodCommand(): Promise<void> {
	const answers: Answers = await inquirer.prompt([
		{
			name: "fileName",
			type: "input",
			message: "What is the file name?"
		},
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
			name: "type",
			type: "list",
			message: "What type of command do you want to create?",
			choices: applicationCommandOptionTypes
		}
	]);

	console.log(answers);
}
