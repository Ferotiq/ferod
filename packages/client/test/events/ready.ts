import { EventBuilder } from "../../src";

export default new EventBuilder<"ready">().event("ready").run((client) => {
  console.log(`${client.user.tag} is online!`);
});
