import { EventListener } from "@ferod/client";
import { Events } from "discord.js";

export default new EventListener()
	.setEvent(Events.ClientReady)
	.setHandler(async (client) => {
		console.log(`Logged in as ${client.user.tag}`);
	});
