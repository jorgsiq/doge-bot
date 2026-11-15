# Đoge Bot Privacy Policy

Last updated: November 4, 2026 · [Leia em português](PRIVACY.md)

This policy explains what data **Đoge Bot**, the Discord bot maintained by Jorge Siqueira ("the developer"), receives, keeps and shares, and why. It complements the [Terms of Service](TERMS.en.md).

## 1. What the bot receives from Discord

Like every bot, Đoge Bot receives from Discord what it needs to answer commands and run its features:

- who used a command, in which server and channel, and the options they chose, such as the name of a song or the person in a `/kiss`;
- the name, nickname, avatar and ID of the members of the servers it is in;
- who joins and leaves voice channels, to play music, stop when everyone leaves and manage temporary rooms;
- in the commands channel, who sent each message, so it can delete it.

The bot does not ask Discord for access to the content of messages.

## 2. What the bot keeps

The bot keeps, in a file on the server where it runs, only:

- each server's settings: the features switched on and the IDs of the channels and roles chosen in `/setup`;
- the open temporary rooms: the ID of the channel and the ID of whoever owns the room;
- which game alerts and shiba photos were already posted in each server, so they aren't repeated;
- the status the bot shows on Discord.

Everything else, like the music queue, lives only in memory while the bot is running and is gone when it restarts. Technical error logs, which may include, for example, the name of a song that couldn't be played, stay on the hosting server and are used only to fix problems.

## 3. What the bot posts

- **Welcomes and logs**, when switched on: in the channel the server chose, the name, avatar and ID of whoever joins, leaves or changes their nickname or avatar. When an avatar changes, it posts a picture with the old avatar and the new one. These messages stay on Discord, under the control of the server's admins.
- **Direct messages**: a welcome to whoever joins a server with that feature on, and invites to temporary rooms.
- **Interactions**: the bot mentions the people involved, and `/ship` uses both people's avatars to draw its picture.

## 4. Who the data is shared with

Only what is needed, and only with:

- **Discord**, where everything happens;
- **YouTube Music** and **Audius**: the text searched with `/play`, to find the song;
- **Spotify**: the playlist, album or track link pasted into `/play`;
- **nekos.best** and **otakugifs**: only the kind of reaction (kiss, slap...), with no data about who used the command;
- the **hosting provider** where the bot runs, which stores the data file.

The game services (CheapShark, the Epic Games Store and Steam) and Wikimedia Commons receive no data about any user. The bot does not sell data, does not show ads and does not use tracking or analytics tools.

## 5. How long the data is kept

- Temporary rooms are removed from the file when the room is deleted.
- A server's settings and its history of posted alerts and photos are kept until someone asks for them to be removed. Removing the bot from the server does not delete this data automatically.

## 6. Your rights

You can ask to see what data the bot keeps about you or your server, or ask for it to be deleted, through the email at the end of this page. Depending on where you live, such as in the European Union (GDPR) or in Brazil (LGPD), you may have other rights over your data, and they will be respected.

Admins can also switch off any feature in `/setup` or remove the bot from the server at any time.

## 7. Children

The bot follows the minimum age Discord requires and does not knowingly collect data from anyone below it.

## 8. Security

The data is kept on a server only the developer can access. Still, no system is completely secure, and absolute protection can't be guaranteed.

## 9. Changes to this policy

This policy may change. The current version is always on this page, with the date of the last update at the top.

## 10. Contact

Questions or requests about your data: [support@jorgesiqueira.com](mailto:support@jorgesiqueira.com).
