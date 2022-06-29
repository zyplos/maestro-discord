import type { Client } from "discord.js";

module.exports = (client: Client) => {
  client.logger.info(`${client.user?.tag} Logged in! `);
};
