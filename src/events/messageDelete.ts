import { Client, Message, EmbedBuilder, escapeCodeBlock } from "discord.js";
import { getGuildLogChannel } from "../internals/util";

module.exports = async (client: Client, messageDeleted: Message) => {
  // don't care about messages not in guilds
  if (!messageDeleted.guild) return;

  const logChannel = await getGuildLogChannel(client, messageDeleted.guild.id);
  if (!logChannel) return; // guild hasn't set up their log channel

  console.log(messageDeleted);

  if (messageDeleted.partial) {
    // TODO
    return logChannel.send("old messag edunno");
  }

  const text = escapeCodeBlock(messageDeleted.content);
  const hasSwear = true;

  const userString = `${messageDeleted.author} (${messageDeleted.author.tag} ${messageDeleted.author.id})`;

  const messageChannel = messageDeleted.channel;

  const channelName = messageChannel.isTextBased() && !messageChannel.isDMBased() && messageChannel.name;
  const isThreadChannel = messageChannel.isThread();
  const channelNameFormatted = channelName ? `(${isThreadChannel && "💬"}#${channelName})` : "";

  const channelString = `${messageChannel} ${channelNameFormatted}`;

  const swearCheck = hasSwear ? ":no_entry_sign: (Message flagged by swear check)\n" : "";
  const formattedText = "```\n" + text + "\n```";

  const msgEmbed = new EmbedBuilder()
    .setTitle("Message Deleted")
    .setDescription(`A message from **${userString}** was deleted in ${channelString}\n${swearCheck}` + formattedText)
    .setColor(0xff3e3e)
    .setTimestamp(messageDeleted.createdTimestamp)
    .setThumbnail(
      `${messageDeleted.author.displayAvatarURL({
        extension: "png",
        size: 128,
      })}`
    );

  return logChannel.send({ content: "\t", embeds: [msgEmbed] });
};
