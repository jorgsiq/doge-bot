import { ActivityType, Events } from 'discord.js';
import * as store from './store.js';

const saved = store.section('presence');
export const DEFAULT_ACTIVITY = { name: 'Đoge Style', type: ActivityType.Watching };

// discord.js rewrites custom statuses in place, so it always gets a copy of what is saved
const apply = (client) => client.user.setActivity({ ...(saved.activity ?? DEFAULT_ACTIVITY) });

export async function setStatus(client, activity) {
  saved.activity = activity;
  await store.save();
  apply(client);
}

// Discord forgets the activity whenever the session is re-identified, so it is applied again on every shard ready
export function keepStatus(client) {
  apply(client);
  client.on(Events.ShardReady, () => apply(client));
}
