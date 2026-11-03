export default {
  // Channels, roles and which features are on are chosen per server with /setup and kept in data/store.json

  // automatic free games and deals, posted in the alerts channel pinging the subscriber role
  gameAlerts: {
    // free games are posted as soon as they show up
    freeCheckMinutes: 60,
    // deals go out once a day as a single digest, at 18:00 in Brasília
    digestHourUtc: 21,
    // the same game is not posted again within this period, unless it gets cheaper
    repostAfterDays: 30,
    // a deal needs all of these: a big discount on a well-known, well-reviewed game
    deals: { minDiscount: 50, minRating: 85, minReviews: 5000, maxPerDigest: 5 },
    // free games outside Epic (whose giveaways are curated) need a reputation, which filters out shovelware
    free: { minNormalPriceUsd: 5, minRating: 70, minReviews: 300, minMetacritic: 70 },
  },

  // a freely licensed shiba photo from Wikimedia Commons every day, none repeated until all were posted
  shibaOfTheDay: {
    // 09:00 in Brasília
    hourUtc: 12,
    // drawings ("Shiba Inu in art") and memes ("Cheems the Dog") are left out
    categories: ['Shiba Inu', 'Shiba Inu puppies', 'Kabosu (dog)', 'Taro the Shiba Inu', 'Mino Shiba Inu', 'Jomon Shiba Inu'],
  },

  // every embed uses the bot's color, except members leaving the server
  colors: {
    doge: '#efe3ca',
    grey: '#8c8c8c',
  },

  images: {
    clean: 'https://i.imgur.com/ht266w1.gif',
    version: 'https://i.imgur.com/NVa068e.png',
    dogeIcon: 'https://i.imgur.com/Zj1a5l5.png',
    enter: 'https://i.imgur.com/e0VcfdL.gif',
    pet: 'https://i.imgur.com/a7ZCBCj.png',
    exit: [
      'https://i.imgur.com/B3ZEsgX.gif',
      'https://i.imgur.com/nU0Liaq.gif',
      'https://i.imgur.com/JkYBPUf.gif',
    ],
    music: {
      pause: 'https://i.imgur.com/tKDUKm9.png',
      resume: 'https://i.imgur.com/em4ISnY.png',
      skip: 'https://i.imgur.com/tKDUKm9.png',
      stop: 'https://i.imgur.com/cc0nEXc.png',
      volume: 'https://i.imgur.com/fOSVbI2.png',
      queue: 'https://i.imgur.com/em4ISnY.png',
      shuffle: 'https://i.imgur.com/em4ISnY.png',
    },
    // shown big in the /status announcement, one per activity type
    status: {
      playing: 'https://i.imgur.com/oELNH2p.gif',
      watching: 'https://i.imgur.com/F3WjZB5.png',
      listening: 'https://i.imgur.com/em4ISnY.png',
      competing: 'https://i.imgur.com/nU0Liaq.gif',
      streaming: 'https://i.imgur.com/fOSVbI2.png',
      custom: 'https://i.imgur.com/e0VcfdL.gif',
    },
  },

  repositoryUrl: 'https://github.com/jorgsiq/doge-bot',
  supportEmail: 'support@jorgesiqueira.com',
};
