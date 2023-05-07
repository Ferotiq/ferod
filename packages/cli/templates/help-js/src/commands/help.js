import { Command } from "@ferod/client";
import {
	ApplicationCommandOptionType,
	Collection,
	EmbedBuilder,
	PermissionFlagsBits
} from "discord.js";

/**
 * Converts a string to PascalCase
 * @param {string} string The string to convert
 * @param {string} separator The separator to use
 * @returns {string} The converted string
 */
function toPascalCase(string, separator = " ") {
	return string
		.split(separator)
		.map((word) => word[0].toUpperCase() + word.slice(1))
		.join(separator);
}

export default new Command()
	.setName("help")
	.setDescription("Shows a help embed")
	.setCategory("Utility")
	.setPermissions(PermissionFlagsBits.SendMessages)
	.setOptions({
		name: "command",
		description: "The command to receive help for",
		type: ApplicationCommandOptionType.String,
		required: false
	})
	.setExecutor(async (client, interaction) => {
		await interaction.deferReply({
			ephemeral: true
		});

		const commandName = interaction.options.getString("command");
		const command =
			commandName === null ? null : client.commands.get(commandName) ?? null;

		const author = interaction.user;
		const embed = new EmbedBuilder()
			.setTitle("Help")
			.setColor("Random")
			.setAuthor({
				name: author.username,
				iconURL: author.avatarURL() ?? undefined
			})
			.setThumbnail(client.user.avatarURL())
			.setTimestamp()
			.setFooter({
				text: "Ferod",
				iconURL: client.user.avatarURL() ?? undefined
			});

		if (command !== null) {
			embed
				.setDescription(
					`Here are all the properties for the ${command.name} command!`
				)
				.addFields(
					{
						name: "Command Name",
						value: command.name,
						inline: true
					},
					{
						name: "Command Description",
						value: command.description,
						inline: true
					},
					{
						name: "Command Category",
						value: toPascalCase(command.category),
						inline: true
					}
				);

			const usage = command.getUsage();
			const args = command.getArguments();
			if (usage && args) {
				embed.addFields(
					{
						name: "Command Usage",
						value: usage
					},
					{
						name: "Command Arguments",
						value: args
					}
				);
			}
		} else {
			const commandsByCategory = new Collection();
			for (const category of client.categories) {
				const commands = client.commands
					.filter((cmd) => cmd.category === category)
					.values();
				commandsByCategory.set(toPascalCase(category, " "), [...commands]);
			}

			const commandFields = commandsByCategory.map((commands, category) => {
				const name = `${category}${
					category.endsWith("Commands") ? "" : " Commands"
				}`;
				const value = commands.map((command) => command.name).join("\n");
				return { name, value, inline: true };
			});

			embed
				.setDescription("The following are all the commands I have!")
				.addFields(commandFields);
		}

		await interaction.followUp({
			embeds: [embed]
		});
	});
