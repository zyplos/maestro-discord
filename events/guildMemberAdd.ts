import { type Client, type GuildMember, EmbedBuilder } from "discord.js";
import { getGuildLogChannel } from "../internals/util";

module.exports = async (client: Client, member: GuildMember) => {
  client.logger.debug(`${member.user.tag} joined ${member.guild.name}`);

  const logChannel = await getGuildLogChannel(client, member.guild.id);
  if (!logChannel) return; // guild hasn't set up their log channel

  const msgEmbed = new EmbedBuilder()
    .setTitle("Member Joined")
    .setDescription(
      `**${member} (${member.user.tag} ${member.user.id})** joined the server.`
    )
    .setColor(0x41e208)
    .setTimestamp(new Date())
    .setThumbnail(
      member.user.displayAvatarURL({
        extension: "png",
        size: 128,
      })
    );

  logChannel.send({ content: "\t", embeds: [msgEmbed] });
};
