import { EventListener } from "../../src";

export default new EventListener<"ready">()
	.setEvent("ready")
	.setHandler((client) => {
		console.log(`${client.user.tag} is online!`);
	});
