import { CommandBuilder } from "../../src";

export default new CommandBuilder()
  .name("test")
  .description("Test Command")
  .category("Test")
  .run(async (client, interaction) => {
    interaction.reply("Test");
  });
