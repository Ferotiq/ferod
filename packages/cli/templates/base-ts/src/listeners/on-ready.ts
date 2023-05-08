import { EventListener } from "@ferod/client";
import chalk from "chalk";
import { Events } from "discord.js";

export default new EventListener()
	.setEvent(Events.ClientReady)
	.setHandler(async (client) => {
		console.log(chalk.green(`${client.user.tag} is ready!`));
	});
