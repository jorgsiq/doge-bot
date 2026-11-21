import { reactionCommand } from '../lib/reactions.js';

export const { category, feature, data, execute } = reactionCommand({
  name: 'kiss',
  emoji: '💋',
  reaction: 'kiss',
  self: { emoji: '🪞', reaction: 'blush' },
  bot: { emoji: '😳', reaction: 'blush' },
});
