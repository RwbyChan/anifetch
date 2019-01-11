const request = require('@intrnl/fetch-request')
const he = require('he')
const Fuse = require('fuse.js')

const { delay } = require('../snippet.js')


const FuseOptions = {
  shouldSort: true,
  keys: [
    { name: 'title', weight: 0.8, },

    { name: 'mal_id', weight: 0.4, },

    { name: 'description', weight: 0.2, },
  ]
}

const MediaFormat = {
  'OVA':      'Anime',
  'ONA':      'Anime',
  'TV':       'Anime',
  'Movie':    'Anime',
  'Music':    'Anime',
  'Special':  'Anime',

  'Doujin':   'Manga',
  'Manga':    'Manga',
  'Manhua':   'Manga',
  'Manhwa':   'Manga',
  'One-shot': 'Manga',

  'Novel':    'Manga', // Just so everyone is on the same line
}

const MediaType = {
  'ONA':        'Original Net Animation',
  'OVA':        'Original Video Animation',
  'TV':         'TV',
  'Movie':      'Movie',
  'Music':      'Music Video',
  'Special':    'Special',

  'Doujin':     'Doujinshi',
  'Manga':      'Manga',
  'Manhua':     'Manhua',
  'Manhwa':     'Manhwa',
  'One-shot':   'One-shot',

  'Novel':      'Novel',
}

const MediaStatus = {
  'Anime': {
    'Currently Airing':   'Currently airing',
    'Finished Airing':    'Finished airing',
    'Not yet aired':      'Upcoming',
  },
  'Manga': {
    'Publishing':         'Currently publishing',
    'Finished':           'Finished publishing',
    'Unknown':            'Unknown',
  },
}


async function search (format, term, limit = 1) {
  format = format.toLowerCase()
  if (!['anime', 'manga'].includes(format)) throw new RangeError('type must either be `anime` or `manga`')

  if (term.length < 3) throw new RangeError('term must be 3 letters or more')

  let requestOptions = {
    method: 'GET',
    baseUrl: 'https://api.jikan.moe',
    headers: {
      'User-Agent': 'Haru, general purpose Discord bot. gitlab:intrnl/haru'
    },
    json: true,
  }
  let requestFullCount = 0

  let dataBare = await request({ ...requestOptions, url: `/search/${format}/${term}`, })
    .then((data) => data.result)
    .then((data) => {
      let fuse = new Fuse(data, FuseOptions)
      let search = fuse.search(term)

      return search
    })
    .then((data) => data.splice(0, limit))
    .catch((err) => { throw new Error(err) })

  let data = []

  for (let result in dataBare) {
    result = dataBare[result]

    requestFullCount++
    if (requestFullCount > 1) await delay(750)
    let full = await request({ ...requestOptions, url: `/${format}/${result.mal_id}` })
      .catch(err => { throw new Error(err) })

    data.push(full)
  }

  let dataMapped = data.map(map)

  return dataMapped
}

function map (data) {
  let dataReturn = {
    provider_name: 'MyAnimeList',
    provider_url: 'https://myanimelist.net/',
    provider_avatar: 'https://myanimelist.net/img/common/pwa/launcher-icon-4x.png',

    id: data.mal_id.toString(),

    url: data.link_canonical,
    cover: data.image_url || null,

    title_canonical: data.title,
    title_native: data.title_japanese || null,
    title_latin: null, // Since Jikan API doesn't provide it.
    title_english: data.title_english || null,
    title_synonyms: data.title_synonyms ? data.title_synonyms.split(', ') : null,

    synopsis: data.synopsis ? he.decode(data.synopsis) : null,

    format: MediaFormat[data.type],
    type: MediaType[data.type],
    status: MediaStatus[MediaFormat[data.type]][data.status],

    episodes: parseInt(data.episodes) || null,
    volumes: parseInt(data.volumes) || null,
    chapters: parseInt(data.chapters) || null,

    score: Math.floor(parseFloat(data.score) * 10) || null,
    rating: data.rating || null,

    date_start: data.aired && data.aired.from ? new Date(data.aired.from).toISOString() : data.published && data.published.from ? new Date(data.published.from).toISOString() : null,
    date_end: data.aired && data.aired.to ? new Date(data.aired.to).toISOString() : data.published && data.published.to ? new Date(data.published.to).toISOString() : null,
    date_nextrelease: parseDate(data.broadcast, MediaStatus[MediaFormat[data.type]][data.status]),
  }

  return dataReturn
}

module.exports = { search, map }

function parseDate (broadcast, status) {
  if (!broadcast || !status) return null
  if (!status.startsWith('Currently')) return null

  let local = new Date()
  let utc = local.getTime() + (local.getTimezoneOffset() * 60000)
  let japan = new Date(utc + (3600000 * 9))

  let time = broadcast.split(' ')[2]
  let day = [
    'Sundays', 'Mondays', 'Tuesdays', 'Wednesdays', 'Thursdays', 'Fridays', 'Saturdays'
  ].indexOf(broadcast.split(' ')[0])

  let hour = parseInt(time.split(':')[0]) - 9
  let minute = parseInt(time.split(':')[1])

  let daysRemaining = (7 + day - japan.getDay()) % 7 || 7

  let nextRelease = new Date(japan)
  nextRelease.setUTCDate(japan.getUTCDate() + daysRemaining)
  nextRelease.setUTCHours(hour)
  nextRelease.setUTCMinutes(minute)
  nextRelease.setUTCSeconds(0)
  nextRelease.setUTCMilliseconds(0)

  return nextRelease.toISOString()
}
