import { type Client, type GuildMember, EmbedBuilder } from "discord.js";
import { getGuildLogChannel } from "../internals/util";

module.exports = async (client: Client, member: GuildMember) => {
  client.logger.debug(`${member.user.tag} left ${member.guild.name}`);

  const logChannel = await getGuildLogChannel(client, member.guild.id);
  if (!logChannel) return; // guild hasn't set up their log channel

  const msgEmbed = new EmbedBuilder()
    .setTitle("Member Left")
    .setDescription(
      `**${member.user.tag} (${member.user.id})** left the server.`
    )
    .setColor(0xe20808)
    .setTimestamp(new Date())
    .setThumbnail(
      member.user.displayAvatarURL({
        extension: "png",
        size: 128,
      })
    );

  logChannel.send({ content: "\t", embeds: [msgEmbed] });
};
