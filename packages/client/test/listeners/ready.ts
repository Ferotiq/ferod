import { Events } from "discord.js";
import { EventListener } from "../../src";

export default new EventListener()
	.setEvent(Events.ClientReady)
	.setHandler((client) => {
		console.log(`${client.user.tag} is online!`);
	});
