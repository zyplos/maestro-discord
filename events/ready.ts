import type { Client } from "discord.js";
import MaestroEvent from "../internals/MaestroEvent";

export default class ReadyHandler extends MaestroEvent<"ready"> {
  constructor(client: Client) {
    super(client);
    this.eventName = "ready";
  }

  async run() {
    this.client.logger.info(`${this.client.user?.tag} logged in!`);
  }
}
