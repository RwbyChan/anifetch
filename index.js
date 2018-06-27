const request = require('request-promise-native')
const he = require('he')

module.exports = SearchAnime
module.exports.search = SearchAnime
module.exports.embed = DiscordEmbed
module.exports.DiscordEmbed = MapDiscordEmbed

/**
 * Searches for anime/manga information through a provider with a given search term
 * and returns an array of commonfied search result
 * 
 * @param {String} provider    The provider to use
 * @param {String} type        The type of series to search
 * @param {String} searchterm  What to search
 */
function SearchAnime (provider, type, searchterm) {
  return new Promise((resolve, reject) => {
    provider = provider.toLowerCase()

    switch (provider) {
      case 'kitsu':
        resolve(SearchKitsu(type, searchterm))
        break
      case 'anilist':
        resolve(SearchAniList(type, searchterm))
        break
      default:
        reject(new Error('provider not supported.'))
        break
    }
  })
}

/**
 * Takes the commonfied search data and returns an array of Discord's embeds,
 * basically just a function to use if you don't want to use `Array.prototype.map()`
 * with `Anifetch.DiscordEmbed`
 * 
 * @param {Object[]} data Array of commonfied search results
 */
function DiscordEmbed (data) {
  return new Promise((resolve, reject) => {
    let returndata = data.map(MapDiscordEmbed)

    resolve(returndata)
  })
}

/**
 * Searches Kitsu for series information
 * 
 * @param {String} type        The type of series to search
 * @param {String} searchterm  What to search
 */
function SearchKitsu (type, searchterm) {
  return new Promise((resolve, reject) => {
    let supportedType = ['anime', 'manga']
    if (supportedType.indexOf(type) < 0) throw new Error(`Invalid type, must be ${supportedType.map(type => `'${type}'`).join(', ')}`)

    let endpointURL = 'https://kitsu.io/api/edge'
    let endpointConstructedURL = `${endpointURL}/${type}?page[limit]=20&filter[text]=${searchterm}`

    request.get({
      url: endpointConstructedURL,
      headers: {
        'User-Agent': 'Anifetch, a node package for searching anime and manga.',
        'Accept': 'application/vnd.api+json',
        'Content-Type': 'application/vnd.api+json'
      },
      json: true
    })
      .catch(err => reject(new Error(err)))
      .then(searchdata => {
        let data = searchdata.data
          .map(MapKitsu)

        resolve(data)
      })
  })
}

/**
 * Searches AniList for series information
 * 
 * @param {String} type        The type of series to search
 * @param {String} searchterm  What to search
 */
function SearchAniList (type, searchterm) {
  return new Promise((resolve, reject) => {
    let supportedType = ['anime', 'manga']
    if (supportedType.indexOf(type) < 0) throw new Error(`Invalid type, must be ${supportedType.map(type => `'${type}'`).join(', ')}`)

    let endpointURL = 'https://graphql.anilist.co'

    let querydata = `
    query ($query: String, $type: MediaType) {
      Page {
        media(search: $query, type: $type) {
          id
          title {
            romaji
            english
            native
          }
          startDate {
            year
            month
            day
          }
          endDate {
            year
            month
            day
          }
          coverImage {
            large
            medium
          }
          format
          status
          episodes
          volumes
          chapters
          description
          averageScore
          synonyms
          nextAiringEpisode {
            airingAt
          }
        } 
      }
    }
    `
    let queryvariables = {
      'type': type.toUpperCase(),
      'query': searchterm
    }

    request.post({
      url: endpointURL,
      headers: {
        'User-Agent': 'Anifetch, a node package for searching anime and manga.',
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        'query': querydata,
        'variables': queryvariables
      })
    })
      .catch(err => reject(new Error(err)))
      .then(searchdata => {
        let data = JSON.parse(searchdata)
        data = data['data']['Page']['media']
          .map(MapAniList)

        resolve(data)
      })
  })
}

/**
 * Turns a commonfied search data object to something that can be used by Discord's embeds
 * 
 * @param {Object} data The commonfied search data object
 */
function MapDiscordEmbed (data) {
  const embed = {
    author: {},
    thumbnail: {},
    fields: [],
    footer: {}
  }

  embed.author.name = data.provider_name
  embed.author.url = data.provider_url
  embed.author.icon_url = data.provider_avatar

  embed.title = data.title_canonical
  embed.url = data.url

  let description = []
  if (data.title_native) description.push(`Native: ${data.title_native}`)
  if (data.title_romaji) description.push(`Romaji: ${data.title_romaji}`)
  if (data.title_english) description.push(`English: ${data.title_english}`)
  if (data.title_synonyms) description.push(`Other names: ${truncateText(data.title_synonyms.join(', '), 50)}`)
  if (data.synopsis) description.push('\n' + truncateText(data.synopsis, 256))
  embed.description = description.join('\n')

  if (data.cover) embed.thumbnail.url = data.cover

  if (data.type) embed.fields.push({ 'name': 'Type', 'value': data.type, 'inline': true })
  if (data.status) embed.fields.push({ 'name': 'Status', 'value': data.status, 'inline': true })
  if (data.episodes) embed.fields.push({ 'name': 'Episodes', 'value': data.episodes, 'inline': true })
  if (data.volumes) embed.fields.push({ 'name': 'Volumes', 'value': data.volumes, 'inline': true })
  if (data.chapters) embed.fields.push({ 'name': 'Chapters', 'value': data.chapters, 'inline': true })
  if (data.rating) embed.fields.push({ 'name': 'Rating', 'value': data.rating, 'inline': true })
  if (data.ageRating) embed.fields.push({ 'name': 'Age Rating', 'value': data.ageRating, 'inline': true })

  if (data.format === 'Anime') {
    if (data.date_start) embed.footer.text = `Aired from ${dateConvert(data.date_start)} to ${dateConvert(data.date_end) || '-'}`
    if (data.date_start === data.date_end) embed.footer.text = `Aired in ${dateConvert(data.date_start)}`
    if (data.date_start && data.status === 'Currently Airing') embed.footer.text = `Airing from ${dateConvert(data.date_start)}`
    if (data.date_start && (data.status === 'Unreleased' || data.status === 'Upcoming')) embed.footer.text = `Airing in ${dateConvert(data.date_start)}`
  }
  if (data.format === 'Manga') {
    if (data.date_start) embed.footer.text = `Published from ${dateConvert(data.date_start)} to ${dateConvert(data.date_end) || '-'}`
    if (data.date_start === data.date_end) embed.footer.text = `Published in ${dateConvert(data.date_start)}`
    if (data.date_start && data.status === 'Currently Publishing') embed.footer.text = `Publishing from ${dateConvert(data.date_start)}`
    if (data.date_start && (data.status === 'Unreleased' || data.status === 'Upcoming')) embed.footer.text = `Publishing in ${dateConvert(data.date_start)}`
  }

  if (data.date_nextrelease) embed.timestamp = data.date_nextrelease

  return embed
}

/**
 * Turns a raw search data object from Kitsu to a commonfied search data object
 * 
 * @param {Object} data The raw search data object
 */
function MapKitsu (data) {
  let returndata = {}

  returndata.provider_name = 'Kitsu'
  returndata.provider_url = 'https://kitsu.io'
  returndata.provider_avatar = 'https://avatars1.githubusercontent.com/u/7648832'

  returndata.title_canonical = data.attributes.canonicalTitle
  if (data.attributes.titles.ja_jp) returndata.title_native = data.attributes.titles.ja_jp
  if (data.attributes.titles.en_jp) returndata.title_romaji = data.attributes.titles.en_jp
  if (data.attributes.titles.en) returndata.title_english = data.attributes.titles.en
  if (data.attributes.abbreviatedTitles) returndata.title_synonyms = data.attributes.abbreviatedTitles

  returndata.id = data.id
  returndata.slug = data.attributes.slug

  returndata.url = `${returndata.provider_url}/${data.type}/${data.attributes.slug}`
  returndata.cover = data.attributes.posterImage.original || data.attributes.posterImage.large || data.attributes.posterImage.medium || data.attributes.posterImage.small || data.attributes.posterImage.tiny || null
  returndata.synopsis = data.attributes.synopsis.replace(/(\r\n|\r|\n)/g, '\n')

  switch (data.type) {
    case 'anime':
      returndata.format = 'Anime'
      break
    case 'manga':
      returndata.format = 'Manga'
      break
  }

  switch (data.attributes.subtype) {
    // Anime
    case 'ONA':
      returndata.type = 'ONA'
      break
    case 'OVA':
      returndata.type = 'OVA'
      break
    case 'TV':
      returndata.type = 'TV'
      break
    case 'movie':
      returndata.type = 'Movie'
      break
    case 'music':
      returndata.type = 'Music Video'
      break
    case 'special':
      returndata.type = 'Special'
      break

    // Manga
    case 'doujin':
      returndata.type = 'Doujin'
      break
    case 'manga':
      returndata.type = 'Manga'
      break
    case 'manhua':
      returndata.type = 'Manhua'
      break
    case 'manhwa':
      returndata.type = 'Manhwa'
      break
    case 'oel':
      returndata.type = 'OEL'
      break
    case 'oneshot':
      returndata.type = 'One-shot'
      break
    case 'novel': // Don't know why Kitsu puts this in the manga section, really.
      returndata.type = 'Novel'
      break
  }

  switch (data.status) {
    case 'current':
      returndata.status = 'Ongoing'
      if (data.type === 'anime') returndata.status = 'Currently Airing'
      if (data.type === 'manga') returndata.status = 'Currently Publishing'
      break
    case 'finished':
      returndata.status = 'Finished'
      if (data.type === 'anime') returndata.status = 'Finished Airing'
      if (data.type === 'manga') returndata.status = 'Finished Publishing'
      break
    case 'tba':
      returndata.status = 'TBA'
      break
    case 'unreleased':
      returndata.status = 'Unreleased'
      break
    case 'upcoming':
      returndata.status = 'Upcoming'
      break
  }

  if (data.attributes.episodeCount) returndata.episodes = parseInt(data.attributes.episodeCount)
  if (data.attributes.volumeCount) returndata.volumes = parseInt(data.attributes.volumeCount)
  if (data.attributes.chapterCount) returndata.chapters = parseInt(data.attributes.chapterCount)
  if (data.attributes.averageRating) returndata.rating = parseInt(data.attributes.averageRating)
  if (data.attributes.ageRating) returndata.ageRating = `${data.attributes.ageRating} - ${data.attributes.ageRatingGuide}`

  if (data.attributes.startDate) returndata.date_start = new Date(`${data.attributes.startDate}T12:00:00Z`).toISOString()
  if (data.attributes.endDate) returndata.date_end = new Date(`${data.attributes.endDate}T12:00:00Z`).toISOString()
  if (data.attributes.nextRelease) returndata.date_nextrelease = new Date(data.attributes.nextRelease).toISOString()

  return returndata
}

/**
 * Turns a raw search data object from AniList to a commonfied search data object
 * 
 * @param {Object} data The raw search data object
 */
function MapAniList (data) {
  let returndata = {}

  returndata.provider_name = 'AniList'
  returndata.provider_url = 'https://anilist.co'
  returndata.provider_avatar = 'https://avatars3.githubusercontent.com/u/18018524'

  returndata.title_canonical = data.title_romaji || data.title_english || data.title_native // AniList doesn't provide a canonical title, opting for user preferred instead.
  if (data.title_native) returndata.title_native = data.title_native
  if (data.title_romaji) returndata.title_romaji = data.title_romaji
  if (data.title_english) returndata.title_english = data.title_english
  if (data.synonyms && data.synonyms !== '') returndata.title_synonyms = data.title_synonyms

  returndata.id = data.id

  returndata.url = `${returndata.provider.url}/anime/${data.id}`
  returndata.cover = data.coverImage.large || data.coverImage.medium || null

  returndata.synopsis = he.decode(data.description)
    .replace(/(\n|<i>|<\/i>|<b>|<\/b>)/g, '')
    .replace(/<br>/g, '\n')

  switch (data.type) {
    case 'ANIME':
      returndata.format = 'Anime'
      break
    case 'MANGA':
      returndata.format = 'Manga'
      break
  }

  switch (data.format) {
    // Anime
    case 'TV':
      returndata.type = 'TV'
      break
    case 'TV_SHORT':
      returndata.type = 'TV Short'
      break
    case 'MOVIE':
      returndata.type = 'Movie'
      break
    case 'SPECIAL':
      returndata.type = 'Special'
      break
    case 'OVA':
      returndata.type = 'OVA'
      break
    case 'ONA':
      returndata.type = 'ONA'
      break
    case 'MUSIC':
      returndata.type = 'Music Video'
      break

    // Manga
    case 'MANGA':
      returndata.type = 'Manga'
      break
    case 'NOVEL':
      returndata.type = 'Novel'
      break
    case 'ONESHOT':
      returndata.type = 'One-shot'
      break
  }

  switch (data.status) {
    case 'RELEASING':
      returndata.status = 'Ongoing'
      if (data.type === 'ANIME') returndata.status = 'Currently Airing'
      if (data.type === 'MANGA') returndata.status = 'Currently Publishing'
      break
    case 'FINISHED':
      returndata.status = 'Finished'
      if (data.type === 'ANIME') returndata.status = 'Finished Airing'
      if (data.type === 'MANGA') returndata.status = 'Finished Publishing'
      break
    case 'NOT_YET_RELEASED':
      returndata.status = 'Upcoming'
      break
    case 'CANCELLED':
      returndata.status = 'Cancelled'
      break
  }

  if (data.episodes) returndata.episodes = parseInt(data.episodes)
  if (data.volumes) returndata.volumes = parseInt(data.volumes)
  if (data.chapters) returndata.chapters = parseInt(data.chapters)
  if (data.averageScore) returndata.rating = parseInt(data.averageScore)

  if (data.startDate.day) returndata.date_start = new Date(data.startDate.year, data.startDate.month, data.startDate.day).toISOString()
  if (data.endDate.day) returndata.date_end = new Date(data.endDate.year, data.endDate.month, data.endDate.day).toISOString()
  if (data.nextAiringEpisode) returndata.date_nextrelease = new Date(data.nextAiringEpisode.airingAt * 1000).toISOString()

  return returndata
}

/**
 * Returns a truncated string of specific length
 * 
 * @param {String} text  Text to truncate
 * @param {Number} n     Length of text before it gets truncated
 */
function truncateText (text, n) {
  return (text.length > n) ? text.substr(0, n - 1) + '\u2026' : text
}

/**
 * Converts date into "mmmm d, yyyy"
 * 
 * @param {(String|Object)} date Date object
 */
function dateConvert (date) {
  if (!date) return false

  var month = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  date = new Date(date)

  if (!date.getDate || !date.getMonth || !date.getFullYear) return

  return `${month[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`
}
