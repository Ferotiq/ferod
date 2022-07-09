import { Event } from "../../src";

export default new Event<"interactionCreate">()
  .event("interactionCreate")
  .run(async (client, interaction) => {
    if (!interaction.isCommand()) {
      return;
    }

    const command = client.commands.get(interaction.commandName);

    if (command) {
      command.run(client, interaction);
    }
  });
