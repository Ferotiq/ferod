import type { ClientEvents } from "discord.js";
import type { EventListenerHandler, EventListenerOptions } from "../types.js";

/**
 * A class to easily create events that interop with Ferod
 */
export class EventListener<
	TEvent extends keyof ClientEvents = keyof ClientEvents
> {
	private _event?: TEvent;
	private _handler?: EventListenerHandler<TEvent>;

	/**
	 * Creates a new event listener
	 * @param options The options for the event listener
	 */
	public constructor(options?: EventListenerOptions<TEvent>) {
		if (options !== undefined) {
			this._event = options.event;
			this._handler = options.handler;
		}
	}

	/**
	 * The event to listen to
	 */
	public get event(): TEvent {
		if (this._event === undefined) {
			throw new Error("Missing required property: event");
		}

		return this._event;
	}

	/**
	 * The function to run when the event is emitted
	 */
	public get handler(): EventListenerHandler<TEvent> {
		if (this._handler === undefined) {
			throw new Error("Missing required property: handler");
		}

		return this._handler;
	}

	/**
	 * Set the event
	 * @param event The event to listen to
	 */
	public setEvent<E2 extends keyof ClientEvents>(event: E2): EventListener<E2> {
		this._event = event as unknown as TEvent;

		return this as unknown as EventListener<E2>;
	}

	/**
	 * Set the handler function
	 * @param handler The function to run when the event is emitted
	 */
	public setHandler(handler: EventListenerHandler<TEvent>): this {
		this._handler = handler;

		return this;
	}
}
