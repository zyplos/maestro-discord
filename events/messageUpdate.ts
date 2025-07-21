import {
  ActionRowBuilder,
  AttachmentBuilder,
  ButtonBuilder,
  ButtonStyle,
  type Client,
  EmbedBuilder,
  escapeCodeBlock,
  escapeMarkdown,
  type Message,
  type Embed,
  type TextChannel,
  type OmitPartialGroupDMChannel,
  type PartialMessage,
} from "discord.js";
import { diff as objectDiff } from "deep-object-diff";
import { diffWords } from "diff";
import { isStringBlank, pluralize, truncateFileName } from "@/internals/util";
import LoggedEvent from "@/internals/LoggedEvent";

export default class MessageUpdateHandler extends LoggedEvent<"messageUpdate"> {
  constructor(client: Client) {
    super(client);
    this.eventName = "messageUpdate";
  }
  grabGuild(
    oldMessage: OmitPartialGroupDMChannel<Message<boolean> | PartialMessage>
  ) {
    return oldMessage.guild;
  }

  async run(
    logChannel: TextChannel,
    oldMessage: OmitPartialGroupDMChannel<Message<boolean> | PartialMessage>,
    newMessage: OmitPartialGroupDMChannel<Message<boolean>>
  ) {
    if (oldMessage.author?.id === process.env.DISCORD_BOT_ID) return; // stuff from our bot shouldn't be logged
    if (newMessage.author?.id === process.env.DISCORD_BOT_ID) return; // stuff from our bot shouldn't be logged
    if (!newMessage.inGuild()) return; // don't care about DM messages

    let textDiffReport = "";
    const files = [];

    //
    // =====
    // MESSAGE REPORT
    // =====
    //
    const didMessageChange = oldMessage.content !== newMessage.content;

    const isOldBlank = isStringBlank(oldMessage.content || "");
    const isNewBlank = isStringBlank(newMessage.content);
    if (oldMessage.content === newMessage.content) {
      textDiffReport = "(messages were the same)";
      textDiffReport += oldMessage.content
        ? `\`\`\`\n${escapeCodeBlock(oldMessage.content)}\n\`\`\``
        : "";
    } else if (isOldBlank || isNewBlank) {
      if (isOldBlank) {
        if (oldMessage.partial) {
          textDiffReport +=
            "(message was sent too long ago, I wasn't keeping track of it)";
        } else {
          textDiffReport += "(old message was blank)";
        }
      }
      textDiffReport += oldMessage.content
        ? `\`\`\`\n${escapeCodeBlock(oldMessage.content)}\n\`\`\``
        : "";
      textDiffReport += "\n\nNew message:\n";
      if (isNewBlank) textDiffReport += "(new message was blank)";
      textDiffReport += newMessage.content
        ? `\`\`\`\n${escapeCodeBlock(newMessage.content)}\n\`\`\``
        : "";
    } else {
      const oldText = escapeCodeBlock(oldMessage.content || "");
      const newText = escapeCodeBlock(newMessage.content || "");

      const diff = diffWords(oldText, newText);

      textDiffReport = "```ansi\n";

      for (const part of diff) {
        if (!part.added && !part.removed) {
          textDiffReport += part.value;
        }
        if (part.added) {
          textDiffReport += `🟩\u001b[1;32m${part.value}\u001b[0m🟩`;
        }
        if (part.removed) {
          textDiffReport += `🟥\u001b[1;31m${part.value}\u001b[0m🟥`;
        }
      }

      textDiffReport += "\n```";
    }

    // incase text diff report is too long we'll just add it as an attachment
    let textDiffReportFileAttachment = null;
    if (textDiffReport.length > 3900 && didMessageChange) {
      textDiffReport = `Old message:\n${oldMessage.content}\n\nNew message:\n${newMessage.content}`;
      textDiffReportFileAttachment = new AttachmentBuilder(
        Buffer.from(textDiffReport),
        { name: "files.txt" }
      );
      files.push(textDiffReportFileAttachment);
    }

    //
    // =====
    // ACTUAL MESSAGE EMBED
    // =====
    //
    const messageChannel = oldMessage.channel;
    const channelName =
      messageChannel.isTextBased() &&
      !messageChannel.isDMBased() &&
      messageChannel.name;
    const isThreadChannel = messageChannel.isThread();
    const channelNameFormatted = channelName
      ? `(${(isThreadChannel && "💬") || ""}#${channelName})`
      : "";
    const channelString = `${messageChannel} ${channelNameFormatted}`;

    const msgEmbed = new EmbedBuilder()
      .setTitle("Message Edited")
      .setDescription(
        `**${newMessage.author} (${newMessage.author.tag} ${
          newMessage.author.id
        })** edited a message in ${channelString}\n\n${
          textDiffReportFileAttachment
            ? "The message changes have been added to the top of this report because of their length."
            : textDiffReport
        }`
      )
      .setColor(0xffd300)
      .setTimestamp(new Date())
      .setThumbnail(
        newMessage.author.displayAvatarURL({
          extension: "png",
          size: 128,
        })
      );

    let embeds: (Embed | EmbedBuilder)[] = [msgEmbed];

    //
    // =====
    // ATTACHMENTS REPORT
    // =====
    //
    const attachmentsDiff = oldMessage.attachments.difference(
      newMessage.attachments
    );
    const attachmentCount = attachmentsDiff.size;
    const didAttachmentsChange = attachmentsDiff.size > 0;

    let attachmentReportFileAttachment = null;
    if (didAttachmentsChange) {
      let attachmentDiffReport = "";
      attachmentsDiff.forEach(
        ({ name, contentType, size, proxyURL, url }, _id) => {
          const fileName = truncateFileName(name);
          const fileType = contentType ? contentType : "(unknown type)";
          attachmentDiffReport += `_**${escapeMarkdown(
            fileName
          )}**_ - ${fileType} (${size}B) [(cdn link)](${url}) [(proxy link)](${proxyURL})\n`;
        }
      );
      if (attachmentDiffReport.length > 1024) {
        msgEmbed.addFields({
          name: pluralize(attachmentCount, "attachment"),
          value:
            "A list of attachment file names, types, and old links have been added above this report.",
        });
        attachmentReportFileAttachment = new AttachmentBuilder(
          Buffer.from(attachmentDiffReport),
          { name: "files.txt" }
        );
        files.push(attachmentReportFileAttachment);
      } else {
        msgEmbed.addFields({
          name: `Removed ${pluralize(attachmentCount, "attachment")}`,
          value: attachmentDiffReport,
        });
      }
    }

    //
    // =====
    // EMBEDS REPORT
    // =====
    //
    const embedDiff = objectDiff(oldMessage.embeds, newMessage.embeds);
    const didEmbedsChange = Object.keys(embedDiff).length > 0;
    const botTriggeredEmbedChange = didEmbedsChange && newMessage.author.bot;

    // ONLY LOG EMBEDS IF BOT
    // embeds from users (to my knowledge) only come from links
    // when a user posts a link, discord embeds it by updating the message
    // this gets spammy, so lets just ignore it
    if (botTriggeredEmbedChange) {
      embeds = [...[msgEmbed], ...oldMessage.embeds.slice(0, 8)];
      const embedCount = oldMessage.embeds.length;
      let embedText =
        embedCount > 8
          ? "Appending the first 8 embeds from the old message to the end of this report."
          : "The embeds from the old message will be appended to the end of this report.";

      // embeds were added
      if (
        newMessage.embeds.length > oldMessage.embeds.length &&
        oldMessage.embeds.length === 0
      ) {
        if (embedCount === 0)
          embedText =
            "The new message added embeds. Jump to the message to see them.";
      }

      msgEmbed.addFields({ name: "Embeds Changed", value: embedText });
    }

    //
    // =====
    // COMPONENTS CHANGED
    // discard report
    // =====
    //
    if (
      !didMessageChange &&
      !didAttachmentsChange &&
      !botTriggeredEmbedChange
    ) {
      // console.log("SEEMS ONLY COMPONENTS CHANGED");
      // ^^^ actually this will happen if the message has a thread and the thread gets deleted
      // this will fire with removed thread data
      // that isn't a property we care about logging so we can just ignore it
      return;
    }

    //
    // =====
    // ACTUALLY SEND THE REPORTS
    // =====
    //
    const componentsRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setLabel("Jump to Message")
        .setStyle(ButtonStyle.Link)
        .setURL(newMessage.url)
    );

    logChannel.send({
      content: "\t",
      embeds,
      components: [componentsRow],
      files,
    });
  }
}
