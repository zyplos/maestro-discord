import type { Client, Interaction } from "discord.js";

module.exports = (client: Client, interaction: Interaction) => {
  client.logger.debug(`Caught an interaction: ${interaction.id} (t:${interaction.type}) from ${interaction.user.tag}`);
};
