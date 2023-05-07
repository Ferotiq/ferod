import { Command } from "commander";
import { createFerodApp } from "./commands/create-app";
import { createFerodCommand } from "./commands/create-command";
import { createFerodEventListener } from "./commands/create-event-listener";
import type { CLIFlags, CreateAppOptions } from "./types";

/**
 * Basic CLI
 * @param args The arguments to parse.
 */
export function cli(args: string[]): void {
	const program = new Command("ferod");

	program
		.description("Create a new Ferod app/command/event.")
		.argument("[command]", "The command to run.")
		.argument("[dir]", "The directory to create the app in.")
		.option("--noInstall", "Do not install dependencies.")
		.option("--noGit", "Do not initialize a git repository.")
		.option("-y, --yes", "Answer yes to all questions.")
		.version("3.0.5", "-v, --version", "Show the version.")
		.parse(args);

	const [command, name] = program.args;

	switch (command ?? "app") {
		case "app": {
			const options: CreateAppOptions = {
				name,
				flags: program.opts<CLIFlags>()
			};

			createFerodApp(options);
			break;
		}

		case "command":
			createFerodCommand();

			break;

		case "event-listener":
		case "listener":
		case "event": {
			createFerodEventListener();

			break;
		}
	}
}
