# Đoge Bot

Discord bot made for the **Đoge Style** server, ready to serve several servers from a single running copy: each server picks which features it uses and their channels and roles, and nothing leaks between servers.

[LEARN MORE](https://jorgesiqueira.com/post/doge-bot) (About the Project)

## Features

Every feature can be switched on and off per server in `/setup`. Music and interactions are on by default; the others start off until an admin picks their channels. Each server also picks its language there (English by default, Portuguese included; see [Languages](#languages)).

The bot never hands out roles: members pick them with Discord's own **Onboarding → Channels & Roles** (or staff give them by hand).

- **Music**: a player with a queue: search the official recordings on YouTube Music with autocomplete and play them in a voice channel ([Audius](https://audius.co) is used as a backup when YouTube fails). Pasting a Spotify playlist, album or track link plays the same songs from YouTube Music, and the queue can be shuffled. Its messages show up where each command was used, or in a music channel picked in `/setup`
- **Interactions**: `/pet`, `/kiss`, `/slap` and `/ship`, shown where the command was used or in a channel picked in `/setup`. Whoever gets kissed, slapped or shipped is mentioned outside the embed, so Discord notifies them
- **Welcome and logs**: welcome and farewell messages, plus a log of nickname and avatar changes
- **Temporary rooms**: `/room` creates your own voice channel and moves you into it (or links it, when you are not in a voice channel). Rooms start hidden, seen only by whoever is inside or invited; buttons open them to everyone, close them again, rename, limit, invite and claim them. Invited members get a DM from the bot with a button that opens the room (bots can't send Discord's own voice invite). A room is deleted once empty
- **Game alerts**, filtered so only relevant games get through, optionally pinging a role:
  - free games as soon as they appear: Epic's weekly giveaways (with the prices of the region picked in `/setup`), plus games free on Steam, GOG and other stores that have good reviews and a real price (no free-to-play or shovelware)
  - one weekly digest on Fridays at 18:00 (Brasília) with up to 5 big discounts (50%+) on popular, well-reviewed Steam games (85%+ positive, 5,000+ reviews), with the price and the sale's end date confirmed on the Steam store of the region picked in `/setup`. Every sale on Steam is read and ranked by a score of its popularity, discount, reviews, how recent the game is and whether the price is its lowest ever seen, so a game that is always on sale doesn't crowd out the new ones; the editions of one game count as one
  - a game is posted again in the same server only once the sale or giveaway it was posted in has ended and a new one started (30 days for free games whose end is unknown); every threshold lives in `gameAlerts` in [`src/config.js`](src/config.js)
- **Shiba of the day**: every day at 09:00 (Brasília) a different, freely licensed landscape shiba photo from [Wikimedia Commons](https://commons.wikimedia.org/wiki/Category:Shiba_Inu), credited to its author; none repeats until all were posted
- **Daily cleanup** of chosen channels at 06:00 (Brasília)
- **Commands channel**: anything a person types in the chosen channel, staff included, is deleted at once, since slash commands leave no message of their own; only bots' messages stay
- Staff tools: announcements and bulk delete

## Commands

| Command | Who | What it does |
| --- | --- | --- |
| `/help` | everyone | Lists the commands available to you (only features switched on in the server) |
| `/about` | everyone | Technical information about the bot |
| `/pet` | everyone | Pets the Đoge: Woof Woof! |
| `/kiss` `/slap` | everyone | Kisses or slaps someone, with an anime GIF ([nekos.best](https://nekos.best), [otakugifs](https://otakugifs.xyz) as a backup) |
| `/ship` | everyone | How compatible two people are, drawn as both avatars with a beating heart, plus a couple name; the same pair always gets the same score |
| `/play` | everyone | Searches a song and adds it to the queue, or adds every song of a Spotify playlist or album link |
| `/pause` `/resume` `/skip` `/shuffle` `/stop` `/volume` | listeners | Control the music (you must be in the bot's voice channel) |
| `/queue` | everyone | Shows what is playing and what comes next |
| `/room` | everyone | Creates your temporary room (optionally named) and shows its control panel, or shows the panel of the room you are in |
| `/setup` | Manage Server | Switches features on and off, picks their channels and the language of the server (see below) |
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

4. Invite the bot to a server with the `bot` and `applications.commands` scopes and these permissions: View Channels, Manage Roles, Manage Channels, Manage Messages, Read Message History, Send Messages, Embed Links, Attach Files, Mention @everyone, @here and All Roles, Connect, Speak, Move Members. Manage Roles is only used to set the permissions of temporary rooms.
5. Under **General Information**, fill in **Terms of Service URL** and **Privacy Policy URL** with the links to [`TERMS.md`](TERMS.md) and [`PRIVACY.md`](PRIVACY.md) in the repository (`https://github.com/jorgsiq/doge-bot/blob/master/TERMS.md`, `.../PRIVACY.md`): Discord shows them to whoever authorizes the bot, and asks for them to verify it.

Slash commands are registered globally every time the bot starts, so there is no separate deploy step. `npm test` runs offline, validating the command definitions and the translations along with the logic; `npm run lint` and `npm run format:check` (also run by the CI on every push) keep the code consistent, and `npm run format` fixes the formatting.

### Configuring a server

When the bot joins a server (or starts in one it has never set up), it posts a welcome in the first channel it can write in (the system channel first), with a **Configure** button and links to the Terms of Service and the Privacy Policy, which whoever adds the bot agrees to; the links are in the language of the server and are also under `/about`. If it can't write in any channel, it sends the same welcome, with what to fix, by DM to the server owner.

**Configure** (and `/setup`, until the server goes through it once) opens a guided setup, only for who can manage the server, in three steps:

1. **Language**: English by default, changeable here; the next steps already come in the language picked.
2. **Permissions**: checks what the bot's role is allowed to do (View Channels, Send Messages, Manage Messages, Manage Channels and so on) and lists what is missing, with the features that need each permission and where to turn it on.
3. **Features**: the panel below.

From then on `/setup` opens that panel straight away. It lists every feature next to its status (Active, Inactive, Incomplete when it is on but a channel is still missing, or Needs permissions when the bot can't do its job in a channel that was picked); picking one shows its channel menus (and, for game alerts, the role to ping and the region of the prices, which starts as the one of the server's language: Brazil for Portuguese, the United States otherwise), already filled with the current values, an on/off switch, and the permissions the bot lacks in the channels picked, so a channel that blocks the bot is noticed when it is chosen, not when a post fails. A second menu changes the language of the server, and **Check permissions** repeats step 2. Changes apply immediately.

To let members choose the game alerts role, add it to **Server Settings → Onboarding → Channels & Roles** (Community servers). For temporary rooms, pick the category where they should be created: rooms copy its permissions.

Each server's choices (language included), the alerts already posted and the open rooms are kept in `data/store.json`, a plain JSON file: no database is needed, but the file must survive restarts (see hosting below). Game alert thresholds, colors and images live in [`src/config.js`](src/config.js).

### Languages

Every message the bot sends comes from `src/locales/<language>.json`, a single file per language, like the translation files of a website, with a section for each command or module. The language is picked per server in `/setup`, because most of what the bot posts goes to a channel for everyone; English is the default, and a server that never picks one gets English. Command descriptions and option names are translated with Discord's own localizations, so each member sees them in the language of their app.

Messages use `{name}` placeholders. A `count` picks the plural form (`songs_one`, `songs_other`), and a list holds variants of which one is picked at random (the texts of `/kiss`, for example). A message missing from a language is shown in English.

To add a language, copy `src/locales/en-US.json` to a file named after its [Discord locale code](https://discord.com/developers/docs/reference#locales) (say `es-ES.json`), translate the values, and set `meta.name` to the name the language calls itself. It shows up in `/setup` at once. `npm test` checks that every language has the same messages and placeholders as English, and that no message the code asks for is missing.

Servers set up before languages existed stay in Portuguese, as the bot only spoke Portuguese then.

### Hosting

The bot needs a machine that stays on, with a disk that keeps `data/store.json` between restarts:

- **A computer at home** (or a Raspberry Pi): free, and the best place for music, since YouTube blocks many datacenter IPs.
- **[Oracle Cloud Always Free](https://www.oracle.com/cloud/free/)**: a free virtual machine with a real disk. It needs a card for verification, Oracle may reclaim instances that stay idle for a week, and YouTube playback may be blocked from its IPs (search falls back to Audius, but blocked tracks are skipped).
- **Discord bot hosting panels** (Pterodactyl-based, such as bot-hosting.net): they start `index.js`, which runs the bot, so only `.env` and `data/store.json` need uploading next to `package.json`; the bot reads `.env` by itself. They run in datacenters too, so YouTube may block them. The linter and formatter are dev dependencies: where the panel installs everything, `npm install --omit=dev` (or `NODE_ENV=production`) leaves them out.
- Free app platforms (Render, Koyeb, Replit and similar) usually sleep, or wipe the disk on every deploy, which loses each server's configuration.

### About the music player

YouTube does not offer an official API for streaming audio, so the player uses [@distube/ytdl-core](https://github.com/distubejs/ytdl-core), which talks to YouTube's internal API. Keep in mind:

- This goes against YouTube's Terms of Service. It is meant for a private bot used by a few servers.
- When YouTube changes something, playback may stop working until the library is fixed. Run `npm update @distube/ytdl-core` and restart the bot.
- YouTube blocks many datacenter IPs (VPS, cloud hosting). The player works best on a residential connection, such as a home computer. On a server YouTube distrusts ("Sign in to confirm you're not a bot"), set `YOUTUBE_COOKIE` in `.env` to the `Cookie` header of a throwaway Google account signed in to YouTube; never use your own account.
- Spotify links need no Spotify account or API key: the bot reads the first 100 tracks of a public playlist or album from Spotify's embed player page, and each one looks for its recording on YouTube Music when its turn comes (the first result about as long as the Spotify track). Private playlists can't be read, and if Spotify changes that page, links stop working until the bot is updated.
- If 3 tracks in a row fail to load, the player stops instead of going through the whole queue, since YouTube itself is then most likely refusing the server.
- Before playing, the library loads YouTube's player script, which peaks at about 400 MB of memory for the whole bot and has 10 seconds to finish. Hosting plans with a fraction of a CPU or less memory than that can't play from YouTube.

## Built With

- JavaScript (ES modules) on Node.js
- [discord.js](https://discord.js.org) v14 and [@discordjs/voice](https://discord.js.org/docs/packages/voice/main)
- [@distube/ytdl-core](https://github.com/distubejs/ytdl-core) for YouTube Music and the [Audius API](https://docs.audius.org) as a backup, with FFmpeg ([ffmpeg-static](https://github.com/eugeneware/ffmpeg-static)) and [opusscript](https://github.com/abalabahaha/opusscript) for audio encoding
- The [Wikimedia Commons API](https://commons.wikimedia.org/w/api.php) for the shiba photos

## Authors

- **Jorge Siqueira** - [@jorgsiq](https://github.com/jorgsiq)

See also the list of [contributors](https://github.com/jorgsiq/doge-bot/graphs/contributors) who participated in this project

## License

This project is licensed under the MIT License. Using the hosted Đoge Bot is subject to its [Terms of Service](TERMS.md) ([em português](TERMS.pt-BR.md)) and [Privacy Policy](PRIVACY.md) ([em português](PRIVACY.pt-BR.md)).
