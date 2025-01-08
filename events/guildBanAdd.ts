import {
  type Client,
  EmbedBuilder,
  type GuildBan,
  type TextChannel,
} from "discord.js";
import LoggedEvent from "../internals/LoggedEvent";

export default class GuildBanAddHandler extends LoggedEvent<"guildBanAdd"> {
  constructor(client: Client) {
    super(client);
    this.eventName = "guildBanAdd";
  }

  grabGuild(ban: GuildBan) {
    return ban.guild;
  }

  run(logChannel: TextChannel, ban: GuildBan) {
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
  }
}
