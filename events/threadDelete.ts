import {
  type AnyThreadChannel,
  type Client,
  EmbedBuilder,
  type Guild,
  type TextChannel,
} from "discord.js";
import LoggedEvent from "@/internals/LoggedEvent";

export default class ThreadDeleteHandler extends LoggedEvent<"threadDelete"> {
  constructor(client: Client) {
    super(client);
    this.eventName = "threadDelete";
  }

  grabGuild(thread: AnyThreadChannel): Guild | null {
    return thread.guild;
  }

  run(logChannel: TextChannel, thread: AnyThreadChannel) {
    const msgEmbed = new EmbedBuilder()
      .setTitle("Thread Deleted")
      .setDescription(`**💬\#${thread.name} (${thread.id})** was deleted.`)
      .setColor(0xce5858)
      .setTimestamp(new Date());

    return logChannel.send({
      content: "\t",
      embeds: [msgEmbed],
    });
  }
}
