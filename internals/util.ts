import {
  ChannelType,
  type User,
  type Client,
  type GuildChannel,
  type TextChannel,
  PermissionFlagsBits,
  type ClientUser,
} from "discord.js";
import { MaestroChannelError, MaestroPermissionsError } from "./errors";

export const channelTypes: { [key in ChannelType]: string } = {
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

/**
 * Fetches a text channel from the Discord client by its ID.
 *
 * @param client - The Discord client instance.
 * @param channelId - The ID of the channel to fetch.
 * @returns The fetched text channel.
 * @throws Will throw an error if the channel is not accessible, is a DM channel, or is not a server text channel.
 */
export async function getTextChannel(client: Client, channelId: string) {
  const channel = await client.channels.fetch(channelId);
  // channel was deleted or the bot doesn't have access to it
  if (!channel) {
    throw new MaestroChannelError(
      "I don't have access to view that channel (or it was just deleted)."
    );
  }

  // completely invalid channel type
  if (channel.isDMBased()) {
    throw new MaestroChannelError(
      `<#${channelId}> is a DM channel, not a server text channel.`
    );
  }

  // guild set log channel to an invalid channel type
  if (channel.type !== ChannelType.GuildText || !channel.isTextBased()) {
    throw new MaestroChannelError(
      `<#${channelId}> is a ${
        channelTypes[channel.type]
      }, not a server text channel.`
    );
  }

  return channel;
}

/**
 * Validates if the client user has the necessary permissions to send messages in the specified text channel.
 *
 * @param clientUser - The client user whose permissions are being checked.
 * @param channel - The text channel in which the permissions are being validated.
 * @returns A promise that resolves to `true` if the client user has the required permissions.
 * @throws Will throw an error if the permissions cannot be checked or if the client user lacks the necessary permissions.
 */
export async function validateChannelPermissions(
  clientUser: ClientUser,
  channel: TextChannel
) {
  const permissionsField = channel.permissionsFor(clientUser);

  // future TODO: return missing permissions as an array so we can tell the user everything they're missing in config
  if (!permissionsField) {
    throw new MaestroPermissionsError(
      `I couldn't check if I have permission to send messages in <#${channel.id}>. Please try again later.`
    );
  }

  // check if bot has "Send Messages" permission in the channel
  if (
    !permissionsField.has(
      [PermissionFlagsBits.SendMessages, PermissionFlagsBits.ViewChannel],
      true
    )
  ) {
    throw new MaestroPermissionsError(
      `I don't have permission to see and send messages in <#${channel.id}>. Please make sure I have the **View Channel** and **Send Messages** permission in that channel.`
    );
  }

  if (!permissionsField.has(PermissionFlagsBits.EmbedLinks, true)) {
    throw new MaestroPermissionsError(
      `I don't have permission send embeds in <#${channel.id}>. Please make sure I have the **Embed Links** permission in that channel.`
    );
  }

  if (!permissionsField.has(PermissionFlagsBits.AttachFiles, true)) {
    throw new MaestroPermissionsError(
      `I don't have permission to attach files in <#${channel.id}>. Please make sure I have the **Attach Files** permission in that channel.`
    );
  }

  // looks good
  return true;
}

/**
 * Retrieves the log channel for a specific server.
 *
 * @param client - The Discord client instance.
 * @param serverId - The ID of the server to retrieve the log channel for.
 * @returns The log channel if it exists, otherwise `false`.
 * @throws Will throw an error if the log channel has become inaccessible since it was set.
 */
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

export function makeUserInfoString(user: User) {
  const systemString = user.system ? "[SYSTEM]" : "";
  const botString = user.bot ? "[BOT]" : "";
  return `**${user} (${systemString}${botString} ${user.tag} ${user.id})**`;
}

export function makeChannelInfoString(channel: GuildChannel) {
  const channelName = channel.name;
  const isThreadChannel = channel.isThread();
  const threadString = isThreadChannel ? "💬" : "";
  return `${channel} (${threadString}#${channelName})`;
}
