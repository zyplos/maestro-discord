import { Client, Message, EmbedBuilder, escapeCodeBlock, AuditLogEvent, GuildAuditLogsEntry } from "discord.js";
import { getGuildLogChannel } from "../internals/util";

function parseAuditLogEntry(
  deletionLog: GuildAuditLogsEntry<AuditLogEvent.MessageDelete> | undefined,
  authorId: string | null,
  channelId: string
) {
  if (!deletionLog) return false;

  const { executor, target, extra } = deletionLog;
  console.log("deletionLog", deletionLog);

  if (!executor) return false;
  const executorString = `🛡️ Deleted by ${executor} (${executor.tag} ${executor.id})\n`;
  const targetString = `👤 Sent by ${target} (${target.tag} ${target.id})`;

  if (!authorId) {
    if (extra.channel && extra.channel.id == channelId) {
      return { executorString, targetString };
    } else {
      return false;
    }
  }

  if (target.id !== authorId) return false;
  return { executorString, targetString };
}

module.exports = async (client: Client, messageDeleted: Message) => {
  // don't care about messages not in guilds
  if (!messageDeleted.guild) return;

  const logChannel = await getGuildLogChannel(client, messageDeleted.guild.id);
  if (!logChannel) return; // guild hasn't set up their log channel

  console.log("messageDeleted", messageDeleted);

  const fetchedLogs = await messageDeleted.guild.fetchAuditLogs({
    limit: 1,
    type: AuditLogEvent.MessageDelete,
  });
  const deletionLog = fetchedLogs.entries.first();
  const auditLogData = parseAuditLogEntry(deletionLog, messageDeleted.author?.id, messageDeleted.channelId);

  const messageChannel = messageDeleted.channel;
  const channelName = messageChannel.isTextBased() && !messageChannel.isDMBased() && messageChannel.name;
  const isThreadChannel = messageChannel.isThread();
  const channelNameFormatted = channelName ? `(${(isThreadChannel && "💬") || ""}#${channelName})` : "";
  const channelString = `${messageChannel} ${channelNameFormatted}`;

  if (messageDeleted.partial) {
    let auditLogString = "";
    if (auditLogData) {
      auditLogString += "Server Audit Log's last detected deleted message in that channel:\n";
      auditLogString += auditLogData.targetString + "\n";
      auditLogString += auditLogData.executorString + "\n";
    }

    const msgEmbed = new EmbedBuilder()
      .setTitle("Message Deleted")
      .setDescription(
        `An old untracked message was deleted from ${channelString}.\nNo accurate data could be found on the author.\n\n${auditLogString}`
      )
      .setColor(0xff3e3e)
      .setTimestamp(messageDeleted.createdTimestamp)
      .setFooter({
        text: "Deleted message was originally sent",
      });

    return logChannel.send({ content: "\t", embeds: [msgEmbed] });
  }

  const text = escapeCodeBlock(messageDeleted.content);
  const hasSwear = true;

  const userString = `${messageDeleted.author} (${messageDeleted.author.tag} ${messageDeleted.author.id})`;

  const swearCheck = hasSwear ? ":no_entry_sign: (Message flagged by swear check)\n" : "";
  const formattedText = "```\n" + text + "\n```";

  const msgEmbed = new EmbedBuilder()
    .setTitle("Message Deleted")
    .setDescription(
      `A message from **${userString}** was deleted in ${channelString}\n${swearCheck}${
        auditLogData ? auditLogData.executorString : ""
      }` + formattedText
    )
    .setColor(0xff3e3e)
    .setTimestamp(messageDeleted.createdTimestamp)
    .setFooter({
      text: "Deleted message was originally sent",
    })
    .setThumbnail(
      `${messageDeleted.author.displayAvatarURL({
        extension: "png",
        size: 128,
      })}`
    );

  return logChannel.send({ content: "\t", embeds: [msgEmbed] });
};
