import * as Discord from "discord.js";
import type { EventListenerHandler, EventListenerOptions } from "../types";

/**
 * A class to easily create events that interop with Ferod
 */
export class EventListener<
	E extends keyof Discord.ClientEvents = keyof Discord.ClientEvents
> {
	private _event?: E;
	private _handler?: EventListenerHandler<E>;

	/**
	 * Creates a new event listener
	 * @param options The options for the event listener
	 */
	public constructor(options?: EventListenerOptions<E>) {
		if (options !== undefined) {
			this._event = options.event;
			this._handler = options.handler;
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
	public get handler(): EventListenerHandler<E> {
		if (this._handler === undefined) {
			throw new Error("Missing required property: handler");
		}

		return this._handler;
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
	 * Set the handler function
	 * @param handler The function to run when the event is emitted
	 */
	public setHandler(handler: EventListenerHandler<E>): this {
		this._handler = handler;

		return this;
	}
}
