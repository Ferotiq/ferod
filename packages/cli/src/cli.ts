#!/usr/bin/env node
import { Command } from "commander";
import { version } from "../package.json";
import { createFerodApp } from "./commands/create-app.js";
import { createFerodCommand } from "./commands/create-command.js";
import { createFerodEventListener } from "./commands/create-event-listener.js";
import type {
	CLIFlags,
	CreateAppOptions,
	CreateCommandOptions,
	CreateEventListenerOptions
} from "./types.js";

const program = new Command("ferod")
	.description("Create a new Ferod app/command/event.")
	.argument("[create|test]", "The command to run", "create")
	.argument(
		"[app|command|event-listener]",
		"The type of Ferod app/command/event to create.",
		"app"
	)
	.argument("[name]", "The name of the Ferod app/command/event to create.")
	.option("--no-install, --noInstall", "Do not install dependencies.")
	.option("--no-git, --noGit", "Do not initialize a git repository.")
	.option("-y, --yes", "Answer yes to all questions.")
	.version(version, "-v, --version", "Show the version.")
	.parse(process.argv);

const [command, subcommand, name] = program.args;

switch (command ?? "create") {
	case "create": {
		switch (subcommand ?? "app") {
			case "app": {
				const options: CreateAppOptions = {
					name,
					flags: program.opts<CLIFlags>()
				};

				createFerodApp(options);
				break;
			}

			case "command": {
				const options: CreateCommandOptions = {
					name
				};

				createFerodCommand(options);

				break;
			}

			case "event-listener":
			case "listener":
			case "event": {
				const options: CreateEventListenerOptions = {
					name
				};

				createFerodEventListener(options);

				break;
			}

			default:
				program.help();
		}

		break;
	}

	case "test":
		console.log("Test command");

		break;

	default:
		program.help();
}
