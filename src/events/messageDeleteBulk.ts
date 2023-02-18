import type { Client, Collection, Message, Snowflake } from "discord.js";
const messageDelete = require("./messageDelete");

module.exports = async (_client: Client, bulkMessages: Collection<Snowflake, Message>) => {
  // console.log("messageDeleteBulk", bulkMessages);
  // console.log("====");

  bulkMessages.forEach(async (deletedMessage) => {
    // console.log(deletedMessage);
    await messageDelete(_client, deletedMessage);
  });
};
