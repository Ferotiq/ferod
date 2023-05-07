import { EventListener } from "../../src";

export default new EventListener()
	.setEvent("interactionCreate")
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
