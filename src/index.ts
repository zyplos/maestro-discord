import { ActivityType, Client, GatewayDispatchEvents, GatewayIntentBits, Partials } from "discord.js";
import { GatewayServer, SlashCreator, Util } from "slash-create";
import { initializeApp, cert } from "firebase-admin/app";
import { join, extname, basename } from "path";
import CatLoggr from "cat-loggr/ts";

// declare our process.env stuff for Typescript to know about
import "dotenv/config";
declare global {
  namespace NodeJS {
    interface ProcessEnv {
      DISCORD_APP_ID: string;
      DISCORD_PUBLIC_KEY: string;
      DISCORD_BOT_TOKEN: string;
      DISCORD_BOT_ID: string;

      OWNER_ID: string;
      DEV_GUILD_ID: string;
      DEV_CHANNEL_ID: string;

      FIREBASE_PROJECT_ID: string;
      FIREBASE_DATABASE_URL: string;
      FIREBASE_CLIENT_EMAIL: string;
      FIREBASE_PRIVATE_KEY: string;
    }
  }
}

// Initialize Firebase
initializeApp({
  credential: cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
  }),
  // databaseURL: process.env.FIREBASE_DATABASE_URL,
});

// Create our discord.js client
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildModeration,
    GatewayIntentBits.GuildEmojisAndStickers,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMessageReactions,
    GatewayIntentBits.MessageContent,
  ],
  partials: [Partials.Message, Partials.Channel, Partials.Reaction, Partials.User],
  presence: {
    activities: [{ name: `MM8BDM`, type: ActivityType.Competing }],
    status: "online",
  },
});

// Create our logger
const logger = new CatLoggr().setLevel(process.env.NODE_ENV === "production" ? "info" : "debug");
declare module "discord.js" {
  interface Client {
    logger: CatLoggr;
  }
}
client.logger = logger;

// Load events for the discord.js client from the ./events folder
// Files from the ./events folder should be named with the event name discord.js looks for (https://discord.js.org/#/docs/discord.js/stable/class/Client)
// For example, if you want a function to run on client event "guildMemberAdd", you should have a ./events/guildMemberAdd.js file

// get all files from a directory and its subdirectories
// filter out stuff that isn't js files (typescript puts other stuff in the directory)
const filePaths = Util.getFiles(join(__dirname, "events")).filter((file) => [".js", ".cjs"].includes(extname(file)));
filePaths.forEach((filePath) => {
  logger.debug(`Loading event file: ${basename(filePath)}`);
  const eventName = basename(filePath).split(".")[0];
  const event = require(filePath);
  client.on(eventName, event.bind(null, client));
});

// Create a SlashCreator instance, the main thing handling our slash commands
const creator = new SlashCreator({
  applicationID: process.env.DISCORD_APP_ID,
  publicKey: process.env.DISCORD_PUBLIC_KEY,
  token: process.env.DISCORD_BOT_TOKEN,
  client,
});

// SlashCreator has its own events not tied to the discord.js client
creator.on("debug", (message) => logger.log(message));
creator.on("warn", (message) => logger.warn(message));
creator.on("error", (error) => logger.error(error));
creator.on("synced", () => logger.info("Commands synced!"));
creator.on("commandRun", (command, _, ctx) =>
  logger.info(`${ctx.user.username}#${ctx.user.discriminator} (${ctx.user.id}) ran command ${command.commandName}`)
);
creator.on("commandRegister", (command) => logger.info(`Registered command ${command.commandName}`));
creator.on("commandError", (command, error) => logger.error(`Command ${command.commandName}:`, error));

// Let SlashCreator know we're using a Discord bot instead of a web server for our slash commands
// Register our commands
// Then sync our commands with Discord
creator
  .withServer(new GatewayServer((handler) => client.ws.on(GatewayDispatchEvents.InteractionCreate, handler)))
  .registerCommandsIn(join(__dirname, "commands"))
  .syncCommands();

// Start the client
client.login(process.env.DISCORD_BOT_TOKEN);
