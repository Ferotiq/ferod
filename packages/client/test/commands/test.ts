import { Command } from "../../src";

export default new Command()
	.setName("test")
	.setDescription("Test Command")
	.setCategory("Test")
	.setExecutor(async (client, interaction) => {
		interaction.reply("Test");
	});
