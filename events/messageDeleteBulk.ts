import type {
  Client,
  GuildTextBasedChannel,
  Message,
  OmitPartialGroupDMChannel,
  PartialMessage,
  ReadonlyCollection,
} from "discord.js";
import MaestroEvent from "@/internals/MaestroEvent";
import type MessageDeleteHandler from "./messageDelete";

export default class MessageDeleteBulkHandler extends MaestroEvent<"messageDeleteBulk"> {
  messageDeleteFunction: (
    message: OmitPartialGroupDMChannel<Message<boolean> | PartialMessage>
  ) => Promise<void>;

  constructor(client: Client) {
    super(client);
    this.eventName = "messageDeleteBulk";

    const messageDeleteClassInstance = client.maestroEvents.get(
      "messageDelete.ts"
    ) as MessageDeleteHandler;
    if (!messageDeleteClassInstance) {
      throw new Error(
        "MessageDeleteBulkHandler expected MessageDeleteHandler to already be loaded"
      );
    }

    this.messageDeleteFunction = messageDeleteClassInstance.preRun.bind(
      messageDeleteClassInstance
    );
  }

  async run(
    messages: ReadonlyCollection<
      string,
      OmitPartialGroupDMChannel<Message<boolean> | PartialMessage>
    >,
    channel: GuildTextBasedChannel
  ) {
    for (const message of messages.values()) {
      this.messageDeleteFunction(message);
    }
  }
}
