/** @format */

import { EventFunction } from "./EventFunction";
import { ClientEvents } from "discord.js";

export interface Event<E extends keyof ClientEvents> {
  event: E;
  run: EventFunction<E>;
}
