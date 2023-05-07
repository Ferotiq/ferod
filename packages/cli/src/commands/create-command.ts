import type * as Discord from "discord.js";
import inquirer from "inquirer";
// import { Options } from "../types";

interface Answers {
  fileName: string;
  name: string;
  description: string;
  category: string;
  type: Discord.ApplicationCommandType;
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
      choices: ["ChatInput", "Message", "User"]
    }
  ]);

  console.log(answers);
}
