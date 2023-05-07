import { EventListener } from "@ferod/client";

export default new EventListener<"interactionCreate">()
	.setEvent("interactionCreate")
	.setHandler(async (client, interaction) => {
		if (!interaction.isChatInputCommand()) {
			return;
		}

		const command = client.commands.get(interaction.commandName);
		if (command === undefined) {
			return;
		}

		try {
			await command.executor(client, interaction);
		} catch (error) {
			console.error(error);
			await interaction.reply({
				content: "There was an error while executing this command!",
				ephemeral: true
			});
		}
	});
