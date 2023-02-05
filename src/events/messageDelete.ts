import { Client, Message, EmbedBuilder, escapeCodeBlock, AuditLogEvent, GuildAuditLogsEntry } from "discord.js";
import { getGuildLogChannel, isStringBlank, pluralize } from "../internals/util";

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

// "'extension' is possibly 'undefined'."
function truncateFileName(fileName: string | null): string {
  if (!fileName) return "(no file name)";

  const maxLength = 30;
  const extIndex = fileName.lastIndexOf(".");

  // file has no extension
  if (extIndex == -1) {
    if (fileName.length >= maxLength) {
      return fileName.substring(maxLength) + " (truncated)";
    } else {
      return fileName;
    }
  }

  const name = fileName.substring(0, extIndex);
  const extension = fileName.substring(extIndex + 1, fileName.length);

  // no truncation needed
  if (fileName.length <= maxLength) {
    return name + "." + extension;
  } else {
    return name.substring(0, maxLength) + "." + extension + " (truncated)";
  }
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

  let formattedText;
  if (isStringBlank(messageDeleted.content)) {
    formattedText = "(this message was empty)";
  } else {
    const text = escapeCodeBlock(messageDeleted.content);

    const textLenghtFormat = text.length > 4000 ? text.slice(0, 4000) + "... (truncated)" : text;
    formattedText = "```\n" + textLenghtFormat + "\n```";
  }

  const hasSwear = true;
  const swearCheck = hasSwear ? ":no_entry_sign: (Message flagged by swear check)\n" : "";

  const userString = `${messageDeleted.author} (${messageDeleted.author.tag} ${messageDeleted.author.id})`;

  let reportText = `A message from **${userString}** was deleted in ${channelString}\n`;
  reportText += swearCheck + "\n";
  reportText += auditLogData ? auditLogData.executorString + "\n" : "";

  // activity
  // applicationId
  // flags
  // hasThread
  // pinned
  // system
  // type
  // webhookId

  // attachments report
  const attachments = messageDeleted.attachments;
  const attachmentCount = attachments.size;
  reportText += `Message contained **${pluralize(attachmentCount, "attachment")}**:\n`;
  attachments.forEach(({ name, contentType, size, proxyURL }, _id) => {
    const fileName = truncateFileName(name);
    const fileType = contentType ? contentType : "(unknown type)";
    reportText += `_**${fileName}**_ - ${fileType} (${size}B) [(old link)](${proxyURL})\n`;
  });
  reportText += attachmentCount > 0 ? "\n" : "";

  // embed report
  const embedCount = messageDeleted.embeds.length;
  reportText += `Message had **${pluralize(embedCount, "embed")}.** `;
  reportText +=
    embedCount > 5
      ? "Appending the first 5 to the end of this report."
      : "They will be appended to the end of this report.";

  const msgEmbed = new EmbedBuilder()
    .setTitle("Message Deleted")
    .setDescription(formattedText)
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
    )
    .addFields({ name: "Info", value: reportText });

  return logChannel.send({ content: "\t", embeds: [...[msgEmbed], ...messageDeleted.embeds.slice(0, 5)] });
};
