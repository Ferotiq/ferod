import { Command } from "@ferod/client";

export default new Command()
	.setName("test")
	.setDescription("Test command")
	.setCategory("Utility")
	.setExecutor(async (client, interaction) => {
		await interaction.reply("Test command!");
	});
