import type { Client } from "discord.js";

export default function (client: Client, error: Error) {
  client.logger.error(error, "Client caught an unexpected error");
}
