import type { Client } from "discord.js";
import MaestroEvent from "@/internals/MaestroEvent";

export default class ErrorHandler extends MaestroEvent<"error"> {
  constructor(client: Client) {
    super(client);
    this.eventName = "error";
  }

  async run(error: Error) {
    this.client.logger.error(error, "Client caught an unexpected error");
  }
}
