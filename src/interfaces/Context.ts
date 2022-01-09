/** @format */

import {
  CommandInteraction,
  Guild,
  GuildMember,
  Message,
  MessageMentions,
  TextBasedChannel,
  User
} from "discord.js";
import { Mentions } from "./Mentions";

export interface Context {
  command: string | null | undefined;
  args: string[];
  message?: Message | null | undefined;
  interaction?: CommandInteraction | null | undefined;
  channel: TextBasedChannel | null | undefined;
  author: User | null | undefined;
  member?: GuildMember | null | undefined;
  guild?: Guild | null | undefined;
  mentions: Mentions | MessageMentions | null | undefined;
}
