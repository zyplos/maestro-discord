import { ChannelType, type Client } from "discord.js";

export const channelTypes = {
  [ChannelType.GuildText]: "Text Channel",
  [ChannelType.DM]: "DM Channel",
  [ChannelType.GuildVoice]: "Voice Channel",
  [ChannelType.GroupDM]: "Group DM",
  [ChannelType.GuildCategory]: "Channel Category",
  [ChannelType.GuildAnnouncement]: "Announcement Channel",
  [ChannelType.AnnouncementThread]: "Thread in an Announcement Channel",
  [ChannelType.PublicThread]: "Thread",
  [ChannelType.PrivateThread]: "Private Thread",
  [ChannelType.GuildStageVoice]: "Stage Channel",
  [ChannelType.GuildDirectory]: "Hub Directory",
  [ChannelType.GuildForum]: "Forum",
  [ChannelType.GuildMedia]: "Media Channel",
};

export async function getTextChannel(client: Client, channelId: string) {
  const channel = await client.channels.fetch(channelId);
  // channel was deleted or the bot doesn't have access to it
  if (!channel) {
    throw new Error(
      "I don't have access to view that channel (or it was just deleted)."
    );
  }

  // completely invalid channel type
  if (channel.isDMBased()) {
    throw new Error(
      `<#${channelId}> is a DM channel, not a server text channel.`
    );
  }

  // guild set log channel to an invalid channel type
  if (channel.type !== ChannelType.GuildText || !channel.isTextBased()) {
    throw new Error(
      `<#${channelId}> is a ${
        channelTypes[channel.type]
      }, not a server text channel.`
    );
  }

  return channel;
}

export async function getServerLogChannel(client: Client, serverId: string) {
  const logChannelId = await client.db.getServerLogChannelId(serverId);

  // guild hasn't set up their log channel
  if (!logChannelId) return false;

  const logChannel = await getTextChannel(client, logChannelId);

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
