import { EventBuilder } from "../../src";

export default new EventBuilder<"interactionCreate">()
  .event("interactionCreate")
  .run(async (client, interaction) => {
    if (!interaction.isChatInputCommand()) {
      return;
    }

    const command = client.commands.get(interaction.commandName);

    if (command) {
      command.data.run(client, interaction);
    } else {
      interaction.reply(`Command \`${interaction.commandName}\` not found`);
    }
  });
