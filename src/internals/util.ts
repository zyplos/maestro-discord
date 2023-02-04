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
