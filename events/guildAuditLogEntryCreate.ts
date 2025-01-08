import {
  type TextChannel,
  type GuildAuditLogsEntry,
  type Guild,
  type Client,
  AuditLogEvent,
  EmbedBuilder,
} from "discord.js";
import { makeChannelInfoString, makeUserInfoString } from "../internals/util";
import LoggedEvent from "../internals/LoggedEvent";

export default class GuildAuditLogEntryHandler extends LoggedEvent<"guildAuditLogEntryCreate"> {
  auditLogDisclaimer =
    "\n\n-# Discord does not send specific details about the deleted message itself in the Audit Log. Cross-reference with other logs or open the Audit Log in Discord for more information.";

  constructor(client: Client) {
    super(client);
    this.eventName = "guildAuditLogEntryCreate";
  }

  grabGuild(auditLogEntry: GuildAuditLogsEntry, guild: Guild) {
    return guild;
  }

  run(
    logChannel: TextChannel,
    auditLogEntry: GuildAuditLogsEntry,
    guild: Guild
  ) {
    const { action } = auditLogEntry;

    // Check only for deleted messages.
    if (action === AuditLogEvent.MessageDelete) {
      this.handleMessageDelete(logChannel, auditLogEntry);
    }
  }

  async handleMessageDelete(
    logChannel: TextChannel,
    auditLogEntry: GuildAuditLogsEntry
  ) {
    const { executorId, targetId, extra, createdAt } = auditLogEntry;
    if (!executorId) return;
    if (!targetId) return;

    // Ensure the executor is cached.
    const executor = await this.client.users.fetch(executorId);

    // Ensure the author whose message was deleted is cached.
    const target = await this.client.users.fetch(targetId);

    console.log(auditLogEntry);

    let channelString: string | null = null;
    if (extra && "channel" in extra) {
      if ("name" in extra.channel) {
        const channelName = extra.channel.name;
        const channelId = extra.channel.id;
        channelString = `<#${channelId}> (${channelName} ${channelId})`;
      }
    }

    const embed = new EmbedBuilder()
      .setTitle("Audit Log • Message Deleted")
      .setDescription(
        `A message from ${makeUserInfoString(
          target
        )} was deleted by ${makeUserInfoString(executor)}${
          channelString ? ` in ${channelString}` : ""
        }.${this.auditLogDisclaimer}`
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

    await logChannel.send({ embeds: [embed] });
  }
}
