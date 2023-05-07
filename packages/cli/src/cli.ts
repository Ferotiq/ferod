import { Command } from "commander";
import { version } from "../package.json";
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
		.argument("[name]", "The name of the app/command/event-listener.")
		.option("--no-install, --noInstall", "Do not install dependencies.")
		.option("--no-git, --noGit", "Do not initialize a git repository.")
		.option("-y, --yes", "Answer yes to all questions.")
		.version(version, "-v, --version", "Show the version.")
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
