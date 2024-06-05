import {
  AuditLogEvent,
  type Client,
  type DMChannel,
  EmbedBuilder,
  escapeMarkdown,
  type GuildAuditLogsEntry,
  type NonThreadGuildBasedChannel,
  ChannelType,
} from "discord.js";
import { getServerLogChannel } from "../internals/util";

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
  [ChannelType.GuildText]: "Text Channel",
  [ChannelType.DM]: "DM Channel",
  [ChannelType.GuildVoice]: "Voice Channel",
  [ChannelType.GroupDM]: "Group DM",
  [ChannelType.GuildCategory]: "Channel Category",
  [ChannelType.GuildAnnouncement]: "Announcement Channel",
  [ChannelType.AnnouncementThread]: "Thread in Announcement Channel",
  [ChannelType.PublicThread]: "Thread",
  [ChannelType.PrivateThread]: "Private Thread",
  [ChannelType.GuildStageVoice]: "Stage Channel",
  [ChannelType.GuildDirectory]: "Hub Directory",
  [ChannelType.GuildForum]: "Forum",
  [ChannelType.GuildMedia]: "Media Channel",
};

module.exports = async (
  client: Client,
  channel: DMChannel | NonThreadGuildBasedChannel
) => {
  if (channel.isDMBased()) return; // don't care about DMs

  const logChannel = await getServerLogChannel(client, channel.guild.id);
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
    reportText += auditLogData ? `${auditLogData}\n` : "";
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
