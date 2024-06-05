import { type Client, EmbedBuilder, type GuildBan } from "discord.js";
import { getServerLogChannel } from "../internals/util";

module.exports = async (client: Client, ban: GuildBan) => {
  client.logger.debug(`${ban.user.tag} was banned from ${ban.guild.name}`);

  const logChannel = await getServerLogChannel(client, ban.guild.id);
  if (!logChannel) return; // guild hasn't set up their log channel

  console.log("unban", ban);

  const msgEmbed = new EmbedBuilder()
    .setTitle("Member Unbanned")
    .setDescription(
      `**${ban.user.tag} (${ban.user.id})** was unbanned from the server.`
    )
    .setColor(0x175507)
    .setTimestamp(new Date())
    .setThumbnail(
      ban.user.displayAvatarURL({
        extension: "png",
        size: 128,
      })
    );

  if (ban.reason) {
    msgEmbed.addFields({ name: "Reason", value: ban.reason });
  }

  logChannel.send({ content: "\t", embeds: [msgEmbed] });
};
