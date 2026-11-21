import {
  InteractionContextType,
  LabelBuilder,
  MessageFlags,
  ModalBuilder,
  SlashCommandBuilder,
  TextInputBuilder,
  TextInputStyle,
  UserSelectMenuBuilder,
} from 'discord.js';
import { describe, localize } from '../lib/i18n.js';
import { ephemeral } from '../lib/replies.js';
import { guildT } from '../lib/settings.js';
import { UNCLAIMED_ROOM_MINUTES, getRoom, invite, openRoom, rename, roomPanel, setHidden, transferOwnership } from '../lib/tempVoice.js';

export const category = 'rooms';
export const feature = 'rooms';

export const data = describe(new SlashCommandBuilder().setName('room'), 'room')
  .setContexts(InteractionContextType.Guild)
  .addStringOption((option) => localize(option, 'room.options.name').setMaxLength(50));

export async function execute(interaction) {
  const t = guildT(interaction.guildId);
  const room = getRoom(interaction.member.voice.channelId);
  if (room) return interaction.reply(ephemeral(roomPanel(t, room.ownerId)));

  await interaction.deferReply({ flags: MessageFlags.Ephemeral });
  const { channel, created, moved } = await openRoom(interaction.member, interaction.options.getString('name')?.trim());

  const content = t(`room.${created ? 'created' : 'existing'}.${moved ? 'moved' : 'notMoved'}`, {
    channel,
    minutes: UNCLAIMED_ROOM_MINUTES,
  });
  await interaction.editReply({ content, ...roomPanel(t, interaction.member.id) });
}

async function respond(interaction, action, flags = MessageFlags.Ephemeral) {
  await interaction.deferReply({ flags });
  try {
    await interaction.editReply(await action());
  } catch (error) {
    console.error('Failed to update a temporary room:', error);
    await interaction.editReply(guildT(interaction.guildId)('common.error'));
  }
}

async function askModal(interaction, title, label, action) {
  const modalId = `room-modal:${interaction.id}`;
  await interaction.showModal(new ModalBuilder().setCustomId(modalId).setTitle(title).addLabelComponents(label));
  const submitted = await interaction.awaitModalSubmit({ filter: (i) => i.customId === modalId, time: 5 * 60_000 }).catch(() => null);
  if (submitted) await respond(submitted, () => action(submitted.fields));
}

export async function handleComponent(interaction, action) {
  const t = guildT(interaction.guildId);
  const channel = interaction.member.voice.channel;
  const room = getRoom(channel?.id);
  if (!room) return interaction.reply(ephemeral(t('room.errors.notInRoom')));

  if (action === 'claim') {
    if (room.ownerId === interaction.member.id) return interaction.reply(ephemeral(t('room.errors.alreadyOwner')));
    if (channel.members.has(room.ownerId)) return interaction.reply(ephemeral(t('room.errors.ownerPresent')));
    return respond(
      interaction,
      async () => {
        await transferOwnership(channel, interaction.member);
        return t('room.claimed', { user: interaction.member });
      },
      undefined,
    );
  }

  if (room.ownerId !== interaction.member.id) return interaction.reply(ephemeral(t('room.errors.onlyOwner')));

  switch (action) {
    case 'lock':
    case 'unlock':
      return respond(interaction, async () => {
        const hidden = action === 'lock';
        await setHidden(channel, hidden);
        return t(hidden ? 'room.locked' : 'room.unlocked');
      });

    case 'rename':
      return askModal(
        interaction,
        t('room.rename.title'),
        new LabelBuilder()
          .setLabel(t('room.rename.label'))
          .setTextInputComponent(
            new TextInputBuilder().setCustomId('name').setStyle(TextInputStyle.Short).setMaxLength(50).setValue(channel.name),
          ),
        async (fields) => {
          const name = fields.getTextInputValue('name').trim();
          if (!name) return t('room.rename.empty');
          return (await rename(channel, name)) ? t('room.rename.done') : t('room.rename.limited');
        },
      );

    case 'limit':
      return askModal(
        interaction,
        t('room.limit.title'),
        new LabelBuilder()
          .setLabel(t('room.limit.label'))
          .setTextInputComponent(
            new TextInputBuilder().setCustomId('limit').setStyle(TextInputStyle.Short).setMaxLength(2).setValue(String(channel.userLimit)),
          ),
        async (fields) => {
          const limit = Number(fields.getTextInputValue('limit'));
          if (!Number.isInteger(limit) || limit < 0 || limit > 99) return t('room.limit.invalid');
          await channel.setUserLimit(limit);
          return limit ? t('room.limit.set', { count: limit }) : t('room.limit.removed');
        },
      );

    case 'invite':
      return askModal(
        interaction,
        t('room.invite.title'),
        new LabelBuilder()
          .setLabel(t('room.invite.label'))
          .setUserSelectMenuComponent(new UserSelectMenuBuilder().setCustomId('users').setMaxValues(10)),
        async (fields) => {
          const users = fields.getSelectedUsers('users', true);
          const unreachable = await invite(channel, users.values(), interaction.member);
          const invited = t('room.invite.done', { users: users.map((user) => `${user}`).join(', ') });
          if (unreachable.length) return `${invited}\n\n${t('room.invite.dmFailed', { users: unreachable.join(', ') })}`;
          return `${invited} ${t('room.invite.dmSent')}`;
        },
      );
  }
}
