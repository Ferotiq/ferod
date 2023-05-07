import { EventListener } from "@ferod/client";

export default new EventListener()
	.setEvent("interactionCreate")
	.setHandler((client) => {
		// code goes here
	});
