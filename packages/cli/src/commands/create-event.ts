import inquirer from "inquirer";
import type { ClientEvents } from "discord.js";

// TODO: find a better way to do this
const events = [
  "apiResponse",
  "apiRequest",
  "debug",
  "rateLimit",
  "invalidRequestWarning",
  "applicationCommandCreate",
  "applicationCommandDelete",
  "applicationCommandUpdate",
  "cacheSweep",
  "channelCreate",
  "channelDelete",
  "channelPinsUpdate",
  "channelUpdate",
  "warn",
  "emojiCreate",
  "emojiDelete",
  "emojiUpdate",
  "error",
  "guildBanAdd",
  "guildBanRemove",
  "guildCreate",
  "guildDelete",
  "guildUnavailable",
  "guildIntegrationsUpdate",
  "guildMemberAdd",
  "guildMemberAvailable",
  "guildMemberRemove",
  "guildMembersChunk",
  "guildMemberUpdate",
  "guildUpdate",
  "inviteCreate",
  "inviteDelete",
  "message",
  "messageCreate",
  "messageDelete",
  "messageReactionRemoveAll",
  "messageReactionRemoveEmoji",
  "messageDeleteBulk",
  "messageReactionAdd",
  "messageReactionRemove",
  "messageUpdate",
  "presenceUpdate",
  "ready",
  "invalidated",
  "roleCreate",
  "roleDelete",
  "roleUpdate",
  "threadCreate",
  "threadDelete",
  "threadListSync",
  "threadMemberUpdate",
  "threadMembersUpdate",
  "threadUpdate",
  "typingStart",
  "userUpdate",
  "voiceStateUpdate",
  "webhookUpdate",
  "interaction",
  "interactionCreate",
  "shardDisconnect",
  "shardError",
  "shardReady",
  "shardReconnecting",
  "shardResume",
  "stageInstanceCreate",
  "stageInstanceUpdate",
  "stageInstanceDelete",
  "stickerCreate",
  "stickerDelete",
  "stickerUpdate",
  "guildScheduledEventCreate",
  "guildScheduledEventUpdate",
  "guildScheduledEventDelete",
  "guildScheduledEventUserAdd",
  "guildScheduledEventUserRemove"
];

interface Answers {
  fileName: string;
  event: keyof ClientEvents;
}

/**
 * Create a new Fero-DC app.
 */
export async function createFeroDCEvent(): Promise<void> {
  const answers: Answers = await inquirer.prompt([
    {
      name: "fileName",
      type: "input",
      message: "What is the file name?"
    },
    {
      name: "event",
      type: "list",
      message: "What event do you want to listen to?",
      choices: events
    }
  ]);

  console.log(answers);
}