import {
  ActivityType,
  Client,
  GatewayDispatchEvents,
  GatewayIntentBits,
  Partials,
} from "discord.js";
import { GatewayServer, SlashCreator } from "slash-create";
import { join, extname, basename } from "node:path";
import { readdir } from "node:fs/promises";
import CatLoggr from "cat-loggr/ts";

// declare our process.env stuff for Typescript to know about
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
    }
  }
}

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
  partials: [
    Partials.Message,
    Partials.Channel,
    Partials.Reaction,
    Partials.User,
  ],
  presence: {
    activities: [{ name: "MM8BDM", type: ActivityType.Competing }],
    status: "online",
  },
});

// Create our logger
const logger = new CatLoggr().setLevel(
  process.env.NODE_ENV === "production" ? "info" : "debug"
);
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
// filter out stuff that isn't code
const filePaths = (
  await readdir(join(__dirname, "events"), { recursive: true })
).filter((filePath) => [".js", ".cjs", ".ts"].includes(extname(filePath)));

for (const filePath of filePaths) {
  const fileExtention = extname(filePath);
  const fileName = basename(filePath);
  const eventName = basename(fileName, fileExtention);

  logger.debug(`Loading event file: ${fileName}`);
  const event = require(join(__dirname, "events", filePath));
  client.on(eventName, event.bind(null, client));
}

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
  logger.info(
    `${ctx.user.username}#${ctx.user.discriminator} (${ctx.user.id}) ran command ${command.commandName}`
  )
);
creator.on("commandRegister", (command) =>
  logger.info(`Registered command ${command.commandName}`)
);
creator.on("commandError", (command, error) =>
  logger.error(`Command ${command.commandName}:`, error)
);

// Let SlashCreator know we're using a Discord bot instead of a web server for our slash commands
// Register our commands
// Then sync our commands with Discord
creator.withServer(
  new GatewayServer((handler) =>
    client.ws.on(GatewayDispatchEvents.InteractionCreate, handler)
  )
);

// allow reading .ts files since we're using bun
await creator.registerCommandsIn(join(__dirname, "commands"), [".ts"]);
await creator.syncCommands();

// Start the client
client.login(process.env.DISCORD_BOT_TOKEN);
