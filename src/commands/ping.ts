import { SlashCommand, SlashCreator, CommandContext } from "slash-create";

export default class PingCommand extends SlashCommand {
  constructor(creator: SlashCreator) {
    super(creator, {
      name: "ping",
      description: "Check if I'm paying attention.",
    });
  }

  async run(_ctx: CommandContext) {
    const derpspace = ["I'm online.", "Hm?", "Hello.", "Sentient and waiting.", "I'm here.", "*zzz..."];
    const derpindex = Math.floor(Math.random() * derpspace.length);

    return {
      ephemeral: true,
      content: "\t",
      embeds: [
        {
          description: derpspace[derpindex],
          color: 0x58d858,
          footer: {
            text: `${Math.round(this.client.ws.ping)}ms`,
          },
        },
      ],
    };
  }
}
