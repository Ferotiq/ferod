import * as Discord from "discord.js";
import { EventFunction } from "../types";

/**
 * A class to easily create events that interop with Fero-DC
 */
export class Event<E extends keyof Discord.ClientEvents> {
  public event: E;
  public run: EventFunction<E>;

  /**
   * Creates a new event
   * @param event
   * @param run
   */
  public constructor(event: E, run: EventFunction<E>) {
    this.event = event;
    this.run = run;
  }
}
