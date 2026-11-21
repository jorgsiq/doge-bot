export default {
  gameAlerts: {
    freeCheckMinutes: 60,
    // deals go out once a week as a single digest, on Fridays at 18:00 in Brasília
    digest: { weekdayUtc: 5, hourUtc: 21 },
    repostAfterDays: 30,
    // a pause between the pages asked from CheapShark, to stay under its rate limit
    requestPauseMs: 500,
    // prices and availability follow the region a server picks; it starts as the one of its language
    regions: ['BR', 'PT', 'US', 'CA', 'MX', 'AR', 'GB', 'ES', 'FR', 'DE', 'IT', 'AU'],
    defaultRegion: 'US',
    regionByLanguage: { 'pt-BR': 'BR' },
    deals: {
      minDiscount: 50,
      minRating: 85,
      minReviews: 5000,
      maxPerDigest: 5,
      // the digest picks the best scores, each part going from 0 to 1 and the weights adding up to 1; a price within lowTolerance of the cheapest ever seen is a historical low
      ranking: {
        popularReviews: 200_000,
        freshYears: 5,
        lowTolerance: 1.1,
        weights: { popularity: 0.3, discount: 0.25, rating: 0.15, freshness: 0.15, historicalLow: 0.15 },
      },
    },
    free: { minNormalPriceUsd: 5, minRating: 70, minReviews: 300, minMetacritic: 70 },
  },

  shibaOfTheDay: {
    // 09:00 in Brasília
    hourUtc: 12,
    minAspectRatio: 1.2,
    categories: ['Shiba Inu', 'Shiba Inu puppies', 'Kabosu (dog)', 'Taro the Shiba Inu', 'Mino Shiba Inu', 'Jomon Shiba Inu'],
  },

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
    exit: ['https://i.imgur.com/B3ZEsgX.gif', 'https://i.imgur.com/nU0Liaq.gif', 'https://i.imgur.com/JkYBPUf.gif'],
    music: {
      pause: 'https://i.imgur.com/tKDUKm9.png',
      resume: 'https://i.imgur.com/em4ISnY.png',
      skip: 'https://i.imgur.com/tKDUKm9.png',
      stop: 'https://i.imgur.com/cc0nEXc.png',
      volume: 'https://i.imgur.com/fOSVbI2.png',
      queue: 'https://i.imgur.com/em4ISnY.png',
      shuffle: 'https://i.imgur.com/em4ISnY.png',
    },
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
