import { EventListener } from "@ferod/client";
import { Events } from "discord.js";

export default new EventListener()
	.setEvent(Events.InteractionCreate)
	.setHandler((_client) => {
		// code goes here
	});
