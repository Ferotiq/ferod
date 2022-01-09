/** @format */

import { SlashCommandBuilder } from "@discordjs/builders";
export interface CommandBuilder {
  (builder: SlashCommandBuilder): SlashCommandBuilder;
}
