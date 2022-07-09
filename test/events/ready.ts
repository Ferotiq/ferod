

import { Event } from "../../src";

export default {
  event: "ready",
  run: client => {
    console.log(`${client.user?.tag} is online!`);
  }
} as Event<"ready">;
