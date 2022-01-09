/** @format */

import { Event } from "../../src";

const event: Event<"interactionCreate"> = {
  event: "interactionCreate",
  run: async (client, interaction) => {
    if (!interaction.isCommand()) return;

    const context = await client.getContext(interaction);

    const { command: cmd } = context;

    const command = client.commands.find(c => c.name === cmd);

    if (command) command.run(context, client);
  }
};

export default event;
