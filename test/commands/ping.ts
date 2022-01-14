/** @format */

import { Command } from "../../src";

export default new Command({
  name: "ping",
  description: "A ping command",
  category: "Utility",
  guildIDs: ["879888849470361620"],
  run: context => {
    const { interaction, client } = context;

    interaction?.reply(`Ping: \`${client.ws.ping}\`ms.`);
  }
});
