import {
  EmbedBuilder,
  InteractionContextType,
  MessageFlags,
  SlashCommandBuilder,
  chatInputApplicationCommandMention,
} from "discord.js";
import config from "../config.js";
import { isEnabled } from "../lib/settings.js";

export const category = "Info";

const categoryOrder = ["Info", "Fun", "Music Player", "Voice Rooms", "Admin"];

export const data = new SlashCommandBuilder()
  .setName("help")
  .setDescription("Mostra a lista de comandos do bot")
  .setContexts(InteractionContextType.Guild);

export async function execute(interaction) {
  // registered (global) commands carry the ids needed for clickable mentions
  const registered = interaction.client.application.commands.cache;

  // only what this member can use here: features switched on in /setup, and staff commands for staff
  const available = interaction.client.commands.filter((command) => {
    if (command.feature && !isEnabled(interaction.guildId, command.feature))
      return false;
    const permission = command.data.default_member_permissions;
    return !permission || interaction.memberPermissions.has(BigInt(permission));
  });

  const fields = categoryOrder
    .map((category) => {
      const lines = available
        .filter((command) => command.category === category)
        .map(({ data }) => {
          const id = registered.find(
            (command) => command.name === data.name
          )?.id;
          const mention = id
            ? chatInputApplicationCommandMention(data.name, id)
            : `**/${data.name}**`;
          return `${mention} — ${data.description}`;
        });
      return { name: category, value: lines.join("\n") };
    })
    .filter((field) => field.value);

  const embed = new EmbedBuilder()
    .setColor(config.colors.doge)
    .setTitle(`Olá, @${interaction.user.username}!`)
    .setDescription(
      `Aqui estão os comandos que você pode utilizar no **${interaction.guild.name}**. Clique em um deles ou digite **/** para começar.`
    )
    .addFields(fields)
    .setFooter({
      text: "Viu algum problema? Contate support@jorgesiqueira.com",
    });

  await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
}
