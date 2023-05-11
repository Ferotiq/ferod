import { Events } from "discord.js";
import { EventListener } from "../../src/index.js";

export default new EventListener()
	.setEvent(Events.InteractionCreate)
	.setHandler(async (client, interaction) => {
		if (!interaction.isChatInputCommand()) {
			return;
		}

		const command = client.commands.get(interaction.commandName);

		if (command) {
			command.executor(client, interaction);
		} else {
			interaction.reply(`Command \`${interaction.commandName}\` not found`);
		}
	});
