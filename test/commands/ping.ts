/** @format */

import { Command } from "../../src";

export default new Command({
  name: "ping",
  description: "A ping command",
  category: "Utility",
  build: builder => builder,
  run: async context => {
    if (context.interaction) {
      context.interaction.reply("Test");
    }
  }
});
