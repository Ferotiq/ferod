import { Command } from "@ferod/client";
import { ApplicationCommandType, PermissionFlagsBits } from "discord.js";

export default new Command()
	.setName("NAME")
	.setDescription("DESCRIPTION")
	.setCategory("CATEGORY")
	.setPermissions(PermissionFlagsBits.SendMessages)
	.setType(ApplicationCommandType.ChatInput)
	.setExecutor(async (client, interaction) => {
		// code goes here
	});
