import { Events } from 'discord.js';
import { stopIfAlone } from '../lib/music.js';
import { handleVoiceStateUpdate } from '../lib/tempVoice.js';

export const name = Events.VoiceStateUpdate;

export async function execute(oldState, newState) {
  stopIfAlone(oldState, newState);
  await handleVoiceStateUpdate(oldState, newState);
}
