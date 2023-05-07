import { EventListener } from "@ferod/client";
import { Events } from "discord.js";

export default new EventListener()
	.setEvent(Events.InteractionCreate)
	.setHandler((client) => {
		// code goes here
	});
