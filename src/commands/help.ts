/** @format */

// @ts-ignore
import { EmbedFieldData, MessageEmbed } from "discord.js";
import { Command } from "fero-dc";
import { camelCase } from "lodash";

export default new Command({
  name: "help",
  description: "Shows a help embed",
  // aliases: ["h"],
  // permissions: ["SEND_MESSAGES"],
  category: "Utility",
  build: builder => {
    builder.addStringOption(option =>
      option
        .setName("command")
        .setDescription("The command to receive help on")
        .setAutocomplete(false)
        .setRequired(false)
    );

    return builder;
  },
  run: async (context, client /*command: Command*/) => {
    if (!context.interaction) return;

    const command = client.commands.get(
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
        client.user?.avatarURL({
          dynamic: true
        }) || ""
      )
      .setTimestamp(context.interaction.createdTimestamp)
      .setFooter("Sent at:");

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
          },
          // {
          //   name: "Command Usage",
          //   value: "",
          //   inline: false
          // },
          {
            name: "Command Category",
            value: camelCase(command.category),
            inline: true
          }
        ]);

      if (command.guildID)
        embed.addField(
          "Command Guild",
          client.guilds.cache.get(command.guildID)?.name || "None",
          true
        );

      if (command.aliases)
        embed.addField(
          "Command Aliases (Deprecated)",
          command.aliases.join(", "),
          true
        );

      if (command.permissions)
        embed.addField(
          "Command Permissions (Deprecated)",
          command.permissions.map(v => v.toString()).join(", "),
          true
        );
    } else {
      const commands: EmbedFieldData[] = client.categories.map(v => ({
        name: `${v} Commands`,
        value: client
          .getCommandsByCategory(v)
          .map(cmd => cmd.name)
          .join("\n"),
        inline: true
      }));

      embed
        .setDescription("The following are all the commands that I offer!")
        .addFields(commands);
    }

    return context.interaction.reply({ embeds: [embed], ephemeral: true });
  }
});
