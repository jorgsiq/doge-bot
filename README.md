# Đoge Bot

Discord bot made for the **Đoge Style** server, ready to serve several servers from a single running copy: each server picks which features it uses and their channels and roles, and nothing leaks between servers.

[LEARN MORE](https://jorgesiqueira.com/post/doge-bot) (About the Project)

## Features

Every feature can be switched on and off per server in `/setup`. Music is on by default; the others start off until an admin picks their channels.

The bot never hands out roles: members pick them with Discord's own **Onboarding → Channels & Roles** (or staff give them by hand).

- **Music**: a player with a queue: search the official recordings on YouTube Music with autocomplete and play them in a voice channel ([Audius](https://audius.co) is used as a backup when YouTube fails)
- **Welcome and logs**: welcome and farewell messages, plus a log of nickname and avatar changes
- **Temporary rooms**: `/room` creates your own voice channel and moves you into it (or links it, when you are not in a voice channel). Rooms start hidden, seen only by whoever is inside or invited; buttons open them to everyone, close them again, rename, limit, invite and claim them. A room is deleted once empty
- **Game alerts**, filtered so only relevant games get through, optionally pinging a role:
  - free games as soon as they appear: Epic's weekly giveaways, plus games free on Steam, GOG and other stores that have good reviews and a real price (no free-to-play or shovelware)
  - one daily digest at 18:00 (Brasília) with up to 5 big discounts (50%+) on popular, well-reviewed Steam games (85%+ positive, 5,000+ reviews), with prices in reais confirmed on the Brazilian Steam store
  - nothing is posted twice in the same server within 30 days, unless it gets cheaper; every threshold lives in `gameAlerts` in [`src/config.js`](src/config.js)
- **Shiba of the day**: every day at 09:00 (Brasília) a different, freely licensed shiba photo from [Wikimedia Commons](https://commons.wikimedia.org/wiki/Category:Shiba_Inu), credited to its author; none repeats until all were posted
- **Daily cleanup** of chosen channels at 06:00 (Brasília)
- **Commands channel**: anything a person types in the chosen channel, staff included, is deleted at once, since slash commands leave no message of their own; only bots' messages stay
- Staff tools: announcements and bulk delete

## Commands

| Command | Who | What it does |
| --- | --- | --- |
| `/help` | everyone | Lists the commands available to you (only features switched on in the server) |
| `/about` | everyone | Technical information about the bot |
| `/pet` | everyone | Pets the Đoge: Woof Woof! |
| `/play` | everyone | Searches a song and adds it to the queue |
| `/pause` `/resume` `/skip` `/stop` `/volume` | listeners | Control the music (you must be in the bot's voice channel) |
| `/queue` | everyone | Shows what is playing and what comes next |
| `/room` | everyone | Creates your temporary room (optionally named), or shows the control panel of the one you are in |
| `/setup` | Manage Server | Switches features on and off and picks their channels (see below) |
| `/announce` | Manage Server | Posts an announcement (optional image, @everyone or game alerts role ping) |
| `/delete` | Manage Messages | Bulk deletes up to 100 messages |
| `/status` | bot owner | Changes the bot activity, which shows in every server |

Replies are ephemeral (only the person who used the command sees them), so channels stay clean. Who can use each command can be changed in **Server Settings → Integrations → Đoge Bot**.

## Setup

Requires **Node.js 22.22.2+** (or 24.15+).

1. Create an application at the [Discord Developer Portal](https://discord.com/developers/applications).
2. Under **Bot**, enable the privileged **Server Members Intent**.
3. Install and run:

   ```sh
   npm install
   cp .env.example .env   # then paste the bot token into DISCORD_TOKEN
   npm start              # or: npm run dev, which restarts on file changes
   ```

4. Invite the bot to a server with the `bot` and `applications.commands` scopes and these permissions: Manage Roles, Manage Channels, Manage Messages, Read Message History, Send Messages, Embed Links, Attach Files, Mention @everyone, @here and All Roles, Connect, Speak, Move Members. Manage Roles is only used to set the permissions of temporary rooms.

Slash commands are registered globally every time the bot starts, so there is no separate deploy step. `npm test` validates the command definitions offline.

### Configuring a server

When the bot joins a server (or starts in one it has never set up), it posts a welcome in the system channel with a **Configurar** button; `/setup` opens the same panel at any time. The panel lists every feature next to its status (Ativo, Inativo, or Incompleto when it is on but a channel is still missing); picking one shows its channel menus (and, for game alerts, the role to ping), already filled with the current values, and an on/off switch. Changes apply immediately.

To let members choose the game alerts role, add it to **Server Settings → Onboarding → Channels & Roles** (Community servers). For temporary rooms, pick the category where they should be created: rooms copy its permissions.

Each server's choices, the alerts already posted and the open rooms are kept in `data/store.json`, a plain JSON file: no database is needed, but the file must survive restarts (see hosting below). Game alert thresholds, colors and images live in [`src/config.js`](src/config.js).

### Hosting

The bot needs a machine that stays on, with a disk that keeps `data/store.json` between restarts:

- **A computer at home** (or a Raspberry Pi): free, and the best place for music, since YouTube blocks many datacenter IPs.
- **[Oracle Cloud Always Free](https://www.oracle.com/cloud/free/)**: a free virtual machine with a real disk. It needs a card for verification, Oracle may reclaim instances that stay idle for a week, and YouTube playback may be blocked from its IPs (search falls back to Audius, but blocked tracks are skipped).
- **Discord bot hosting panels** (Pterodactyl-based, such as bot-hosting.net): they start `index.js`, which runs the bot, so only `.env` and `data/store.json` need uploading next to `package.json`; the bot reads `.env` by itself. They run in datacenters too, so YouTube may block them.
- Free app platforms (Render, Koyeb, Replit and similar) usually sleep, or wipe the disk on every deploy, which loses each server's configuration.

### About the music player

YouTube does not offer an official API for streaming audio, so the player uses [@distube/ytdl-core](https://github.com/distubejs/ytdl-core), which talks to YouTube's internal API. Keep in mind:

- This goes against YouTube's Terms of Service. It is meant for a private bot used by a few servers.
- When YouTube changes something, playback may stop working until the library is fixed. Run `npm update @distube/ytdl-core` and restart the bot.
- YouTube blocks many datacenter IPs (VPS, cloud hosting). The player works best on a residential connection, such as a home computer. On a server YouTube distrusts ("Sign in to confirm you're not a bot"), set `YOUTUBE_COOKIE` in `.env` to the `Cookie` header of a throwaway Google account signed in to YouTube; never use your own account.
- Before playing, the library loads YouTube's player script, which takes a few seconds of CPU. Hosting plans with a fraction of a CPU need more than the library's 10-second limit, so `npm install` raises it to 60 seconds ([`scripts/patch-ytdl.js`](scripts/patch-ytdl.js)).

## Built With

- JavaScript (ES modules) on Node.js
- [discord.js](https://discord.js.org) v14 and [@discordjs/voice](https://discord.js.org/docs/packages/voice/main)
- [@distube/ytdl-core](https://github.com/distubejs/ytdl-core) for YouTube Music and the [Audius API](https://docs.audius.org) as a backup, with FFmpeg ([ffmpeg-static](https://github.com/eugeneware/ffmpeg-static)) and [opusscript](https://github.com/abalabahaha/opusscript) for audio encoding
- The [Wikimedia Commons API](https://commons.wikimedia.org/w/api.php) for the shiba photos

## Authors

- **Jorge Siqueira** - [@jorgsiq](https://github.com/jorgsiq)

See also the list of [contributors](https://github.com/jorgsiq/doge-bot/graphs/contributors) who participated in this project

## License

This project is licensed under the MIT License.
