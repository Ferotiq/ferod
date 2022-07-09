import { Command } from "../../src";

export default new Command()
  .name("test")
  .description("Test Command")
  .category("Test")
  .run(async (client, interaction) => {
    interaction.reply("Test");
  });
