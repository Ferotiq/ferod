import * as Discord from "discord.js";
import { EventListenerFunction, EventListenerOptions } from "../types";

/**
 * A class to easily create events that interop with Fero-DC
 */
export class EventListener<
  E extends keyof Discord.ClientEvents = keyof Discord.ClientEvents
> {
  private _event?: E;
  private _listener?: EventListenerFunction<E>;

  /**
   * Creates a new event listener
   * @param options The options for the event listener
   */
  public constructor(options?: EventListenerOptions<E>) {
    if (options !== undefined) {
      this._event = options.event;
      this._listener = options.listener;
    }
  }

  /**
   * The event to listen to
   */
  public get event(): E {
    if (this._event === undefined) {
      throw new Error("Missing required property: event");
    }

    return this._event;
  }

  /**
   * The function to run when the event is emitted
   */
  public get listener(): EventListenerFunction<E> {
    if (this._listener === undefined) {
      throw new Error("Missing required property: listener");
    }

    return this._listener;
  }

  /**
   * Set the event
   * @param event The event to listen to
   */
  public setEvent(event: E): this {
    this._event = event;

    return this;
  }

  /**
   * Set the listener function
   * @param listener The function to run when the event is emitted
   */
  public setListener(listener: EventListenerFunction<E>): this {
    this._listener = listener;

    return this;
  }
}
