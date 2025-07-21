import {
  ActivityType,
  Client,
  GatewayDispatchEvents,
  GatewayIntentBits,
  Partials,
} from "discord.js";
import { GatewayServer, SlashCreator } from "slash-create";
import { join, extname } from "node:path";
import { readdir } from "node:fs/promises";
import pino, { type Logger } from "pino";
import DatabaseManager from "./internals/database";
import LoggedEvent from "./internals/LoggedEvent";
import MaestroEvent from "./internals/MaestroEvent";

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
    GatewayIntentBits.GuildExpressions,
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
    Partials.GuildMember,
  ],
  presence: {
    activities: [{ name: "MM8BDM", type: ActivityType.Competing }],
    status: "online",
  },
});

// Create our logger
// https://stackoverflow.com/a/75815609
const transport = pino.transport({
  targets: [
    {
      level: "debug",
      target: "pino/file",
      options: {
        destination: "./output.log",
      },
    },
    {
      level: "debug",
      target: "pino-pretty",
      options: {},
    },
  ],
});
const logger = pino(
  { level: process.env.NODE_ENV === "production" ? "info" : "debug" },
  transport
);
declare module "discord.js" {
  interface Client {
    logger: Logger;
  }
}
client.logger = logger;

// Create DatabaseManager instance
declare module "discord.js" {
  interface Client {
    db: DatabaseManager;
  }
}
client.db = new DatabaseManager();

declare module "discord.js" {
  interface Client {
    maestroEvents: Map<
      string,
      MaestroEvent<keyof ClientEvents> | LoggedEvent<keyof ClientEvents>
    >;
  }
}
client.maestroEvents = new Map();

// Load events for the discord.js client from the ./events folder
// Files from the ./events folder can be named whatever you'd like,
// BUT they must default export a class that extends either LoggedEvent or MaestroEvent
// See ./events/channelDelete.ts for an example of a LoggedEvent and ./events/ready.ts for an example of a MaestroEvent

// get all files from a directory and its subdirectories
// filter out stuff that isn't code
const eventsDir = join(__dirname, "events");
const filePaths = (
  await readdir(join(__dirname, "events"), { recursive: true })
).filter((filePath) => [".js", ".cjs", ".ts"].includes(extname(filePath)));

for (const filePath of filePaths) {
  const fullPath = join(eventsDir, filePath);
  client.logger.info(`Loading event file: ${fullPath}`);

  const importedModule = await import(fullPath);
  // es6 or cjs module
  const EventClass = importedModule.default || importedModule;
  const eventInstance = new EventClass(client);
  const eventName = eventInstance.eventName;
  client.logger.info(`Loaded event: ${eventName} | mapped to "${filePath}"`);

  if (eventInstance instanceof LoggedEvent) {
    client.on(eventName, eventInstance.preRun.bind(eventInstance));
    client.maestroEvents.set(filePath, eventInstance);
  } else if (eventInstance instanceof MaestroEvent) {
    client.on(eventName, eventInstance.run.bind(eventInstance));
    client.maestroEvents.set(filePath, eventInstance);
  } else {
    throw new Error(
      `File ${eventName} does not extend LoggedEvent or MaestroEvent`
    );
  }
}

// Create a SlashCreator instance, the main thing handling our slash commands
const creator = new SlashCreator({
  applicationID: process.env.DISCORD_APP_ID,
  publicKey: process.env.DISCORD_PUBLIC_KEY,
  token: process.env.DISCORD_BOT_TOKEN,
  client,
});

// SlashCreator has its own events not tied to the discord.js client
creator.on("debug", (message) => logger.info(message));
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
  logger.error(error, `Error running command ${command.commandName}`)
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
// add to global for debugging
declare global {
  var clientRef: Client;
}
global.clientRef = client;

// on process shutdown, close the database connection
process.on("SIGINT", () => {
  client.logger.info("Shutting down...");
  client.destroy();
  client.db.close();
  process.exit(0);
});
