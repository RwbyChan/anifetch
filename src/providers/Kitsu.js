const request = require('@intrnl/fetch-request')
const Fuse = require('fuse.js')


const FuseOptions = {
  shouldSort: true,
  keys: [
    { name: 'attributes.canonicalTitle', weight: 0.8, },

    { name: 'attributes.titles.ja_jp', weight: 0.6, },
    { name: 'attributes.titles.en_jp', weight: 0.6, },
    { name: 'attributes.titles.en', weight: 0.6, },

    { name: 'attributes.slug', weight: 0.4, },
    { name: 'id', weight: 0.4, },

    { name: 'attributes.synopsis', weight: 0.2, },
  ]
}

const MediaFormat = {
  anime: 'Anime',
  manga: 'Manga',
}

const MediaType = {
  // Anime
  ONA:      'Original Net Animation',
  OVA:      'Original Video Animation',
  TV:       'TV',
  movie:    'Movie',
  music:    'Music Video',
  special:  'Special',

  // Manga
  doujin:   'Doujinshi',
  manga:    'Manga',   // Japanese
  manhua:   'Manhua', // Chinese
  manhwa:   'Manhwa', // Korean
  oneshot:  'One-shot',
  oel:      'Original English Manga',

  // Misc
  novel:    'Novel',
}

const MediaProgress = {
  anime: {
    current:      'Currently airing',
    finished:     'Finished airing',
    tba:          'To be announced',
    unreleased:   'Unreleased',
    upcoming:     'Upcoming',
  },
  manga: {
    current:      'Currently publishing',
    finished:     'Finished publishing',
    tba:          'To be announced',
    unreleased:   'Unreleased',
    upcoming:     'Upcoming',
  },
}


async function search (format, term, limit = 1) {
  format = format.toLowerCase()
  if (!['anime', 'manga'].includes(format)) throw new RangeError('type must either be `anime` or `manga`')

  let data = await request({
    method: 'GET',
    baseUrl: 'https://kitsu.io/api/edge',
    url: format,
    qs: {
      'page[limit]': 20,
      'filter[text]': term,
    },
    headers: {
      'User-Agent': 'Haru, general purpose Discord bot. gitlab:intrnl/haru',
      'Accept': 'application/vnd.api+json',
      'Content-Type': 'application/vnd.api+json',
    },
    json: true,
  })
    .then((data) => data.data)
    .then((data) => {
      let fuse = new Fuse(data, FuseOptions)
      let search = fuse.search(term)

      return search
    })
    .then((data) => data.splice(0, limit))
    .catch((err) => {
      throw new Error(err)
    })
  
  let dataMapped = data.map(map)
  
  return dataMapped
}

function map (data) {
  let dataReturn = {
    provider_name: 'Kitsu',
    provider_url: 'https://kitsu.io/',
    provider_avatar: 'https://avatars1.githubusercontent.com/u/7648832',

    id: data.id,
    slug: data.attributes.slug,

    url: `https://kitsu.io/${data.type}/${data.attributes.slug}`,
    cover: data.attributes.posterImage.original || data.attributes.posterImage.large || data.attributes.posterImage.medium || data.attributes.posterImage.small || data.attributes.posterImage.tiny || null,

    title_canonical: data.attributes.canonicalTitle,
    title_native: data.attributes.titles.ja_jp.replace(/ \(korean\)/g, '') || null,
    title_latin: data.attributes.titles.en_jp || null,
    title_english: data.attributes.titles.en || null,
    title_synonyms: data.attributes.abbreviatedTitles || [],

    synopsis: data.attributes.synopsis.replace(/(\r\n|\r|\n)/g, '\n') || null,

    format: MediaFormat[data.type],
    type: MediaType[data.attributes.subtype],
    status: MediaProgress[data.type][data.attributes.status],

    episodes: parseInt(data.attributes.episodeCount) || null,
    volumes: parseInt(data.attributes.volumeCount) || null,
    chapters: parseInt(data.attributes.chapterCount) || null,
    
    score: parseInt(data.attributes.averageRating) || null,
    rating: data.attributes.ageRating ? `${data.attributes.ageRating} - ${data.attributes.ageRatingGuide}` : null,

    date_start: data.attributes.startDate ? new Date(`${data.attributes.startDate}T12:00:00Z`).toISOString() : null,
    date_end: data.attributes.endDate ? new Date(`${data.attributes.endDate}T12:00:00Z`).toISOString() : null,
    date_nextrelease: data.attributes.nextRelease ? new Date(data.attributes.nextRelease).toISOString() : null,
  }

  return dataReturn
}

module.exports = { search, map }
