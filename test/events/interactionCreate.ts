/** @format */

import { Event } from "../../src";

export default {
  event: "interactionCreate",
  run: async (client, interaction) => {
    if (!interaction.isCommand()) return;

    const context = await client.getContext(interaction);

    const { command: cmd } = context;

    const command = client.commands.find(c => c.name === cmd);

    if (command) command.run(context);
  }
} as Event<"interactionCreate">;
