import type {
  AuditLogEvent,
  Client,
  Guild,
  GuildAuditLogsEntry,
  TextChannel,
} from "discord.js";
import LoggedEvent from "./LoggedEvent";

export default abstract class LoggedAuditEvent extends LoggedEvent<"guildAuditLogEntryCreate"> {
  override eventName = "guildAuditLogEntryCreate" as const;

  auditLogEvent: AuditLogEvent;

  auditLogDisclaimer =
    "\n\n-# Discord does not send specific details about the deleted message itself in the Audit Log. Cross-reference with other logs or open the Audit Log in Discord for more information.";

  constructor(client: Client, auditLogEvent: AuditLogEvent) {
    super(client);

    this.auditLogEvent = auditLogEvent;
  }

  // this is what gets evoked when the event is fired
  override async preRun(auditLogEntry: GuildAuditLogsEntry, guild: Guild) {
    if (auditLogEntry.action !== this.auditLogEvent) return; // not the audit log entry type we want

    const logChannel = await this.getLogChannel(auditLogEntry, guild);
    if (!logChannel) return; // can't do anything without a log channel

    // all audit logs were caching the executor, so we'll just put that logic here so all subclasses do it automatically
    if (auditLogEntry.executorId) {
      await this.client.users.fetch(auditLogEntry.executorId);
    }

    this.run(logChannel, auditLogEntry, guild);
  }

  grabGuild(auditLogEntry: GuildAuditLogsEntry, guild: Guild) {
    return guild;
  }

  abstract override run(
    logChannel: TextChannel,
    auditLogEntry: GuildAuditLogsEntry,
    guild: Guild
  ): void;
}
