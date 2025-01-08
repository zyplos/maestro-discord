import {
  type Client,
  EmbedBuilder,
  type Guild,
  type GuildBan,
  type TextChannel,
} from "discord.js";
import LoggedEvent from "../internals/LoggedEvent";

export default class GuildBanRemoveHandler extends LoggedEvent<"guildBanRemove"> {
  constructor(client: Client) {
    super(client);
    this.eventName = "guildBanRemove";
  }

  grabGuild(ban: GuildBan): Guild | null {
    return ban.guild;
  }
  run(logChannel: TextChannel, ban: GuildBan) {
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
  }
}
