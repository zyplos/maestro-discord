import type { Client } from "discord.js";

export default function (client: Client) {
  client.logger.info(`${client.user?.tag} logged in!`);
}
