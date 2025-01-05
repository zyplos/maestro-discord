import {
  TextChannel,
  type GuildAuditLogsEntry,
  type Guild,
  type Client,
  AuditLogEvent,
  EmbedBuilder,
} from "discord.js";
import {
  getServerLogChannel,
  makeChannelInfoString,
  makeUserInfoString,
} from "../internals/util";

export default async function (
  client: Client,
  auditLogEntry: GuildAuditLogsEntry,
  guild: Guild
) {
  console.log(auditLogEntry);
  const logChannel = await getServerLogChannel(client, guild.id);
  if (!logChannel) return;

  const { action } = auditLogEntry;

  // Check only for deleted messages.
  if (action === AuditLogEvent.MessageDelete) {
    handleMessageDelete(client, auditLogEntry, logChannel);
  }
}

async function handleMessageDelete(
  client: Client,
  auditLogEntry: GuildAuditLogsEntry,
  logChannel: TextChannel
) {
  const { executorId, targetId, extra, createdAt } = auditLogEntry;
  if (!executorId) return;
  if (!targetId) return;

  // Ensure the executor is cached.
  const executor = await client.users.fetch(executorId);

  // Ensure the author whose message was deleted is cached.
  const target = await client.users.fetch(targetId);

  let channelString: string | null = null;
  let guildId: string | null = null;
  if (extra && extra instanceof TextChannel) {
    channelString = makeChannelInfoString(extra);
    guildId = extra.guild.id;
  }

  const auditLogString = guildId
    ? `[open the Audit Log](discord://-/guilds/${guildId}/settings/audit-log)`
    : "open the Audit Log";

  const embed = new EmbedBuilder()
    .setTitle("Audit Log • Message Deleted")
    .setDescription(
      `A message from ${makeUserInfoString(
        target
      )} was deleted by ${makeUserInfoString(executor)}${
        channelString ? ` in ${channelString}` : ""
      }.\n\n-# Discord does not send specific details about the deleted message itself in the Audit Log. Cross-reference with other logs or ${auditLogString} in Discord for more information.`
    )
    .setColor(0xff3e3e)
    .setTimestamp(createdAt)
    .setFooter({
      text: "Audit Log entry sent",
    })
    .setThumbnail(
      target.displayAvatarURL({
        extension: "png",
        size: 128,
      })
    );
  // .setFooter({
  //   text: `Message ID: ${messageDeleted.id} • Deleted message was originally sent`,
  // })

  await logChannel.send({ embeds: [embed] });
}
