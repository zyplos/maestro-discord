import {
  type Client,
  type GuildMember,
  EmbedBuilder,
  type Guild,
  type TextChannel,
} from "discord.js";
import LoggedEvent from "../internals/LoggedEvent";

export default class GuildMemberAddHandler extends LoggedEvent<"guildMemberAdd"> {
  constructor(client: Client) {
    super(client);
    this.eventName = "guildMemberAdd";
  }

  grabGuild(member: GuildMember): Guild | null {
    return member.guild;
  }

  run(logChannel: TextChannel, member: GuildMember) {
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
  }
}
