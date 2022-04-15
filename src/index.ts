/** @format */

// imports
/// structures
import { Client } from "./structures/Client";
import { Command } from "./structures/Command";

/// interfaces
import { ClientOptions } from "./interfaces/ClientOptions";
import { CommandFunction } from "./interfaces/CommandFunction";
import { CommandOptions } from "./interfaces/CommandOptions";
import { Event } from "./interfaces/Event";
import { EventFunction } from "./interfaces/EventFunction";

/// functions
import { toPascalCase } from "./functions/toPascalCase";

// exports
export {
  Client,
  Command,
  ClientOptions,
  CommandFunction,
  CommandOptions,
  Event,
  EventFunction,
  toPascalCase
};
