import {
  AudioPlayerStatus,
  VoiceConnectionStatus,
  createAudioPlayer,
  createAudioResource,
  entersState,
  joinVoiceChannel,
} from '@discordjs/voice';
import { EmbedBuilder, MessageFlags } from 'discord.js';
import config from '../config.js';

const queues = new Map();

export function getQueue(guildId) {
  return queues.get(guildId);
}

export async function createQueue(voiceChannel, textChannel) {
  const queue = new GuildQueue(voiceChannel, textChannel);
  queues.set(queue.guildId, queue);
  try {
    // gives up right away if the queue is stopped (e.g. /stop) while still connecting
    await entersState(queue.connection, VoiceConnectionStatus.Ready, AbortSignal.any([AbortSignal.timeout(20_000), queue.stopped]));
  } catch (error) {
    queue.destroy();
    throw error;
  }
  return queue;
}

// Stops the music once nobody is listening: everyone left the bot's channel, or the bot ended up in an empty one
export function stopIfAlone(oldState, newState) {
  const queue = queues.get(oldState.guild.id);
  if (!queue) return;

  const botMoved = newState.id === newState.client.user.id;
  const channel = botMoved ? newState.channel : oldState.channelId === queue.channelId ? oldState.channel : null;
  // a disconnected bot is handled by the voice connection itself
  if (!channel || channel.members.some((member) => !member.user.bot)) return;

  queue.notify({
    embeds: [statusEmbed('Fim da Reprodução', 'Todo mundo saiu do canal de voz, então parei a música', config.images.music.stop)],
  });
  queue.destroy();
}

// Returns the queue when the member is listening to it; otherwise replies explaining why and returns null
export async function controllableQueue(interaction) {
  const queue = queues.get(interaction.guildId);
  if (!queue) {
    await interaction.reply({ content: 'Opa! parece que não existe nenhuma música sendo reproduzida..', flags: MessageFlags.Ephemeral });
    return null;
  }
  if (interaction.member.voice.channelId !== queue.channelId) {
    await interaction.reply({ content: `Opa! você precisa estar em <#${queue.channelId}> para controlar a música..`, flags: MessageFlags.Ephemeral });
    return null;
  }
  return queue;
}

class GuildQueue {
  tracks = [];
  current = null;
  resource = null;
  // 0 to 10, like the old player
  volume = 10;
  destroyed = false;
  // bumped on every track change, so a stream that finishes loading after a skip is thrown away
  #loads = 0;
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

    // fires when a track ends or fails to load
    this.player.on(AudioPlayerStatus.Idle, () => this.#playNext(true));
    this.player.on('error', (error) => {
      const { title } = error.resource.metadata;
      console.error(`Failed to play ${title}:`, error);
      this.notify({ content: `Desculpe! não consegui tocar **${title}**, pulando para a próxima..` });
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

  get channelId() {
    return this.connection.joinConfig.channelId;
  }

  // aborts when the queue is destroyed
  get stopped() {
    return this.#stop.signal;
  }

  get paused() {
    return this.player.state.status === AudioPlayerStatus.Paused;
  }

  // Returns true when the track starts right away, false when it waits in the queue
  add(track) {
    this.tracks.push(track);
    if (this.current) return false;
    this.#playNext(false);
    return true;
  }

  async #playNext(announce) {
    if (this.destroyed) return;
    const load = ++this.#loads;

    const track = (this.current = this.tracks.shift() ?? null);
    if (!track) {
      this.notify({ embeds: [statusEmbed('Fim da Reprodução', 'A fila acabou', config.images.music.stop)] });
      return this.destroy();
    }

    try {
      const input = await track.createStream();
      // stopped or skipped while the stream was being prepared
      if (this.destroyed || load !== this.#loads) {
        if (typeof input !== 'string') input.destroy();
        return;
      }
      this.resource = createAudioResource(input, { inlineVolume: true, metadata: track });
    } catch (error) {
      console.error(`Failed to load ${track.title}:`, error);
      this.notify({ content: `Desculpe! não consegui tocar **${track.title}**, pulando para a próxima..` });
      return this.#playNext(true);
    }

    this.resource.volume.setVolumeLogarithmic(this.volume / 10);
    this.player.play(this.resource);
    if (announce) this.notify({ embeds: [trackEmbed(track, 'Tocando Agora', { largeCover: true })] });
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

export function trackEmbed(track, title, { largeCover = false } = {}) {
  const embed = new EmbedBuilder()
    .setColor(config.colors.doge)
    .setAuthor({ name: title })
    // embed titles are capped at 256 characters and field values can't be empty
    .setTitle(track.title.slice(0, 256))
    .setURL(track.url)
    .addFields(
      { name: 'Artista', value: track.artist.slice(0, 1024) || 'Desconhecido', inline: true },
      { name: 'Duração', value: formatDuration(track.duration), inline: true },
    )
    .setFooter({ text: `Pedido por @${track.requestedBy.username} · ${track.source}` });

  if (track.artwork) {
    if (largeCover) embed.setImage(track.artwork);
    else embed.setThumbnail(track.artwork);
  }
  return embed;
}

export function statusEmbed(title, description, thumbnail) {
  return new EmbedBuilder().setColor(config.colors.doge).setAuthor({ name: title }).setDescription(description).setThumbnail(thumbnail);
}
