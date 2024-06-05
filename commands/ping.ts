import {
  SlashCommand,
  type SlashCreator,
  type CommandContext,
} from "slash-create";

export default class PingCommand extends SlashCommand {
  constructor(creator: SlashCreator) {
    super(creator, {
      name: "ping",
      description: "Check if I'm paying attention.",
      dmPermission: false,
    });
  }

  async debugRun(ctx: CommandContext) {
    return { content: "nope sorry", ephemeral: true };
  }

  async run(ctx: CommandContext) {
    if (ctx.user.id === process.env.OWNER_ID) {
      return this.debugRun(ctx);
    }

    return {
      ephemeral: true,
      content: "\t",
      embeds: [
        {
          description: "...",
          color: 0x58d858,
          footer: {
            text: `${Math.round(this.client.ws.ping)}ms`,
          },
        },
      ],
    };
  }
}
