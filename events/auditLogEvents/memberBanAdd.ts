import {
  type TextChannel,
  type GuildAuditLogsEntry,
  type Guild,
  AuditLogEvent,
  type Client,
  EmbedBuilder,
} from "discord.js";
import LoggedAuditEvent from "@/internals/LoggedAuditEvent";
import { makeUserInfoString } from "@/internals/util";

export default class AuditMemberBanAddHandler extends LoggedAuditEvent {
  constructor(client: Client) {
    super(client, AuditLogEvent.MemberBanAdd);
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
    const target = await this.client.users.fetch(targetId);

    const embed = new EmbedBuilder()
      .setTitle("Audit Log • Member Banned")
      .setDescription(
        `${makeUserInfoString(target)} was banned by ${makeUserInfoString(
          executor
        )}.`
      )
      .setColor(0xff3e3e)
      .setTimestamp(createdAt)
      .setFooter({
        text: "Audit Log entry sent",
      });

    await logChannel.send({ embeds: [embed] });
  }
}
