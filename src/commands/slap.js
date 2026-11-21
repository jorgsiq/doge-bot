import { reactionCommand } from '../lib/reactions.js';

export const { category, feature, data, execute } = reactionCommand({
  name: 'slap',
  emoji: '👋',
  reaction: 'slap',
  self: { emoji: '🤨', reaction: 'facepalm' },
  bot: { emoji: '🐕', reaction: 'shrug' },
});
