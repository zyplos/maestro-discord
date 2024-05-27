import type { Client } from "discord.js";

module.exports = (client: Client, warning: String) => {
  client.logger.warn("Client emitted a warning:" + warning);
};
