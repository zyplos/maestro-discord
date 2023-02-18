import type { Client } from "discord.js";

module.exports = async (_client: Client) => {
  _client.logger.info(`${_client.user?.tag} Logged in! `);
};
