import type {
  Client,
  GuildTextBasedChannel,
  Message,
  PartialMessage,
  ReadonlyCollection,
} from "discord.js";
import MaestroEvent from "../internals/MaestroEvent";

export default class MessageDeleteBulkHandler extends MaestroEvent<"messageDeleteBulk"> {
  constructor(client: Client) {
    super(client);
    this.eventName = "messageDeleteBulk";
  }

  run(
    messages: ReadonlyCollection<string, Message<boolean> | PartialMessage>,
    channel: GuildTextBasedChannel
  ) {
    this.client.logger.error("Method not implemented.");
  }
}
