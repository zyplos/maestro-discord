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

export default class AuditThreadDeleteHandler extends LoggedAuditEvent {
  constructor(client: Client) {
    super(client, AuditLogEvent.ThreadDelete);
  }

  async run(
    logChannel: TextChannel,
    auditLogEntry: GuildAuditLogsEntry,
    guild: Guild
  ) {
    const { executorId, target, createdAt } = auditLogEntry;
    if (!executorId) return;
    if (!target) return;

    if (!("name" in target)) return;

    const executor = await this.client.users.fetch(executorId);

    const embed = new EmbedBuilder()
      .setTitle("Audit Log • Thread Deleted")
      .setDescription(
        `Thread **${target.name} (${
          target.id
        })** was deleted by ${makeUserInfoString(executor)}.`
      )
      .setColor(0xff3e3e)
      .setTimestamp(createdAt)
      .setFooter({
        text: "Audit Log entry sent",
      });

    await logChannel.send({ embeds: [embed] });
  }
}
