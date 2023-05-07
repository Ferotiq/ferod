import { EventListener } from "@ferod/client";

export default new EventListener<"ready">()
	.setEvent("ready")
	.setHandler(async (client) => {
		console.log(`Logged in as ${client.user.tag}`);
	});
