import { SlashCreator, GatewayServer } from "slash-create";
import { Client } from "discord.js";
import { join } from "path";
import CatLoggr from "cat-loggr/ts";

import "dotenv/config";
declare global {
  namespace NodeJS {
    interface ProcessEnv {
      DISCORD_APP_ID: string;
      DISCORD_PUBLIC_KEY: string;
      DISCORD_BOT_TOKEN: string;

      OWNER_ID: string;
      DEV_GUILD_ID: string;

      FIREBASE_PROJECT_ID: string;
      FIREBASE_DATABASE_URL: string;
      FIREBASE_CLIENT_EMAIL: string;
      FIREBASE_PRIVATE_KEY: string;
    }
  }
}

const logger = new CatLoggr().setLevel(process.env.NODE_ENV === "production" ? "info" : "debug");
const client = new Client({
  intents: [
    "GUILDS",
    "GUILD_MEMBERS",
    "GUILD_BANS",
    "GUILD_EMOJIS_AND_STICKERS",
    "GUILD_VOICE_STATES",
    "GUILD_MESSAGES",
    "GUILD_MESSAGE_REACTIONS",
  ],
  presence: {
    activities: [{ name: `MM8BDM`, type: "COMPETING" }],
    status: "online",
  },
});

const creator = new SlashCreator({
  applicationID: process.env.DISCORD_APP_ID,
  publicKey: process.env.DISCORD_PUBLIC_KEY,
  token: process.env.DISCORD_BOT_TOKEN,
  client,
});

creator.on("debug", (message) => logger.log(message));
creator.on("warn", (message) => logger.warn(message));
creator.on("error", (error) => logger.error(error));
creator.on("synced", () => logger.info("Commands synced!"));
creator.on("commandRun", (command, _, ctx) =>
  logger.info(`${ctx.user.username}#${ctx.user.discriminator} (${ctx.user.id}) ran command ${command.commandName}`)
);
creator.on("commandRegister", (command) => logger.info(`Registered command ${command.commandName}`));
creator.on("commandError", (command, error) => logger.error(`Command ${command.commandName}:`, error));

client.on("ready", () => {
  console.log(`${client.user?.tag} Logged in! `);
});

creator
  .withServer(new GatewayServer((handler) => client.ws.on("INTERACTION_CREATE", handler)))
  .registerCommandsIn(join(__dirname, "commands"))
  .syncCommands();

client.login(process.env.DISCORD_BOT_TOKEN);

client.on("interactionCreate", async (interaction) => {
  logger.info("GOT AN INTERACTION");
  console.log(interaction);
});

console.log(`stuff loaded`);
