import type { Client } from "discord.js";
import MaestroEvent from "../internals/MaestroEvent";

export default class WarnHandler extends MaestroEvent<"warn"> {
  constructor(client: Client) {
    super(client);
    this.eventName = "warn";
  }

  async run(warning: string) {
    this.client.logger.warn(warning, "Client emitted a warning");
  }
}
