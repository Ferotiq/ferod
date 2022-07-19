import * as Discord from "discord.js";
import { CommandBuilder, toPascalCase } from "fero-dc";

export default new CommandBuilder()
  .name("help")
  .description("Shows a help embed")
  .category("Utility")
  .options({
    name: "command",
    type: Discord.ApplicationCommandOptionType.String,
    description: "The command to receive help for",
    required: false
  })
  .run(async (client, interaction) => {
    const command = client.commands.get(
      interaction.options.getString("command", false) ?? ""
    );

    const embed = new Discord.EmbedBuilder()
      .setTitle("Help")
      .setColor("Random")
      // .setURL("") /* uncomment for dashboard */
      .setAuthor({
        name: interaction.user.username,
        iconURL: interaction.user.avatarURL() ?? ""
      })
      .setThumbnail(client.user.avatarURL() ?? "")
      .setTimestamp(interaction.createdTimestamp)
      .setFooter({
        text: "Sent at:"
      });

    if (command) {
      embed
        .setDescription(
          `Here are all the properties for the ${command.name} command!`
        )
        .addFields([
          {
            name: "Command Name",
            value: command.data.name,
            inline: true
          },
          {
            name: "Command Description",
            value: command.data.description.trim(),
            inline: true
          }
        ]);

      const usage = await command.getUsage(client);

      const args = await command.getArguments(client);

      if (usage && args) {
        embed.addFields([
          { name: "Command Usage", value: usage, inline: false },
          { name: "Command Arguments", value: args, inline: false }
        ]);
      }

      embed.addFields({
        name: "Command Category",
        value: toPascalCase(command.data.category),
        inline: true
      });
    } else {
      const commands: Discord.EmbedField[] = client.categories.map(
        (category) => ({
          name: `${category}${
            category.endsWith("Commands") ? "" : " Commands"
          }`,
          value: client
            .getCommandsByCategory(category)
            .map((cmd) => cmd.name)
            .join("\n"),
          inline: true
        })
      );

      embed
        .setDescription("The following are all the commands that I offer!")
        .addFields(commands);
    }

    return interaction.reply({ embeds: [embed], ephemeral: true });
  });
