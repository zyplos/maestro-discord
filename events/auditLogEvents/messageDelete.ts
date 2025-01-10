import {
  type TextChannel,
  type GuildAuditLogsEntry,
  type Guild,
  AuditLogEvent,
  type Client,
  EmbedBuilder,
} from "discord.js";
import LoggedAuditEvent from "../../internals/LoggedAuditEvent";
import { makeUserInfoString } from "../../internals/util";

export default class AuditMessageDeleteHandler extends LoggedAuditEvent {
  constructor(client: Client) {
    super(client, AuditLogEvent.MessageDelete);
  }

  async run(
    logChannel: TextChannel,
    auditLogEntry: GuildAuditLogsEntry,
    guild: Guild
  ) {
    const { executorId, targetId, extra, createdAt } = auditLogEntry;
    if (!executorId) return;
    if (!targetId) return;

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
