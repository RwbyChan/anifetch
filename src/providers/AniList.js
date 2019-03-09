const request = require('@intrnl/fetch-request')
const he = require('he')
const Fuse = require('fuse.js')


const FuseOptions = {
  shouldSort: true,
  keys: [
    { name: 'title.english', weight: 0.8, },

    { name: 'title.native', weight: 0.6, },
    { name: 'title.romaji', weight: 0.6, },

    { name: 'id', weight: 0.4, },

    { name: 'description', weight: 0.2, },
  ]
}

const AnifetchQuery = [
  'query ($query: String, $type: MediaType) {',
  '  Page {',
  '    media(search: $query, type: $type) {',
  '      id',
  '      title {',
  '        romaji',
  '        english',
  '        native',
  '      }',
  '      trailer {',
  '        id',
  '        site',
  '      }',
  '      startDate {',
  '        year',
  '        month',
  '        day',
  '      }',
  '      endDate {',
  '        year',
  '        month',
  '        day',
  '      }',
  '      coverImage {',
  '        large',
  '        medium',
  '      }',
  '      genres',
  '      type',
  '      format',
  '      status',
  '      episodes',
  '      volumes',
  '      chapters',
  '      description',
  '      averageScore',
  '      synonyms',
  '      nextAiringEpisode {',
  '        airingAt',
  '      }',
  '    } ',
  '  }',
  '}',
].join('\n')

const MediaFormat = {
  ANIME: 'Anime',
  MANGA: 'Manga',
}

const MediaType = {
  OVA: 'Original Video Animation',
  ONA: 'Original Net Animation',
  TV: 'TV',
  TV_SHORT: 'TV Short',
  MOVIE: 'Movie',
  MUSIC: 'Music Video',
  SPECIAL: 'Special',

  MANGA: 'Manga',
  ONESHOT: 'One-shot',

  NOVEL: 'Novel',
}

const MediaStatus = {
  ANIME: {
    RELEASING: 'Currently airing',
    FINISHED: 'Finished airing',
    NOT_YET_RELEASED: 'Upcoming',
    CANCELLED: 'Cancelled',
  },
  MANGA: {
    RELEASING: 'Currently publishing',
    FINISHED: 'Finished publishing',
    NOT_YET_RELEASED: 'Upcoming',
    CANCELLED: 'Cancelled',
  }
}

async function search (format, term, limit = 1) {
  format = format.toLowerCase()
  if (!['anime', 'manga'].includes(format)) throw new RangeError('type must either be `anime` or `manga`')

  let data = await request({
    method: 'POST',
    url: 'https://graphql.anilist.co',
    headers: {
      'User-Agent': 'Haru, general purpose Discord bot. gitlab:intrnl/haru',
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      query: AnifetchQuery,
      variables: {
        type: format.toUpperCase(),
        query: term,
      },
    }),
    json: true,
  })
    .then((data) => data['data']['Page']['media'])
    .then((data) => {
      let fuse = new Fuse(data, FuseOptions)
      let search = fuse.search(term)

      return search
    })
    .then((data) => data.splice(0, limit))
    .catch((err) => { throw new Error(err) })

  let dataMapped = data.map(map)

  return dataMapped
}

function map (data) {
  let dataReturn = {
    provider_name: 'AniList',
    provider_url: 'https://anilist.co/',
    provider_avatar: 'https://avatars3.githubusercontent.com/u/18018524',

    id: data.id,

    url: `https://anilist.co/${data.type.toLowerCase()}/${data.id}`,
    cover: data.coverImage.large || data.coverImage.medium || null,
    trailerSource: (data.trailer == null ? null : data.trailer.site),
    trailer: (data.trailer == null ? null : (data.trailer.site == "youtube" ? `https://www.${data.trailer.site}.com/watch?v=${data.trailer.id}` : (data.trailer.site == "dailymotion" ? `https://www.dailymotion.com/video/${data.trailer.id}` : null))),
    genres: data.genres,

    title_canonical: data.title.english || data.title.romaji || data.title.native, // AniList doesn't have canonical titles
    title_native: data.title.native || null,
    title_latin: data.title.romaji || null,
    title_english: data.title.english || null,
    title_synonyms: data.synonyms || null,

    synopsis: data.description ? he.decode(data.description).replace(/<br>/g, '\n').replace(/<\/?\w>/g, '').replace(/\n\n/g, '\n') : null,

    format: MediaFormat[data.type],
    type: MediaType[data.format],
    status: MediaStatus[data.type][data.status],

    episodes: data.episodes || null,
    volumes: data.volumes || null,
    chapters: data.chapters || null,

    score: data.averageScore || null,
    rating: null, // AniList doesn't have age ratings

    date_start: data.startDate.day ? new Date(data.startDate.year, data.startDate.month - 1, data.startDate.day).toISOString() : null,
    date_end: data.endDate.day ? new Date(data.endDate.year, data.endDate.month - 1, data.endDate.day).toISOString() : null,
    date_nextrelease: data.nextAiringEpisode && data.nextAiringEpisode.airingAt ? new Date(data.nextAiringEpisode.airingAt * 1000).toISOString() : null,
  }

  return dataReturn
}

module.exports = { search, map }
