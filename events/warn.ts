import type { Client } from "discord.js";

export default function (client: Client, warning: string) {
  client.logger.warn(warning, "Client emitted a warning");
}
