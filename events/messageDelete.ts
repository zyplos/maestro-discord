import {
  AttachmentBuilder,
  DiscordAPIError,
  EmbedBuilder,
  escapeMarkdown,
  GuildChannel,
  MessageType,
  type Client,
  type Message,
  type PartialMessage,
  type TextChannel,
} from "discord.js";
import LoggedEvent from "../internals/LoggedEvent";
import {
  makeChannelInfoString,
  isStringBlank,
  makeUserInfoString,
  truncateFileName,
  pluralize,
} from "../internals/util";

export default class MessageDeleteHandler extends LoggedEvent<"messageDelete"> {
  constructor(client: Client) {
    super(client);
    this.eventName = "messageDelete";
  }

  grabGuild(oldMessage: Message) {
    return oldMessage.guild;
  }

  async run(logChannel: TextChannel, messageDeleted: Message | PartialMessage) {
    if (messageDeleted.author?.id === process.env.DISCORD_BOT_ID) return; // stuff from our bot shouldn't be logged

    const messageChannel = messageDeleted.channel;
    if (!(messageChannel instanceof GuildChannel)) return;

    const channelString = makeChannelInfoString(messageChannel);

    // can't do much with partial messages, return
    if (messageDeleted.partial) {
      // console.log(messageDeleted);
      return;
    }

    let formattedText: string;
    if (isStringBlank(messageDeleted.content)) {
      formattedText = "(this message was empty)";
    } else {
      // const text = escapeCodeBlock(messageDeleted.content);

      // const textLengthFormat = text.length > 4000 ? text.slice(0, 4000) + "... (truncated)" : text;
      // formattedText = "```\n" + textLengthFormat + "\n```";
      // ^^^ no actual need to check the length since we're dedicating a field to the message content
      formattedText = messageDeleted.content;
    }

    const userString = makeUserInfoString(messageDeleted.author);

    let reportText = `A message from **${userString}** was deleted in ${channelString}\n`;

    // flags
    const messageFlags = messageDeleted.flags.serialize();
    if (messageFlags.Crossposted) {
      reportText +=
        "This message was published to servers following this channel.\n";
    }
    if (messageFlags.IsCrosspost) {
      reportText += "This message was sent from a followed channel.\n";
    }
    if (messageFlags.Urgent) {
      reportText += "This message was an official message from Discord.\n";
    }
    if (messageFlags.Loading) {
      reportText +=
        "This was an interaction from a bot that didn't finish responding.\n";
    }

    // activity
    if (messageDeleted.activity) {
      if (messageDeleted.activity?.partyId?.includes("spotify")) {
        reportText += "This message contained a Spotify listen along invite.\n";
      } else {
        reportText += "This message contained a game invite.\n";
      }
    }

    // applicationId
    if (messageDeleted.applicationId) {
      reportText += `This message was sent by an application (${messageDeleted.applicationId}).\n`;
    }

    // pinned
    if (messageDeleted.pinned) {
      reportText += "This was a pinned message.\n";
    }

    // stickers
    if (messageDeleted.stickers.size > 0) {
      reportText += "This message had stickers: ";
      const stickerUrls = messageDeleted.stickers.map(
        (sticker) => `[${sticker.name}](${sticker.url})`
      );
      reportText += `${stickerUrls.join(", ")}\n`;
    }

    // system
    if (messageDeleted.system) {
      reportText += "This message was a system notification.\n";
    }

    // type
    const messageType = messageDeleted.type;
    if (messageType) {
      switch (messageType) {
        case MessageType.ChannelPinnedMessage:
          reportText += "This was a pinned message system notification.";
          break;
        case MessageType.UserJoin:
          reportText += "This was a member join system notification.";
          break;
        case MessageType.GuildBoost:
          reportText += "This was a guild boost notification.";
          break;
        case MessageType.GuildBoostTier1:
          reportText += "This was a tier 1 guild boost notification.";
          break;
        case MessageType.GuildBoostTier2:
          reportText += "This was a tier 2 guild boost notification.";
          break;
        case MessageType.GuildBoostTier3:
          reportText += "This was a tier 3 guild boost notification.";
          break;
        case MessageType.ChannelFollowAdd:
          reportText += "This was a following channel notification.";
          break;
        case MessageType.ThreadCreated:
          reportText += "This was a thread created system notification.";
          break;
        case MessageType.ChatInputCommand:
          reportText += "This message is a bot's response to a chat command.";
          break;
        case MessageType.ContextMenuCommand:
          reportText +=
            "This message is a bot's response to a context menu command.";
          break;
        case MessageType.AutoModerationAction:
          reportText +=
            ":no_entry_sign: **This was an AutoMod notification that flagged this user's message.**";
          break;
        case MessageType.RoleSubscriptionPurchase:
          reportText +=
            "This message was a role subscription purchase notification.";
          break;
        case MessageType.StageStart:
          reportText += "This message was stage start system notification.";
          break;
        case MessageType.StageEnd:
          reportText += "This message was stage end system notification.";
          break;
        case MessageType.StageSpeaker:
          reportText += "This message was stage speaker system notification.";
          break;
        case MessageType.StageTopic:
          reportText += "This message was stage topic system notification.";
          break;
        case MessageType.Reply: {
          try {
            const referenceMessage = await messageDeleted.fetchReference();

            // not very helpful to just say it was a reply, so say nothing
            if (!referenceMessage) break;

            const referenceMessageId = referenceMessage.id;
            const authorText = `${makeUserInfoString(
              referenceMessage.author
            )}'s message (id: ${referenceMessageId})`;

            reportText += `This message was a reply to ${authorText}. [(jump to message)](${referenceMessage.url})\n`;
          } catch (ep) {
            reportText +=
              "This message was a reply to a message that got deleted.\n";
          }

          break;
        }
      }

      reportText += "\n";
    }

    const msgEmbed = new EmbedBuilder()
      .setTitle("Message Deleted")
      .setDescription(formattedText)
      .setColor(0xff3e3e)
      .setTimestamp(messageDeleted.createdTimestamp)
      .setFooter({
        text: `Message ID: ${messageDeleted.id} • Deleted message was originally sent`,
      })
      .setThumbnail(
        messageDeleted.author.displayAvatarURL({
          extension: "png",
          size: 128,
        })
      )
      .addFields({ name: "===== Message Report =====", value: reportText });

    // These are added as fields as they might break the 1024 character limit if it were all in just one field.

    // interaction (user commands)
    if (messageDeleted.interaction) {
      msgEmbed.addFields({
        name: "User Interaction",
        value: `This message responded to the following command:\n**${messageDeleted.interaction.commandName}**`,
      });
    }

    // hasThread
    if (messageDeleted.hasThread) {
      const thread = messageDeleted.thread;
      if (thread) {
        msgEmbed.addFields({
          name: "Thread",
          value: `This was the start of the ${thread} **(${thread.name} ${thread.id})** thread.`,
        });
      } else {
        msgEmbed.addFields({
          name: "Thread",
          value: "This was the start of a thread.",
        });
      }
    }

    // webhookId
    const isFromAWebhook = messageDeleted.webhookId;
    // this will fail if it was also an interaction, so check for that too
    if (isFromAWebhook && !messageDeleted.interaction) {
      try {
        const webhookReference = await messageDeleted.fetchWebhook();
        msgEmbed.addFields({
          name: "Webhook",
          value: `This message was sent by the **${escapeMarkdown(
            webhookReference.name
          )} (${isFromAWebhook})** webhook.`,
        });
      } catch (error) {
        if (error instanceof DiscordAPIError && error.code === 50013) {
          msgEmbed.addFields({
            name: "Webhook",
            value:
              'This message was sent from a webhook, but I don\'t have the **"Manage Webhooks"** permission to fetch its name.',
          });
        } else {
          this.client.logger.error(
            error,
            "messageDelete Error fetching webhook name"
          );
          msgEmbed.addFields({
            name: "Webhook",
            value:
              "This message was sent from a webhook, but there was an error fetching its name.",
          });
        }
      }
    }

    // attachments report
    const attachments = messageDeleted.attachments;
    const attachmentCount = attachments.size;
    let attachmentFile = null;
    if (attachmentCount > 0) {
      let attachmentText = "";
      attachments.forEach(({ name, contentType, size, proxyURL, url }, _id) => {
        const fileName = truncateFileName(name);
        const fileType = contentType ? contentType : "(unknown type)";
        attachmentText += `_**${fileName}**_ - ${fileType} (${size}B) [(cdn link)](${url}) [(proxy link)](${proxyURL})\n`;
      });
      if (attachmentText.length > 1024) {
        msgEmbed.addFields({
          name: pluralize(attachmentCount, "attachment"),
          value:
            "A list of attachment file names, types, and old links have been added above this report.",
        });

        attachmentFile = new AttachmentBuilder(Buffer.from(attachmentText), {
          name: "files.txt",
        });
      } else {
        msgEmbed.addFields({
          name: `Contained ${pluralize(attachmentCount, "attachment")}`,
          value: attachmentText,
        });
      }
    }

    // embed report
    const embedCount = messageDeleted.embeds.length;
    if (embedCount > 0) {
      const embedText =
        embedCount > 5
          ? "Appending the first 5 to the end of this report."
          : `${
              embedCount === 1 ? "It" : "They"
            } will be appended to the end of this report.`;

      msgEmbed.addFields({
        name: `Included ${pluralize(embedCount, "embed")}`,
        value: embedText,
      });
    }

    return logChannel.send({
      content: "\t",
      embeds: [...[msgEmbed], ...messageDeleted.embeds.slice(0, 5)],
      ...(attachmentFile && { files: [attachmentFile] }),
    });
  }
}
