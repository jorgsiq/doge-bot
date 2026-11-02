import {
  InteractionContextType,
  LabelBuilder,
  MessageFlags,
  ModalBuilder,
  SlashCommandBuilder,
  TextInputBuilder,
  TextInputStyle,
  UserSelectMenuBuilder,
} from "discord.js";
import {
  UNCLAIMED_ROOM_MINUTES,
  getRoom,
  invite,
  openRoom,
  rename,
  roomPanel,
  setHidden,
  transferOwnership,
} from "../lib/tempVoice.js";

export const category = "Voice Rooms";
export const feature = "rooms";

export const data = new SlashCommandBuilder()
  .setName("room")
  .setDescription(
    "Cria uma sala de voz anônima e temporária / configura a sala atual"
  )
  .setContexts(InteractionContextType.Guild)
  .addStringOption((option) =>
    option
      .setName("nome")
      .setDescription("O nome da sala nova")
      .setMaxLength(50)
  );

const ephemeral = (content) => ({ content, flags: MessageFlags.Ephemeral });

export async function execute(interaction) {
  // inside a room, /room brings its panel back
  const room = getRoom(interaction.member.voice.channelId);
  if (room)
    return interaction.reply({
      ...roomPanel(room.ownerId),
      flags: MessageFlags.Ephemeral,
    });

  // creating a channel can be held back by Discord's rate limit, past the 3 seconds an interaction has to be answered
  await interaction.deferReply({ flags: MessageFlags.Ephemeral });
  const { channel, created, moved } = await openRoom(
    interaction.member,
    interaction.options.getString("nome")?.trim()
  );

  if (moved) {
    await interaction.editReply(
      created
        ? `👽 Criei sua sala ${channel} e te levei para lá!`
        : `👽 Te levei de volta para a sua sala ${channel}!`
    );
  } else if (created) {
    await interaction.editReply(
      `👽 Criei sua sala: ${channel}. Entre nela em até ${UNCLAIMED_ROOM_MINUTES} minutos, senão ela é apagada!`
    );
  } else {
    await interaction.editReply(`👽 Você já tem uma sala: ${channel}`);
  }
}

// Acknowledges right away (Discord can hold a channel edit back for minutes), then runs the change
async function respond(interaction, action, flags = MessageFlags.Ephemeral) {
  await interaction.deferReply({ flags });
  try {
    await interaction.editReply(await action());
  } catch (error) {
    console.error("Failed to update a temporary room:", error);
    await interaction.editReply("Desculpe! Ocorreu um erro..");
  }
}

// Shows a modal, waits for it and answers it with the result of `action`; nothing happens if the member closes it
async function askModal(interaction, title, label, action) {
  const modalId = `room-modal:${interaction.id}`;
  await interaction.showModal(
    new ModalBuilder()
      .setCustomId(modalId)
      .setTitle(title)
      .addLabelComponents(label)
  );
  const submitted = await interaction
    .awaitModalSubmit({
      filter: (i) => i.customId === modalId,
      time: 5 * 60_000,
    })
    .catch(() => null);
  if (submitted) await respond(submitted, () => action(submitted.fields));
}

// The buttons control the room the member is in, so the panel works wherever it was shown
export async function handleComponent(interaction, action) {
  const channel = interaction.member.voice.channel;
  const room = getRoom(channel?.id);
  if (!room)
    return interaction.reply(
      ephemeral("Opa! você precisa estar em uma sala temporária..")
    );

  if (action === "claim") {
    if (room.ownerId === interaction.member.id)
      return interaction.reply(ephemeral("Você já é o dono desta sala!"));
    if (channel.members.has(room.ownerId))
      return interaction.reply(ephemeral("Opa! o dono ainda está na sala.."));
    return respond(
      interaction,
      async () => {
        await transferOwnership(channel, interaction.member);
        return `👑 ${interaction.member} agora é o dono desta sala!`;
      },
      // public, so everyone in the room sees the new owner
      undefined
    );
  }

  if (room.ownerId !== interaction.member.id) {
    return interaction.reply(
      ephemeral("Opa! só o dono da sala pode fazer isso..")
    );
  }

  switch (action) {
    case "lock":
    case "unlock":
      return respond(interaction, async () => {
        const hidden = action === "lock";
        await setHidden(channel, hidden);
        return hidden
          ? "🔒 Sala fechada! Agora só quem está nela ou foi convidado consegue ver e entrar."
          : "🔓 Sala aberta! Agora todo mundo pode ver e entrar.";
      });

    case "rename":
      return askModal(
        interaction,
        "Renomear sala",
        new LabelBuilder()
          .setLabel("Nome")
          .setTextInputComponent(
            new TextInputBuilder()
              .setCustomId("name")
              .setStyle(TextInputStyle.Short)
              .setMaxLength(50)
              .setValue(channel.name)
          ),
        async (fields) => {
          const name = fields.getTextInputValue("name").trim();
          if (!name) return "Opa! o nome não pode ficar vazio..";
          const renamed = await rename(channel, name);
          return renamed
            ? "✏️ Sala renomeada!"
            : "Opa! o Discord só permite renomear uma sala 2 vezes a cada 10 minutos..";
        }
      );

    case "limit":
      return askModal(
        interaction,
        "Limite de pessoas",
        new LabelBuilder()
          .setLabel("Quantas pessoas (0 = sem limite)")
          .setTextInputComponent(
            new TextInputBuilder()
              .setCustomId("limit")
              .setStyle(TextInputStyle.Short)
              .setMaxLength(2)
              .setValue(String(channel.userLimit))
          ),
        async (fields) => {
          const limit = Number(fields.getTextInputValue("limit"));
          if (!Number.isInteger(limit) || limit < 0 || limit > 99)
            return "Opa! o limite deve ser um número de 0 a 99..";
          await channel.setUserLimit(limit);
          return limit
            ? `👥 Limite definido em ${limit} pessoas!`
            : "👥 Limite removido!";
        }
      );

    case "invite":
      return askModal(
        interaction,
        "Convidar para a sala",
        new LabelBuilder()
          .setLabel("Quem pode ver e entrar com a sala fechada")
          .setUserSelectMenuComponent(
            new UserSelectMenuBuilder().setCustomId("users").setMaxValues(10)
          ),
        async (fields) => {
          const users = fields.getSelectedUsers("users", true);
          await invite(channel, users.values());
          return `➕ Convidei ${users.map((user) => `${user}`).join(", ")}!`;
        }
      );
  }
}
