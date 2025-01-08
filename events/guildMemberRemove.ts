import {
  type Client,
  type GuildMember,
  type PartialGuildMember,
  EmbedBuilder,
  type TextChannel,
} from "discord.js";
import LoggedEvent from "../internals/LoggedEvent";

export default class GuildMemberRemoveHandler extends LoggedEvent<"guildMemberRemove"> {
  constructor(client: Client) {
    super(client);
    this.eventName = "guildMemberRemove";
  }

  grabGuild(member: GuildMember | PartialGuildMember) {
    return member.guild;
  }

  run(logChannel: TextChannel, member: GuildMember) {
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
  }
}
