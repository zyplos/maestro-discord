import { Client, EmbedBuilder, GuildBan } from "discord.js";
import { getGuildLogChannel } from "../internals/util";

module.exports = async (client: Client, ban: GuildBan) => {
  client.logger.debug(`${ban.user.tag} was banned from ${ban.guild.name}`);

  const logChannel = await getGuildLogChannel(client, ban.guild.id);
  if (!logChannel) return; // guild hasn't set up their log channel

  console.log("ban", ban);

  const msgEmbed = new EmbedBuilder()
    .setTitle("Member Banned")
    .setDescription(
      `**${ban.user.tag} (${ban.user.id})** was banned from the server.`
    )
    .setColor(0x550707)
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
