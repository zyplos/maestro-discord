import type { Client } from "discord.js";

module.exports = async (client: Client) => {
  client.logger.info(`${client.user?.tag} logged in!`);
};
