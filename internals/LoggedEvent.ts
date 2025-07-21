import type { Client, ClientEvents, Guild, TextChannel } from "discord.js";
import { getServerLogChannel } from "./util";
import { MaestroChannelError } from "./errors";

export default abstract class LoggedEvent<T extends keyof ClientEvents> {
  client: Client;
  eventName!: T;

  constructor(client: Client) {
    this.client = client;
  }

  // this is what gets evoked when the event is fired
  async preRun(...args: ClientEvents[T]) {
    const logChannel = await this.getLogChannel(...args);
    if (!logChannel) return; // can't do anything without a log channel

    this.run(logChannel, ...args);
  }

  async getLogChannel(...args: ClientEvents[T]) {
    const guild = await this.grabGuild(...args);
    // guild is null for partials, don't do anything
    if (!guild) return null;

    let logChannel: TextChannel | null = null;
    try {
      logChannel = await getServerLogChannel(this.client, guild.id);
    } catch (error) {
      if (error instanceof MaestroChannelError) {
        return null; // channel has become inaccessible since it was set up, nothing to do
      }

      this.client.logger.error(
        error,
        "Unexpected error fetching guild's log channel"
      );
      return null;
    }

    return logChannel;
  }

  abstract grabGuild(...args: ClientEvents[T]): Guild | null;

  abstract run(logChannel: TextChannel, ...args: ClientEvents[T]): void;
}
