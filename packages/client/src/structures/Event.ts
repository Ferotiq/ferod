import * as Discord from "discord.js";
import { EventFunction, EventOptions } from "../types";

/**
 * A class to easily create events that interop with Fero-DC
 */
export class EventBuilder<
  E extends keyof Discord.ClientEvents = keyof Discord.ClientEvents
> {
  private _data: Partial<EventOptions<E>> = {};

  /**
   * The data of this event
   */
  public get data(): EventOptions<E> {
    if (this._data.event === undefined || this._data.run === undefined) {
      throw new Error("Event is missing required options");
    }

    return this._data as EventOptions<E>;
  }

  /**
   * Set the event
   */
  public event(event: E): this {
    this._data.event = event;

    return this;
  }

  /**
   * Set the run function
   */
  public run(run: EventFunction<E>): this {
    this._data.run = run;

    return this;
  }
}
