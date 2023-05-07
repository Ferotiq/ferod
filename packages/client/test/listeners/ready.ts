import { EventListener } from "../../src";

export default new EventListener().setEvent("ready").setHandler((client) => {
	console.log(`${client.user.tag} is online!`);
});
