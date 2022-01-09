/** @format */

import {
  Collection,
  GuildMember,
  User,
  Role,
  Snowflake,
  TextBasedChannel,
  Guild,
  CrosspostedChannel,
  GuildBasedChannel
} from "discord.js";
import { Client } from "../structures/Client";

export interface Mentions {
  channels: Collection<Snowflake, TextBasedChannel | GuildBasedChannel>;
  client: Client;
  everyone: boolean;
  guild: Guild;
  members: Collection<Snowflake, GuildMember>;
  repliedUser: User | null;
  roles: Collection<Snowflake, Role>;
  users: Collection<Snowflake, User>;
  crosspostedChannels: Collection<Snowflake, CrosspostedChannel>;
}
