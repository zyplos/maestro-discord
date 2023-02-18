import { ChannelType, Client } from "discord.js";
// import { getGuildSettings } from "./database";

export async function getGuildLogChannel(client: Client, _guildId: string) {
  // const { logChannelId } = getGuildSettings(guildId);
  const logChannelId = process.env.DEV_CHANNEL_ID;

  const logChannel = await client.channels.fetch(logChannelId);
  // guild hasn't set up their log channel
  if (!logChannel) return false;

  // completely invalid channel type
  if (logChannel.isDMBased()) {
    client.logger.error(
      `Somehow, someone set up a log channel that's in their DMs?? ${logChannelId} | ${logChannel.type}`
    );
    return false;
  }

  // guild set log channel to an invalid channel type
  if (logChannel.type != ChannelType.GuildText || !logChannel.isTextBased()) {
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
  if (extIndex == -1) {
    if (fileName.length >= maxLength) {
      return fileName.substring(maxLength) + " (truncated)";
    } else {
      return fileName;
    }
  }

  const name = fileName.substring(0, extIndex);
  const extension = fileName.substring(extIndex + 1, fileName.length);

  // no truncation needed
  if (fileName.length <= maxLength) {
    return name + "." + extension;
  } else {
    return name.substring(0, maxLength) + "." + extension + " (truncated)";
  }
}
