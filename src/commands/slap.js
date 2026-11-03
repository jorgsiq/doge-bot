import { reactionCommand } from '../lib/reactions.js';

export const { category, data, execute } = reactionCommand({
  name: 'slap',
  description: 'Você dá um tapa em alguém',
  reaction: 'slap',
  texts: [
    (author, target) => `👋 ${author} deu um tapa em ${target}! Essa doeu...`,
    (author, target) => `👋 ${author} deu um tapa estalado em ${target}!`,
    (author, target) => `👋 ${author} meteu a mão na cara de ${target}!`,
    (author, target) => `👋 ${author} acertou um tapão em ${target}! Foi merecido?`,
  ],
  self: { reaction: 'facepalm', text: (author) => `🤨 ${author} deu um tapa em si mesmo. Tá tudo bem aí?` },
  bot: { reaction: 'shrug', text: (author) => `🐕 ${author} tentou dar um tapa no Đoge, mas ele desviou!` },
});
