import type { Client, ClientEvents, Guild, TextChannel } from "discord.js";
import { getServerLogChannel } from "./util";
import { MaestroChannelError } from "./errors";

export default abstract class LoggedEvent<T extends keyof ClientEvents> {
  client: Client;
  eventName!: T;

  constructor(client: Client) {
    this.client = client;
  }

  async preRun(...args: ClientEvents[T]) {
    const guild = await this.grabGuild(...args);
    // guild is null for partials, don't do anything
    if (!guild) return;

    let logChannel: TextChannel | null = null;
    try {
      logChannel = await getServerLogChannel(this.client, guild.id);
    } catch (error) {
      if (error instanceof MaestroChannelError) {
        return;
      }

      this.client.logger.error(
        error,
        "Unexpected error fetching guild's log channel"
      );
      return;
    }
    if (!logChannel) return; // guild hasn't set up their log channel

    this.run(logChannel, ...args);
  }

  abstract grabGuild(...args: ClientEvents[T]): Guild | null;

  abstract run(
    logChannel: TextChannel,
    ...args: ClientEvents[T]
    // biome-ignore lint/suspicious/noExplicitAny: <explanation>
  ): any;
}
