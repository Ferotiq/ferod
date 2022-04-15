/** @format */

import { Client } from "../structures/Client";
import { ClientEvents } from "discord.js";

export interface EventFunction<E extends keyof ClientEvents> {
  (client: Client, ...eventArgs: ClientEvents[E]): void;
}
