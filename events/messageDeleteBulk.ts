import type { Client, Collection, Message, Snowflake } from "discord.js";
const messageDelete = require("./messageDelete");

export default async function (
  client: Client,
  bulkMessages: Collection<Snowflake, Message>
) {
  // console.log("messageDeleteBulk", bulkMessages);
  // console.log("====");

  for (const deletedMessage of bulkMessages) {
    // console.log(deletedMessage);
    await messageDelete(client, deletedMessage);
  }
}
