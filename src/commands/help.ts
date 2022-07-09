import { EmbedFieldData, MessageEmbed } from "discord.js";
import { Command } from "fero-dc";
import { isEmpty } from "lodash";
import { toPascalCase } from "fero-dc";

export default new Command({
  name: "help",
  description: "Shows a help embed",
  category: "Utility",
  options: [
    {
      name: "command",
      type: "STRING",
      description: "The command to receive help on",
      required: false
    }
  ],
  run: async (client, interaction) => {
    const command = client.commands.get(
      interaction.options.getString("command", false) || ""
    );

    const embed = new MessageEmbed()
      .setTitle("Help")
      .setColor("RANDOM")
      // .setURL("") /* uncomment for dashboard */
      .setAuthor({
        name: interaction.user.username,
        iconURL:
          interaction.user.avatarURL({
            dynamic: true
          }) || ""
      })
      .setThumbnail(
        client.user?.avatarURL({
          dynamic: true
        }) || ""
      )
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
            value: command.name,
            inline: true
          },
          {
            name: "Command Description",
            value: command.description.trim(),
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

      embed.addField("Command Category", toPascalCase(command.category), true);

      if (!isEmpty(command.guilds)) {
        embed.addField(
          "Command Guild(s)",
          client.guilds.cache
            .filter((guild) => command.guilds.includes(guild.id))
            .map((guild) => guild.name)
            .join(",\n"),
          true
        );
      }
    } else {
      const commands: EmbedFieldData[] = client.categories.map((category) => ({
        name: `${category}${category.endsWith("Commands") ? "" : " Commands"}`,
        value: client
          .getCommandsByCategory(category)
          .map((cmd) => cmd.name)
          .join("\n"),
        inline: true
      }));

      embed
        .setDescription("The following are all the commands that I offer!")
        .addFields(commands);
    }

    return interaction.reply({ embeds: [embed], ephemeral: true });
  }
});
