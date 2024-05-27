import {
  AuditLogEvent,
  type Client,
  type DMChannel,
  EmbedBuilder,
  escapeMarkdown,
  type GuildAuditLogsEntry,
  type NonThreadGuildBasedChannel,
} from "discord.js";
import { getGuildLogChannel } from "../internals/util";

function parseAuditLogEntry(
  deletionLog: GuildAuditLogsEntry<AuditLogEvent.ChannelDelete> | undefined,
  channelId: string
) {
  if (!deletionLog) return null;

  const { executor, target } = deletionLog;
  console.log("deletionLog", deletionLog);
  if (target.id !== channelId) return null;

  if (!executor) return null;
  const executorString = `🛡️ Deleted by ${executor} (${executor.tag} ${executor.id})\n`;

  return executorString;
}

const channelTypes = {
  0: "Text Channel",
  1: "DM Channel",
  2: "Voice Channel",
  3: "Group DM",
  4: "Channel Category",
  5: "Announcement Channel",
  10: "Thread in Announcement Channel",
  11: "Thread",
  12: "Private Thread",
  13: "Stage Channel",
  14: "Hub Directory",
  15: "Forum",
};

module.exports = async (
  _client: Client,
  channel: DMChannel | NonThreadGuildBasedChannel
) => {
  if (channel.isDMBased()) return; // don't care about DMs

  const logChannel = await getGuildLogChannel(_client, channel.guild.id);
  if (!logChannel) return; // guild hasn't set up their log channel

  console.log("channel", channel);

  let auditLogData = null;
  let auditLogFailed = false;
  try {
    const fetchedLogs = await channel.guild.fetchAuditLogs({
      limit: 1,
      type: AuditLogEvent.ChannelDelete,
    });
    const deletionLog = fetchedLogs.entries.first();
    auditLogData = parseAuditLogEntry(deletionLog, channel.id);
  } catch (error) {
    auditLogFailed = true;
  }

  let reportText = "";
  if (auditLogFailed) {
    reportText +=
      "Couldn't get the server's Audit Log to get extra info. Please make sure I have the \"View Audit Log\" permission.\n";
  } else {
    reportText += auditLogData ? auditLogData + "\n" : "";
  }

  const channelType = channelTypes[channel.type] || "";

  const msgEmbed = new EmbedBuilder()
    .setTitle("Channel Deleted")
    .setDescription(
      `${channelType} **${escapeMarkdown(channel.name)} (${
        channel.id
      })** was deleted.\n${reportText}`
    )
    .setColor(0xff0000)
    .setTimestamp(new Date());

  return logChannel.send({
    content: "\t",
    embeds: [msgEmbed],
  });
};
