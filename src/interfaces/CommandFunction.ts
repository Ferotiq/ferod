/** @format */

import { CommandInteraction } from "discord.js";
import { Client } from "../structures/Client";

export interface CommandFunction {
  (client: Client, interaction: CommandInteraction): void;
}
