import { Command } from "commander";
import { createFeroDCApp } from "./commands/create-app";
// import { createFeroDCCommand } from "./commands/create-command";
// import { createFeroDCEvent } from "./commands/create-event";
import type { CreateAppOptions } from "./types";

/**
 * Basic CLI
 * @param args The arguments to parse.
 */
export function cli(args: string[]): void {
  const program = new Command("fero-dc");

  program
    .description("Create a new Fero-DC app/command/event.")
    .argument("<command>", "The command to run.")
    .argument("<subcommand>", "The subcommand to run.")
    .argument("[dir]", "The directory to create the app in.")
    .option("--noInstall", "Do not install dependencies.")
    .option("--noGit", "Do not initialize a git repository.")
    .option("-y, --yes", "Answer yes to all questions.")
    .version("3.0.5", "-v, --version", "Show the version.")
    .parse(args);

  const command = program.args[0];
  const subcommand = program.args[1];

  switch (command) {
    case "new": {
      switch (subcommand) {
        case "app": {
          const options: CreateAppOptions = {
            name: program.args[2],
            flags: program.opts()
          };

          createFeroDCApp(options);
          break;
        }

        // case "command":
        //   createFeroDCCommand();

        //   break;

        // case "event":
        //   createFeroDCEvent();

        //   break;
      }

      break;
    }
  }
}
