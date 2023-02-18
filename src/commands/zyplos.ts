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

    const guild = await this.client.guilds.fetch(process.env.DEV_GUILD_ID);
    const member = await guild.members.fetch(process.env.OWNER_ID);

    this.client.emit("guildMemberAdd", member);

    return { content: Math.random() > 0.5 ? "heads" : "tails" };
  }
}
