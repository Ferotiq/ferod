import { Command } from "@ferod/client";
import { PermissionFlagsBits } from "discord.js";

export default new Command()
	.setName("test")
	.setDescription("Test command")
	.setCategory("Utility")
	.setPermissions(PermissionFlagsBits.SendMessages)
	.setExecutor(async (client, interaction) => {
		await interaction.reply("Test command!");
	});
