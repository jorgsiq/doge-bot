import { reactionCommand } from '../lib/reactions.js';

export const { category, feature, data, execute } = reactionCommand({
  name: 'kiss',
  description: 'Você dá um beijo em alguém',
  done: 'Seu beijo foi enviado!',
  emoji: '💋',
  reaction: 'kiss',
  texts: [
    (author, target) => `${author} acabou de beijar ${target} com entusiasmo!`,
    (author, target) => `${author} roubou um beijo de ${target}!`,
    (author, target) => `${author} deu um beijão em ${target}!`,
    (author, target) => `${author} tascou um beijo em ${target} sem aviso!`,
  ],
  self: { emoji: '🪞', reaction: 'blush', text: (author) => `${author} tentou se beijar... e acabou beijando o espelho!` },
  bot: { emoji: '😳', reaction: 'blush', text: (author) => `O Đoge ficou todo sem graça com o beijo de ${author}!` },
});
