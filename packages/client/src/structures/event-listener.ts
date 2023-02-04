import * as Discord from "discord.js";
import { EventListenerFunction, EventListenerOptions } from "../types";

/**
 * A class to easily create events that interop with Fero-DC
 */
export class EventListener<
  E extends keyof Discord.ClientEvents = keyof Discord.ClientEvents
> {
  private _data: Partial<EventListenerOptions<E>> = {};

  /**
   * Creates a new event listener
   * @param options The options for the event listener
   */
  public constructor(options?: EventListenerOptions<E>) {
    if (options !== undefined) {
      this._data = options;
    }
  }

  /**
   * The data of this event
   */
  public get data(): EventListenerOptions<E> {
    if (this._data.event === undefined || this._data.listener === undefined) {
      throw new Error("Event is missing required options");
    }

    return this._data as EventListenerOptions<E>;
  }

  /**
   * Set the event
   * @param event The event to listen to
   */
  public setEvent(event: E): this {
    this._data.event = event;

    return this;
  }

  /**
   * Set the listener function
   * @param listener The function to run when the event is emitted
   */
  public setListener(listener: EventListenerFunction<E>): this {
    this._data.listener = listener;

    return this;
  }
}
