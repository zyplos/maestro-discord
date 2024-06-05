import { ChannelType, type Client } from "discord.js";

export async function getServerLogChannel(client: Client, serverId: string) {
  const logChannelId = await client.db.getServerLogChannelId(serverId);

  // guild hasn't set up their log channel
  if (!logChannelId) return false;

  const logChannel = await client.channels.fetch(logChannelId);
  // channel was deleted or the bot doesn't have access to it
  if (!logChannel) return false;

  // completely invalid channel type
  if (logChannel.isDMBased()) {
    client.logger.error(
      `Somehow, someone set up a log channel that's in their DMs?? ${logChannelId} | ${logChannel.type}`
    );
    return false;
  }

  // guild set log channel to an invalid channel type
  if (logChannel.type !== ChannelType.GuildText || !logChannel.isTextBased()) {
    client.logger.error(
      `Somehow, someone set up a log channel that isn't a text channel. ${logChannel.guild.name} ${logChannel.guild.id} | ${logChannel.name} ${logChannelId} | ${logChannel.type}`
    );
    return false;
  }

  return logChannel;
}

// https://stackoverflow.com/a/3261380
export function isStringBlank(str: string) {
  return !str || /^\s*$/.test(str);
}

// https://stackoverflow.com/a/39835908
export function pluralize(count: number, noun: string, suffix = "s") {
  return `${count} ${noun}${count !== 1 ? suffix : ""}`;
}

// i made this me mine it took a while but i did it,
export function truncateFileName(fileName: string | null): string {
  if (!fileName) return "(no file name)";

  const maxLength = 30;
  const extIndex = fileName.lastIndexOf(".");

  // file has no extension
  if (extIndex === -1) {
    if (fileName.length >= maxLength) {
      return `${fileName.substring(maxLength)} (truncated)`;
    }

    return fileName;
  }

  const name = fileName.substring(0, extIndex);
  const extension = fileName.substring(extIndex + 1, fileName.length);

  // no truncation needed
  if (fileName.length <= maxLength) {
    return `${name}.${extension}`;
  }

  return `${name.substring(0, maxLength)}.${extension} (truncated)`;
}
