/** @format */

import { Event } from "../../src";

const event: Event<"ready"> = {
  event: "ready",
  run: client => {
    console.log(`${client.user?.tag} is online!`);
  }
};

export default event;
