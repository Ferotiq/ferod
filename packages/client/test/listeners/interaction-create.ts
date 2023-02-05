import { EventListener } from "../../src";

export default new EventListener<"interactionCreate">()
  .setEvent("interactionCreate")
  .setListener(async (client, interaction) => {
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
