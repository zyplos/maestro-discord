import type { Client } from "discord.js";

export default function (client: Client, error: Error) {
  client.logger.error("Client caught an error:");
  console.error(error);
}
