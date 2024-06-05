import {
  AuditLogEvent,
  type Client,
  EmbedBuilder,
  type GuildAuditLogsEntry,
  type ThreadChannel,
} from "discord.js";
import { getServerLogChannel } from "../internals/util";

function parseAuditLogEntry(
  deletionLog: GuildAuditLogsEntry<AuditLogEvent.ThreadDelete> | undefined,
  threadId: string
) {
  if (!deletionLog) return null;

  const { executor, target } = deletionLog;
  console.log("deletionLog", deletionLog);
  if (target.id !== threadId) return null;

  if (!executor) return null;
  const executorString = `🛡️ Deleted by ${executor} (${executor.tag} ${executor.id})\n`;

  return executorString;
}

export default async function (client: Client, thread: ThreadChannel) {
  const logChannel = await getServerLogChannel(client, thread.guild.id);
  if (!logChannel) return; // guild hasn't set up their log channel

  console.log("thread", thread);

  let auditLogData = null;
  let auditLogFailed = false;
  try {
    const fetchedLogs = await thread.guild.fetchAuditLogs({
      limit: 1,
      type: AuditLogEvent.ThreadDelete,
    });
    const deletionLog = fetchedLogs.entries.first();
    auditLogData = parseAuditLogEntry(deletionLog, thread.id);
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

  const msgEmbed = new EmbedBuilder()
    .setTitle("Thread Deleted")
    .setDescription(
      `**💬\#${thread.name} (${thread.id})** was deleted.\n${reportText}`
    )
    .setColor(0xce5858)
    .setTimestamp(new Date());

  return logChannel.send({
    content: "\t",
    embeds: [msgEmbed],
  });
}
