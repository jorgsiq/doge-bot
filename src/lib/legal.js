import { ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import config from '../config.js';

export function legalRow(t) {
  const repository = config.repositoryUrl;
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder().setStyle(ButtonStyle.Link).setLabel(t('legal.terms')).setURL(t('legal.termsUrl', { repository })),
    new ButtonBuilder().setStyle(ButtonStyle.Link).setLabel(t('legal.privacy')).setURL(t('legal.privacyUrl', { repository })),
  );
}
