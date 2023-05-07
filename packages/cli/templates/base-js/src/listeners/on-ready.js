import { EventListener } from "@ferod/client";

export default new EventListener()
	.setEvent("ready")
	.setHandler(async (client) => {
		console.log(`Logged in as ${client.user.tag}`);
	});
