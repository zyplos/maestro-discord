import type { Client } from "discord.js";

module.exports = (client: Client, error: Error) => {
  client.logger.error("Client caught an error:");
  console.error(error);
};
