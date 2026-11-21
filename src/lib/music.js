import {
  AudioPlayerStatus,
  VoiceConnectionStatus,
  createAudioPlayer,
  createAudioResource,
  entersState,
  joinVoiceChannel,
} from '@discordjs/voice';
import { EmbedBuilder } from 'discord.js';
import config from '../config.js';
import { shuffle } from './random.js';
import { ephemeral } from './replies.js';
import { getLanguage, guildT } from './settings.js';
import { t as translate } from './i18n.js';

const queues = new Map();
const MAX_FAILURES = 3;

export function getQueue(guildId) {
  return queues.get(guildId);
}

export async function createQueue(voiceChannel, textChannel) {
  const queue = new GuildQueue(voiceChannel, textChannel);
  queues.set(queue.guildId, queue);
  try {
    await entersState(queue.connection, VoiceConnectionStatus.Ready, AbortSignal.any([AbortSignal.timeout(20_000), queue.stopped]));
  } catch (error) {
    queue.destroy();
    throw error;
  }
  return queue;
}

export function stopAll() {
  for (const queue of [...queues.values()]) queue.destroy();
}

export function stopIfAlone(oldState, newState) {
  const queue = queues.get(oldState.guild.id);
  if (!queue) return;

  const botMoved = newState.id === newState.client.user.id;
  let channel;
  if (botMoved) channel = newState.channel;
  else if (oldState.channelId === queue.channelId) channel = oldState.channel;
  else channel = null;
  if (!channel || channel.members.some((member) => !member.user.bot)) return;

  const t = guildT(oldState.guild.id);
  queue.notify({ embeds: [statusEmbed(t('music.playbackEnded'), t('music.everyoneLeft'), config.images.music.stop)] });
  queue.destroy();
}

export async function controllableQueue(interaction) {
  const queue = queues.get(interaction.guildId);
  const t = guildT(interaction.guildId);
  if (!queue) {
    await interaction.reply(ephemeral(t('music.noQueue')));
    return null;
  }
  if (interaction.member.voice.channelId !== queue.channelId) {
    await interaction.reply(ephemeral(t('music.notInChannel', { channel: queue.channelId })));
    return null;
  }
  return queue;
}

export class GuildQueue {
  tracks = [];
  current = null;
  resource = null;
  volume = 10;
  destroyed = false;
  // bumped on every track change, so a stream that finishes loading after a skip is thrown away
  #loads = 0;
  #failures = 0;
  #stop = new AbortController();

  constructor(voiceChannel, textChannel) {
    this.guildId = voiceChannel.guild.id;
    this.textChannel = textChannel;
    this.player = createAudioPlayer();
    this.connection = joinVoiceChannel({
      channelId: voiceChannel.id,
      guildId: this.guildId,
      adapterCreator: voiceChannel.guild.voiceAdapterCreator,
    });
    this.connection.subscribe(this.player);

    this.player.on(AudioPlayerStatus.Idle, () => this.#playNext(true));
    this.player.on('error', (error) => {
      const { title } = error.resource.metadata;
      console.error(`Failed to play ${title}:`, error);
      this.notify({ content: this.t('music.trackFailed', { title }) });
    });

    // an EventEmitter 'error' nobody listens to would crash the process
    this.connection.on('error', (error) => console.error('Voice connection error:', error));
    this.connection.on(VoiceConnectionStatus.Disconnected, async () => {
      // being moved to another channel reconnects by itself; being kicked does not
      try {
        await Promise.race([
          entersState(this.connection, VoiceConnectionStatus.Signalling, 5_000),
          entersState(this.connection, VoiceConnectionStatus.Connecting, 5_000),
        ]);
      } catch {
        this.destroy();
      }
    });
  }

  t(key, vars) {
    return translate(getLanguage(this.guildId), key, vars);
  }

  get channelId() {
    return this.connection.joinConfig.channelId;
  }

  get stopped() {
    return this.#stop.signal;
  }

  get paused() {
    return this.player.state.status === AudioPlayerStatus.Paused;
  }

  add(...tracks) {
    this.tracks.push(...tracks);
    if (this.current) return false;
    this.#playNext(false);
    return true;
  }

  shuffle() {
    shuffle(this.tracks);
  }

  async #playNext(announce) {
    if (this.destroyed) return;
    const load = ++this.#loads;

    const track = (this.current = this.tracks.shift() ?? null);
    if (!track) {
      this.notify({ embeds: [statusEmbed(this.t('music.playbackEnded'), this.t('music.queueOver'), config.images.music.stop)] });
      return this.destroy();
    }

    try {
      if (track.resolve) Object.assign(track, await track.resolve());
      const input = await track.createStream();
      if (this.destroyed || load !== this.#loads) {
        if (typeof input !== 'string') input.destroy();
        return;
      }
      this.resource = createAudioResource(input, { inlineVolume: true, metadata: track });
    } catch (error) {
      console.error(`Failed to load ${track.title}:`, error);
      if (this.destroyed || load !== this.#loads) return;
      if (++this.#failures >= MAX_FAILURES) {
        this.notify({
          embeds: [
            statusEmbed(this.t('music.playbackEnded'), this.t('music.tooManyFailures', { count: MAX_FAILURES }), config.images.music.stop),
          ],
        });
        return this.destroy();
      }
      this.notify({ content: this.t('music.trackFailed', { title: track.title }) });
      return this.#playNext(true);
    }

    this.#failures = 0;
    this.resource.volume.setVolumeLogarithmic(this.volume / 10);
    this.player.play(this.resource);
    if (announce) this.notify({ embeds: [trackEmbed(this.t.bind(this), track, this.t('music.nowPlaying'), { largeCover: true })] });
  }

  skip() {
    // the player is idle only while the next track loads; skipping then moves straight past it
    if (this.player.state.status === AudioPlayerStatus.Idle) return this.#playNext(true);
    // forced, so it also works while the player is auto paused; going idle starts the next track
    this.player.stop(true);
  }

  pause() {
    return this.player.pause();
  }

  resume() {
    return this.player.unpause();
  }

  setVolume(volume) {
    this.volume = volume;
    this.resource?.volume.setVolumeLogarithmic(volume / 10);
  }

  destroy() {
    if (this.destroyed) return;
    this.destroyed = true;
    this.#stop.abort();
    this.tracks = [];
    this.player.stop(true);
    if (this.connection.state.status !== VoiceConnectionStatus.Destroyed) this.connection.destroy();
    queues.delete(this.guildId);
  }

  notify(payload) {
    // null when /play came from a channel the bot can't see; throwing here (inside player events) would crash the bot
    this.textChannel?.send(payload).catch((error) => console.error('Failed to send music update:', error));
  }
}

export function formatDuration(seconds) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = String(seconds % 60).padStart(2, '0');
  return h ? `${h}:${String(m).padStart(2, '0')}:${s}` : `${m}:${s}`;
}

export const artistName = (t, track) => track.artist || t('music.unknownArtist');

export function trackEmbed(t, track, title, { largeCover = false } = {}) {
  const embed = new EmbedBuilder()
    .setColor(config.colors.doge)
    .setAuthor({ name: title })
    .setTitle(track.title.slice(0, 256))
    .setURL(track.url)
    .addFields(
      { name: t('music.artist'), value: artistName(t, track).slice(0, 1024), inline: true },
      { name: t('music.duration'), value: formatDuration(track.duration), inline: true },
    )
    .setFooter({ text: t('music.requestedBy', { user: track.requestedBy.username, source: track.source }) });

  if (track.artwork) {
    if (largeCover) embed.setImage(track.artwork);
    else embed.setThumbnail(track.artwork);
  }
  return embed;
}

export function statusEmbed(title, description, thumbnail) {
  return new EmbedBuilder().setColor(config.colors.doge).setAuthor({ name: title }).setDescription(description).setThumbnail(thumbnail);
}
