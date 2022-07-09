import inquirer from "inquirer";
import type { ApplicationCommandType } from "discord.js";

interface Answers {
  fileName: string;
  name: string;
  description: string;
  category: string;
  type: ApplicationCommandType;
}

/**
 * @description Create a new Fero-DC app.
 */
export async function createFeroDCCommand(): Promise<void> {
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
      choices: ["CHAT_INPUT", "MESSAGE", "USER"]
    }
  ]);

  console.log(answers);
}
