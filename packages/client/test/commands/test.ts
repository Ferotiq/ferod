import { Command } from "../../src/index.js";

export default new Command()
	.setName("test")
	.setDescription("Test Command")
	.setCategory("Test")
	.setExecutor(async (client, interaction) => {
		interaction.reply("Test");
	});
