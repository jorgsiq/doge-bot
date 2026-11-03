import {
  ActivityType,
  EmbedBuilder,
  InteractionContextType,
  MessageFlags,
  PermissionFlagsBits,
  SlashCommandBuilder,
} from "discord.js";
import config from "../config.js";
import { setStatus } from "../lib/presence.js";
import { postUpdate } from "../lib/updates.js";

export const category = "Admin";

const activityTypes = {
  playing: { type: ActivityType.Playing, label: "Jogando" },
  watching: { type: ActivityType.Watching, label: "Assistindo" },
  listening: { type: ActivityType.Listening, label: "Ouvindo" },
  competing: { type: ActivityType.Competing, label: "Competindo em" },
  streaming: { type: ActivityType.Streaming, label: "Transmitindo" },
  custom: { type: ActivityType.Custom, label: "" },
};

export const data = new SlashCommandBuilder()
  .setName("status")
  .setDescription("Modifica o status do bot em todos os servidores")
  .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
  .setContexts(InteractionContextType.Guild)
  .addStringOption((option) =>
    option
      .setName("tipo")
      .setDescription("Tipo de atividade")
      .setRequired(true)
      .addChoices(
        { name: "Jogando", value: "playing" },
        { name: "Assistindo", value: "watching" },
        { name: "Ouvindo", value: "listening" },
        { name: "Competindo", value: "competing" },
        { name: "Transmitindo", value: "streaming" },
        { name: "Personalizado", value: "custom" }
      )
  )
  .addStringOption((option) =>
    option
      .setName("texto")
      .setDescription("Texto exibido no status")
      .setRequired(true)
      .setMaxLength(128)
  )
  .addStringOption((option) =>
    option
      .setName("url")
      .setDescription(
        'Link da transmissão (Twitch ou YouTube), só para "Transmitindo"'
      )
  );

// the status is the same in every server, so only whoever owns the bot (or its developer team) may change it
async function isBotOwner(interaction) {
  const { owner } = await interaction.client.application.fetch();
  return owner?.members
    ? owner.members.has(interaction.user.id)
    : owner?.id === interaction.user.id;
}

export async function execute(interaction) {
  if (!(await isBotOwner(interaction))) {
    return interaction.reply({
      content:
        "Opa! só o dono do bot pode mudar o status, porque ele aparece em todos os servidores..",
      flags: MessageFlags.Ephemeral,
    });
  }

  const activity = interaction.options.getString("tipo", true);
  const { type, label } = activityTypes[activity];
  const name = interaction.options.getString("texto", true);
  const url = interaction.options.getString("url") ?? undefined;

  await setStatus(interaction.client, { name, type, url });

  const status = `**${`${label} ${name}`.trim()}**${url ? `\n${url}` : ""}`;
  postUpdate(
    interaction.guild,
    new EmbedBuilder()
      .setTitle("Novo Status")
      .setColor(config.colors.doge)
      .setDescription(status)
      .setImage(config.images.status[activity])
      .setTimestamp()
  );

  await interaction.reply({
    content: `Status modificado para ${status}`,
    flags: MessageFlags.Ephemeral,
  });
}
