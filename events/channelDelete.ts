import {
  type Client,
  type DMChannel,
  EmbedBuilder,
  escapeMarkdown,
  type NonThreadGuildBasedChannel,
  type TextChannel,
} from "discord.js";
import { channelTypes } from "@/internals/util";
import LoggedEvent from "@/internals/LoggedEvent";
export default class ChannelDeleteHandler extends LoggedEvent<"channelDelete"> {
  constructor(client: Client) {
    super(client);
    this.eventName = "channelDelete";
  }

  grabGuild(channel: DMChannel | NonThreadGuildBasedChannel) {
    if (channel.isDMBased()) return null; // don't care about DMs
    return channel.guild;
  }

  run(logChannel: TextChannel, channel: NonThreadGuildBasedChannel) {
    const channelType = channelTypes[channel.type] || "";

    const msgEmbed = new EmbedBuilder()
      .setTitle("Channel Deleted")
      .setDescription(
        `${channelType} **${escapeMarkdown(channel.name)} (${
          channel.id
        })** was deleted.`
      )
      .setColor(0xff0000)
      .setTimestamp(new Date());

    return logChannel.send({
      content: "\t",
      embeds: [msgEmbed],
    });
  }
}
