import { Event } from "../../src";

export default new Event<"ready">().event("ready").run((client) => {
  console.log(`${client.user.tag} is online!`);
});
