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
  command: string;
  args: string[];
  message: Message | undefined;
  interaction: CommandInteraction | undefined;
  channel: TextBasedChannel | null;
  author: User;
  member: GuildMember | null | undefined;
  guild: Guild | null;
  mentions: Mentions | MessageMentions | undefined;
}
