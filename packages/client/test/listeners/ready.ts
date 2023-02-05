import { EventListener } from "../../src";

export default new EventListener<"ready">()
  .setEvent("ready")
  .setListener((client) => {
    console.log(`${client.user.tag} is online!`);
  });
