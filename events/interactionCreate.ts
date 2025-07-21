import type { Client, Interaction } from "discord.js";
import MaestroEvent from "@/internals/MaestroEvent";

export default class InteractionCreateHandler extends MaestroEvent<"interactionCreate"> {
  constructor(client: Client) {
    super(client);
    this.eventName = "interactionCreate";
  }

  run(interaction: Interaction) {
    this.client.logger.debug(
      `Caught an interaction: ${interaction.id} (t:${interaction.type}) from ${interaction.user.tag}`
    );
  }
}
