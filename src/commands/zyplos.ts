import { SlashCommand, SlashCreator, CommandContext } from "slash-create";

export default class ZyplosCommand extends SlashCommand {
  constructor(creator: SlashCreator) {
    super(creator, {
      name: "zyplos",
      description: "Flips a coin.",
      dmPermission: false,
      guildIDs: [process.env.DEV_GUILD_ID],
    });
  }

  async run(_ctx: CommandContext) {
    if (_ctx.user.id !== process.env.OWNER_ID) return { content: "nope sorry", ephemeral: true };

    // const guild = await this.client.guilds.fetch(process.env.DEV_GUILD_ID);
    // const member = await guild.members.fetch(process.env.OWNER_ID);

    // this.client.emit("guildMemberAdd", member);

    // return { content: Math.random() > 0.5 ? "heads" : "tails" };
    return {
      content:
        "```ansi\n\u001b[0;40m\u001b[1;32mThat's some cool formatted text right?\u001b[0m or \u001b[1;40;32mThat's some cool formatted text right?\u001b[0m\n```",
      // embeds: [msgEmbed,msgEmbed1,msgEmbed2,msgEmbed3,msgEmbed4],
    };
  }
}
