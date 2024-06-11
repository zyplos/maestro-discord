import {
  AutoModerationActionType,
  AutoModerationRuleEventType,
  AutoModerationRuleTriggerType,
  DiscordAPIError,
  PermissionFlagsBits,
  type Client,
} from "discord.js";
import {
  SlashCommand,
  type SlashCreator,
  type CommandContext,
  InteractionContextType,
  CommandOptionType,
  ComponentType,
  TextInputStyle,
  ButtonStyle,
} from "slash-create";
import { getTextChannel } from "../internals/util";
import badWords from "../internals/badWords.json";

export default class ConfigCommand extends SlashCommand {
  constructor(creator: SlashCreator) {
    super(creator, {
      name: "config",
      description: "Check if I'm paying attention.",
      contexts: [InteractionContextType.GUILD],
      requiredPermissions: ["MANAGE_GUILD"],
      guildIDs: [process.env.DEV_GUILD_ID, "426394718172086273"],
      options: [
        {
          type: CommandOptionType.SUB_COMMAND,
          name: "set-logchannel",
          description: "Set the channel where server events will be sent",
          options: [
            {
              type: CommandOptionType.CHANNEL,
              name: "channel",
              description: "A text channel",
              required: true,
            },
          ],
        },
        {
          type: CommandOptionType.SUB_COMMAND,
          name: "add-moddefaults",
          description:
            "This will add Maestro's classic moderation rules back as an AutoMod rule.",
        },
      ],
    });
  }

  async setLogChannel(ctx: CommandContext, guildId: string) {
    const client = this.client as Client;
    const clientUser = client.user;

    if (!clientUser) {
      return {
        content: "Sorry, not ready to take commands yet. Try again later.",
        ephemeral: true,
      };
    }

    const channelId: string = ctx.options["set-logchannel"].channel;

    try {
      const channel = await getTextChannel(this.client, channelId);

      const permissionsField = channel.permissionsFor(clientUser);

      if (!permissionsField) {
        return {
          content: `I couldn't check if I have permission to send messages in <#${channel.id}>. Please try again later.`,
          ephemeral: true,
        };
      }

      // check if bot has "Send Messages" permission in the channel
      if (
        !permissionsField.has(
          [PermissionFlagsBits.SendMessages, PermissionFlagsBits.ViewChannel],
          true
        )
      ) {
        return {
          content: `I don't have permission to see and send messages in <#${channel.id}>. Please make sure I have the **View Channel** and **Send Messages** permission in that channel.`,
          ephemeral: true,
        };
      }

      client.db.updateServer(guildId, channel.id);

      return {
        content: `Server events will now be sent to <#${channel.id}>.`,
        ephemeral: true,
      };
    } catch (error) {
      return {
        content: `Sorry, I couldn't update which channel to send server events to. ${
          (error as Error).message
        }`,
        ephemeral: true,
      };
    }
  }

  async addAutoModDefaults(ctx: CommandContext, guildId: string) {
    await ctx.defer();
    const client = this.client as Client;

    try {
      const guild = await client.guilds.fetch(guildId);

      const automod = guild.autoModerationRules;

      await automod.fetch();

      automod.cache.each((rule) => {
        client.logger.debug(rule.guild.id);
        client.logger.debug(rule.name);
        client.logger.debug(rule.enabled);
        client.logger.debug(rule.actions);
        client.logger.debug(rule.enabled);
        client.logger.debug(rule.eventType);
      });

      await automod.create({
        name: "Maestro Default Ruleset",
        eventType: AutoModerationRuleEventType.MessageSend,
        triggerType: AutoModerationRuleTriggerType.Keyword,
        actions: [
          {
            type: AutoModerationActionType.SendAlertMessage,
            metadata: {
              durationSeconds: null,
              channel: "613857379276029991",
              customMessage: null,
            },
          },
        ],
        triggerMetadata: {
          keywordFilter: badWords,
        },
      });

      return {
        content:
          "Maestro's Default Ruleset has been added to the AutoMod rules. You can edit it to your liking in **Server Settings** > **AutoMod**.",
        ephemeral: true,
      };
    } catch (error) {
      if (error instanceof DiscordAPIError) {
        if (error.code === 50013) {
          return {
            content:
              "I don't have permission to manage AutoMod rules. Please make sure I have the **Manage Server** permission if you'd like to use this command.",
            ephemeral: true,
          };
        }

        if (error.code === 50035) {
          return {
            content:
              "Your server's AutoMod already has the maximum amount of **Block Custom Words** rules. Please remove one before adding Maestro's Default Ruleset.",
            ephemeral: true,
          };
        }
      }

      client.logger.error(
        error,
        `Unexpected error while trying to add AutoMod rules in ${guildId}`
      );
      return {
        content:
          "Sorry! An unexpected error occurred while trying to create my AutoMod rules.",
        ephemeral: true,
      };
    }
  }

  async run(ctx: CommandContext) {
    const guildId = ctx.guildID;

    if (!guildId) {
      return {
        content: "Sorry, I couldn't grab your server's ID. Try again later.",
        ephemeral: true,
      };
    }

    if (ctx.subcommands[0] === "set-logchannel") {
      return this.setLogChannel(ctx, guildId);
    }

    if (ctx.subcommands[0] === "add-moddefaults") {
      return this.addAutoModDefaults(ctx, guildId);
    }

    return {
      ephemeral: true,
      content:
        "Please provide a valid subcommand to run (set-logchannel, add-moddefaults).",
    };
  }
}
