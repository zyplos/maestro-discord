import type { Client, ClientEvents } from "discord.js";

export default abstract class MaestroEvent<T extends keyof ClientEvents> {
  client: Client;
  eventName!: T;

  constructor(client: Client) {
    this.client = client;
  }

  abstract run(
    ...args: ClientEvents[T]
    // biome-ignore lint/suspicious/noExplicitAny: <explanation>
  ): any;
}
