/** @format */

// @ts-ignore
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
  run: async context => {
    if (!context.interaction) return;

    const command = context.client.commands.get(
      context.interaction.options.getString("command", false) || ""
    );

    const embed = new MessageEmbed()
      .setTitle("Help")
      .setColor("RANDOM")
      // .setURL("") /* uncomment for dashboard */
      .setAuthor({
        name: context.author.username,
        iconURL:
          context.author.avatarURL({
            dynamic: true
          }) || ""
      })
      .setThumbnail(
        context.client.user?.avatarURL({
          dynamic: true
        }) || ""
      )
      .setTimestamp(context.interaction.createdTimestamp)
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

      const usage = await command.getUsage(context.client);

      const args = await command.getArguments(context.client);

      if (usage && args) {
        embed.addFields([
          { name: "Command Usage", value: usage, inline: false },
          { name: "Command Arguments", value: args, inline: false }
        ]);
      }

      embed.addField("Command Category", toPascalCase(command.category), true);

      if (!isEmpty(command.guildIDs))
        embed.addField(
          "Command Guild(s)",
          context.client.guilds.cache
            .filter(guild => command.guildIDs.includes(guild.id))
            .map(guild => guild.name)
            .join(",\n"),
          true
        );

      if (!isEmpty(command.aliases))
        embed.addField(
          "Command Aliases (Deprecated)",
          command.aliases.join(", "),
          true
        );

      if (!isEmpty(command.permissions))
        embed.addField(
          "Command Permissions (Deprecated)",
          command.permissions.map(perm => perm.toString()).join(",\n"),
          true
        );
    } else {
      const commands: EmbedFieldData[] = context.client.categories.map(
        category => ({
          name: `${category}${
            category.endsWith("Commands") ? "" : " Commands"
          }`,
          value: context.client
            .getCommandsByCategory(category)
            .map(cmd => cmd.name)
            .join("\n"),
          inline: true
        })
      );

      embed
        .setDescription("The following are all the commands that I offer!")
        .addFields(commands);
    }

    return context.interaction.reply({ embeds: [embed], ephemeral: true });
  }
});
