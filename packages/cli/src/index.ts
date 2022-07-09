#!/usr/bin/env node
import { createFeroDCApp } from "./commands/create-app";
import { createFeroDCCommand } from "./commands/create-command";
import { createFeroDCEvent } from "./commands/create-event";

type Command = "new" | "help";
type NewSubcommand = "app" | "command" | "event";

/**
 * @description The CLI entry point.
 */
async function main(): Promise<void> {
  const args = process.argv.slice(2);

  const command = (args[0] ?? "new") as Command;

  switch (command) {
    case "new": {
      const subcommand = (args[1] ?? "app") as NewSubcommand;

      switch (subcommand) {
        case "app":
          await createFeroDCApp();

          break;

        case "command":
          await createFeroDCCommand();

          break;

        case "event":
          await createFeroDCEvent();

          break;
      }

      break;
    }
  }
}

main().catch(console.log);
