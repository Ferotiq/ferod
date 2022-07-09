import * as Discord from "discord.js";
import { EventFunction, EventOptions } from "../types";

/**
 * A class to easily create events that interop with Fero-DC
 */
export class Event<E extends keyof Discord.ClientEvents> {
  private _options: Partial<EventOptions<E>> = {};

  /**
   * Set the event
   */
  public event(event: E): this {
    this._options.event = event;

    return this;
  }

  /**
   * Set the run function
   */
  public run(run: EventFunction<E>): this {
    this._options.run = run;

    return this;
  }

  /**
   * If this event is complete
   */
  public get options(): EventOptions<E> {
    if (this._options.event === undefined || this._options.run === undefined) {
      throw new Error("Event is not complete");
    }

    return this._options as EventOptions<E>;
  }
}
