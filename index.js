const request = require('request-promise-native')

/**
 * Information given by the provider's API
 * Properties varies per provider
 *
 * @typedef {object} Anime
 *
 * @property {string} provider This is a string put by Anifetch's search function to indicate where it's coming from
 */

/**
 * This object gives a generalization on what the search function should return
 * Some properties might be listed as optional, those aren't required for the DiscordEmbed function to work
 *
 * @typedef {object}    AnimeCommon
 *
 * @property {object}   provider Contains the information about the provider that is giving the info
 * @property {string}   provider.name Name of the provider
 * @property {string}   provider.url Link to the provider's site
 * @property {string}   provider.avatar Image of the provider (logo)
 *
 * @property {object}   title The title given to the series
 * @property {string}   title.canonical Official title given to the series
 * @property {string}   title.native Native/Japanese name of the series (optional)
 * @property {string}   title.romaji Romanization/Latin of the Japanese/Native title (optional)
 * @property {string}   title.english English version of the series' title (optional)
 * @property {string[]} title.synonyms Alternative names that can be used to refer to the series, usually given by the community (optional)
 *
 * @property {string}   url Link to the series' page
 * @property {string}   cover The series' cover image (optional)
 * @property {string}   synopsis The synopsis of the series' story.
 *
 * @property {string}   format The format that the series is in, this could be Anime or Manga (optional but necessary for determining status)
 * @property {string}   type The category in which the series falls to, this could be TV, TV Short, OVA, ONA, Special, Movie, Music Video, Doujin, Manga, Manhua, Manhwa, OEL, One-shot, Novel (optional)
 *
 * @property {string}   status The current status that the series is in, this could be Currently Airing, Finished Airing, TBA, Unreleased, Upcoming, Cancelled (optional)
 * @property {number}   episodes The episode count of the series (optional)
 * @property {number}   volumes The volume count of the series (optional)
 * @property {number}   chapter THe chapter count of the series (optional)
 * @property {number}   rating The average rating that the community has given to the series (optional)
 * @property {string}   ageRating The age rating of the series (optional)
 *
 * @property {object}   date Contains date information in the series, returned as ISO 8601
 * @property {string}   date.start The date when the series started premiering (optional)
 * @property {string}   date.end The date when the series ended its premier (optional)
 * @property {string}   date.nextrelease The date of the series' next release (episode/volume/chapter) (optional)
 *
 * @example
 *  {
 *    provider: {
 *      name: "Kitsu",
 *      url: "https://kitsu.io",
 *      avatar: "https://slack-files2.s3-us-west-2.amazonaws.com/avatars/2017-07-16/213464927747_f1d4f9fb141ef6666442_512.png"
 *    },
 *    title: {
 *      canonical: "Sword Art Online: Alternative Gun Gale Online",
 *      native: "ソードアート・オンライン オルタナティブ ガンゲイル・オンライン",
 *      romaji: "Sword Art Online: Alternative Gun Gale Online",
 *      english: null,
 *      synonyms: ["SAO Alternative Gun Gale Online"]
 *    },
 *
 *    url: "https://kitsu.io/anime/sword-art-online-alternative-gun-gale-online",
 *    cover: "https://media.kitsu.io/anime/poster_images/13894/original.png?1517428846",
 *    synopsis: "Karen Kohiruimaki always felt out of place in the real world…",
 *
 *    format: "Anime",
 *    type: "TV",
 *    status: "Currently Airing",
 *    episodes: 24,
 *    rating: 73.58,
 *    ageRating: "PG",
 *
 *    date: {
 *      start: "2018-04-08T12:00:00.000Z",
 *      end: "2018-06-30T12:00:00.000Z",
 *      nextrelease: "2018-6-09T12:00:00.000Z"
 *    }
 *  }
 */

/**
 * A Discord embed object
 *
 * @typedef DiscordEmbed
 * @see {@link https://discordapp.com/developers/docs/resources/channel#embed-object} for further information
 */

/**
 * Searches for anime/manga information through a provider with a given search term and returns the top result
 *
 * @param {string} provider Provider to search from
 * @param {string} type The type of series to look for, this could be anime or manga
 * @param {string} searchterm The search term to look for
 *
 * @return {promise} A promise with the series information as an object
 *
 * @example
 *  Anifetch.search("kitsu", "anime", "Darling in the FranXX")
 *  // returns a promise with an object containing information for Darling in the FranXX anime
 */
function search (provider, type, searchterm) {
  return new Promise((resolve, reject) => {
    var mediatype = ['anime', 'manga']

    provider = provider.toLowerCase()
    type = type.toLowerCase()

    if (typeof provider !== 'string') { return reject(new AnifetchError('`provider` must be a string')) }
    if (typeof searchterm !== 'string') { return reject(new AnifetchError('`searchterm` must be a string')) }
    if (typeof type !== 'string') { return reject(new AnifetchError('`type` must be a string')) }
    if (mediatype.indexOf(type) < 0) { return reject(new AnifetchError('`type` must be either `anime` or `manga`')) }

    switch (provider) {
      case 'kitsu':
        resolve(searchKitsu(type, searchterm))
        break
      case 'anilist':
        resolve(searchAniList(type, searchterm))
        break
      default:
        reject(new AnifetchError('provider not supported'))
        break
    }
  })
}

/**
 * Searches Kitsu for series information
 *
 * @param {string} type The type of series to search on Kitsu
 * @param {string} searchterm Search term to use for searching on Kitsu
 *
 * @return {Promise} Response from Kitsu's API
 *
 * @private
 */
function searchKitsu (type, searchterm) {
  return new Promise((resolve, reject) => {
    var endpoint = 'https://kitsu.io/api/edge'
    var searchurl

    switch (type) {
      case 'anime':
        searchurl = `${endpoint}/anime?page[limit]=20&filter[text]=${searchterm}`
        break
      case 'manga':
        searchurl = `${endpoint}/manga?page[limit]=20&filter[text]=${searchterm}`
        break
      default:
        reject(new AnifetchError("type not provided, this shouldn't be seen."))
        break
    }

    request.get({
      url: searchurl,
      headers: {
        'User-Agent': 'Anifetch, A node package for searching anime and manga info (git:intrnl)',
        'Accept': 'application/vnd.api+json',
        'Content-Type': 'application/vnd.api+json'
      },
      json: true
    })
      .then(searchdata => {
        var data = searchdata.data[0].attributes

        if (!data) return reject(new AnifetchError("doesn't seem to return anything"))

        data.provider = 'kitsu'
        resolve(data)
      })
      .catch(err => reject(new AnifetchError(err.error.message || err.error)))
  })
}

/**
 * Searches AniList for series information
 *
 * @param {string} type The type of series to search on AniList
 * @param {string} searchterm Search term to use for searching on AniList
 *
 * @return {Promise} Response from AniList's API
 *
 * @private
 */
function searchAniList (type, searchterm) {
  return new Promise((resolve, reject) => {
    var endpoint = 'https://graphql.anilist.co'
    var query = `
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
    var queryvariables = {
      'type': type.toUpperCase(),
      'query': searchterm
    }

    request.post({
      url: endpoint,
      headers: {
        'User-Agent': 'Anifetch, A node package for searching anime and manga info (git:intrnl)',
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        'query': query,
        'variables': queryvariables
      })
    })
      .then(searchdata => {
        var data = JSON.parse(searchdata)
        data = data['data']['Page']['media'][0]

        if (!data) return reject(new AnifetchError("doesn't seem to return anything"))

        data.provider = 'anilist'
        resolve(data)
      })
      .catch(err => reject(new AnifetchError(err.error.message || err.error)))
  })
}

/**
 * Takes an object taken from Anifetch's search function and returns a generalized series information
 *
 * @param {Anime} data Object containing series information fetched from Anifetch's search function
 *
 * @return {AnimeCommon} Object containing generalized series information
 */
function commonfy (data) {
  return new Promise((resolve, reject) => {
    if (!data.provider) return reject(new AnifetchError("this doesn't seem it was generated from Anifetch!"))

    switch (data.provider) {
      case 'kitsu':
        resolve(commonfyKitsu(data))
        break
      case 'anilist':
        resolve(commonfyAniList(data))
        break
      default:
        reject(new AnifetchError("this data doesn't appear to be generated from Anifetch"))
        break
    }
  })
}

/**
 * Returns a generalized series information from Kitsu's API
 *
 * @param {Anime} data Object generated by Anifetch from Kitsu's API
 *
 * @return {AnimeCommon} Object containing generalized series information
 *
 * @private
 */
function commonfyKitsu (data) {
  return new Promise((resolve, reject) => {
    if (data.provider !== 'kitsu') { return reject(new AnifetchError("this doesn't seem to be coming from kitsu's api!")) }

    var returndata = {
      provider: {},
      title: {},
      date: {}
    }

    returndata.provider.name = 'Kitsu'
    returndata.provider.url = 'https://kitsu.io'
    returndata.provider.avatar = 'https://avatars1.githubusercontent.com/u/7648832'

    returndata.title.canonical = data.canonicalTitle
    if (data.titles.ja_jp) returndata.title.native = data.titles.ja_jp
    if (data.titles.en_jp) returndata.title.romaji = data.titles.en_jp
    if (data.titles.en) returndata.title.english = data.titles.en
    if (data.abbreviatedTitles) returndata.title.synonyms = data.abbreviatedTitles

    returndata.url = `${returndata.provider.url}/anime/${data.slug}`
    returndata.cover = data.posterImage.original || data.posterImage.large || data.posterImage.medium || data.posterImage.small || data.posterImage.tiny || null
    returndata.synopsis = data.synopsis

    switch (data.subtype) {
      case 'ONA':
        returndata.type = 'ONA'
        returndata.format = 'Anime'
        break
      case 'OVA':
        returndata.type = 'OVA'
        returndata.format = 'Anime'
        break
      case 'TV':
        returndata.type = 'TV'
        returndata.format = 'Anime'
        break
      case 'movie':
        returndata.type = 'Movie'
        returndata.format = 'Anime'
        break
      case 'music':
        returndata.type = 'Music Video'
        returndata.format = 'Anime'
        break
      case 'special':
        returndata.type = 'Special'
        returndata.format = 'Anime'
        break
      case 'doujin':
        returndata.type = 'Doujin'
        returndata.format = 'Manga'
        break
      case 'manga':
        returndata.type = 'Manga'
        returndata.format = 'Manga'
        break
      case 'manhua':
        returndata.type = 'Manhua'
        returndata.format = 'Manga'
        break
      case 'manhwa':
        returndata.type = 'Manhwa'
        returndata.format = 'Manga'
        break
      case 'oel':
        returndata.type = 'OEL'
        returndata.format = 'Manga'
        break
      case 'oneshot':
        returndata.type = 'One-shot'
        returndata.format = 'Manga'
        break
      case 'novel': // Don't know why Kitsu puts this in the manga section, really.
        returndata.type = 'Novel'
        returndata.format = 'Manga'
        break
      default:
        returndata.type = null
        break
    }
    switch (data.status) {
      case 'current':
        if (returndata.format === 'Anime') returndata.status = 'Currently Airing'
        if (returndata.format === 'Manga') returndata.status = 'Currently Publishing'
        break
      case 'finished':
        if (returndata.format === 'Anime') returndata.status = 'Finished Airing'
        if (returndata.format === 'Manga') returndata.status = 'Finished Publishing'
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
    if (data.episodeCount) returndata.episodes = parseInt(data.episodeCount)
    if (data.volumeCount) returndata.volumes = parseInt(data.volumeCount)
    if (data.chapterCount) returndata.chapters = parseInt(data.chapterCount)
    if (data.averageRating) returndata.rating = parseInt(data.averageRating)
    if (data.ageRating) returndata.ageRating = data.ageRating

    if (data.startDate) returndata.date.start = new Date(`${data.startDate}T12:00:00Z`).toISOString()
    if (data.endDate) returndata.date.end = new Date(`${data.endDate}T12:00:00Z`).toISOString()
    if (data.nextRelease) returndata.date.nextrelease = new Date(data.nextRelease).toISOString()

    return resolve(returndata)
  })
}

/**
 * Returns a generalized series information from AniList's API
 *
 * @param {Anime} data Object generated by Anifetch from AniList's API
 *
 * @return {AnimeCommon} Object containing generalized series information
 *
 * @private
 */
function commonfyAniList (data) {
  return new Promise((resolve, reject) => {
    if (data.provider !== 'anilist') { return reject(new AnifetchError("this doesn't seem to be coming from anilist's api!")) }

    var returndata = {
      provider: {},
      title: {},
      date: {}
    }

    returndata.provider.name = 'AniList'
    returndata.provider.url = 'https://anilist.co'
    returndata.provider.avatar = 'https://avatars3.githubusercontent.com/u/18018524'

    returndata.title.canonical = data.title.romaji || data.title.english || data.title.native // AniList doesn't provide a canonical title, opting for user preferred instead.
    if (data.title.native) returndata.title.native = data.title.native
    if (data.title.romaji) returndata.title.romaji = data.title.romaji
    if (data.title.english) returndata.title.english = data.title.english
    if (data.synonyms && data.synonyms !== '') returndata.title.synonyms = data.title.synonyms

    returndata.url = `${returndata.provider.url}/anime/${data.id}`
    returndata.cover = data.coverImage.large || data.coverImage.medium || null
    returndata.synopsis = data.description.replace(/(\n|<i>|<\/i>|<b>|<\/b>)/g, '').replace(/<br>/g, '\n')

    switch (data.format) {
      case 'TV':
        returndata.type = 'TV'
        returndata.format = 'Anime'
        break
      case 'TV_SHORT':
        returndata.type = 'TV Short'
        returndata.format = 'Anime'
        break
      case 'MOVIE':
        returndata.type = 'Movie'
        returndata.format = 'Anime'
        break
      case 'SPECIAL':
        returndata.type = 'Special'
        returndata.format = 'Anime'
        break
      case 'OVA':
        returndata.type = 'OVA'
        returndata.format = 'Anime'
        break
      case 'ONA':
        returndata.type = 'ONA'
        returndata.format = 'Anime'
        break
      case 'MUSIC':
        returndata.type = 'Music Video'
        returndata.format = 'Anime'
        break
      case 'MANGA':
        returndata.type = 'Manga'
        returndata.format = 'Manga'
        break
      case 'NOVEL':
        returndata.type = 'Novel'
        returndata.format = 'Manga'
        break
      case 'ONESHOT':
        returndata.type = 'One-shot'
        returndata.format = 'Manga'
        break
      default:
        returndata.type = null
        break
    }
    switch (data.status) {
      case 'FINISHED':
        if (returndata.format === 'Anime') returndata.status = 'Finished Airing'
        if (returndata.format === 'Manga') returndata.status = 'Finished Publishing'
        break
      case 'RELEASING':
        if (returndata.format === 'Anime') returndata.status = 'Currently Airing'
        if (returndata.format === 'Manga') returndata.status = 'Currently Publishing'
        break
      case 'NOT_YET_RELEASED': // Documentation says this is for anime that is "To be released at a later date", seems kinda vague.
        returndata.status = 'Upcoming' // Not sure if this goes to TBA, Upcoming, or Unreleased.
        break
      case 'CANCELLED':
        returndata.status = 'Cancelled'
        break
    }
    if (data.episodes) returndata.episodes = parseInt(data.episodes)
    if (data.volumes) returndata.volumes = parseInt(data.volumes)
    if (data.chapters) returndata.chapters = parseInt(data.chapters)
    if (data.averageScore) returndata.rating = parseInt(data.averageScore)
    // AniList doesn't provide age ratings

    if (data.startDate.day) returndata.date.start = new Date(data.startDate.year, data.startDate.month, data.startDate.day).toISOString()
    if (data.endDate.day) returndata.date.end = new Date(data.endDate.year, data.endDate.month, data.endDate.day).toISOString()
    if (data.nextAiringEpisode) returndata.date.nextrelease = new Date(data.nextAiringEpisode.airingAt * 1000).toISOString()

    resolve(returndata)
  })
}

/**
 * Converts the generalized series information into a doable Discord embed
 *
 * @param {AnimeCommon} data AnimeCommon object to pass through
 *
 * @return {DiscordEmbed} Returns a Discord embed object
 */
function DiscordEmbed (data) {
  return new Promise((resolve, reject) => {
    if (!data) return reject(new AnifetchError("you didn't provide a data"))

    if (!data.provider.name) { return reject(new AnifetchError('`provider.name` missing')) }
    if (!data.provider.url) { return reject(new AnifetchError('`provider.url` missing')) }
    if (!data.provider.avatar) { return reject(new AnifetchError('`provider.avatar` missing')) }
    if (!data.title.canonical) { return reject(new AnifetchError('`title.canonical` missing')) }
    if (!data.url) { return reject(new AnifetchError('`url` missing')) }
    if (!data.synopsis) { return reject(new AnifetchError('`synopsis` missing')) }

    const embed = {
      'author': {},
      'thumbnail': {},
      'fields': [],
      'footer': {}
    }

    embed.author.name = data.provider.name
    embed.author.url = data.provider.url
    embed.author.icon_url = data.provider.avatar

    embed.title = data.title.canonical
    embed.url = data.url

    var descriptionData = []
    if (data.title.native) descriptionData.push(`Native: ${data.title.native}`)
    if (data.title.romaji) descriptionData.push(`Romaji: ${data.title.romaji}`)
    if (data.title.english) descriptionData.push(`English: ${data.title.english}`)
    if (data.title.synonyms) descriptionData.push(`Other names: ${truncateText(data.title.synonyms.join(', '), 50)}`)
    if (data.synopsis) descriptionData.push('\n' + truncateText(data.synopsis, 256))
    embed.description = descriptionData.join('\n')

    if (data.cover) embed.thumbnail.url = data.cover

    if (data.type) objectPush(embed.fields, { 'name': 'Type', 'value': data.type, 'inline': true })
    if (data.status) objectPush(embed.fields, { 'name': 'Status', 'value': data.status, 'inline': true })
    if (data.episodes) objectPush(embed.fields, { 'name': 'Episodes', 'value': data.episodes, 'inline': true })
    if (data.volumes) objectPush(embed.fields, { 'name': 'Volumes', 'value': data.volumes, 'inline': true })
    if (data.chapters) objectPush(embed.fields, { 'name': 'Chapters', 'value': data.chapters, 'inline': true })
    if (data.rating) objectPush(embed.fields, { 'name': 'Rating', 'value': data.rating, 'inline': true })
    if (data.ageRating) objectPush(embed.fields, { 'name': 'Age Rating', 'value': data.ageRating, 'inline': true })

    if (data.format === 'Anime') {
      if (data.date.start) embed.footer.text = `Aired from ${dateConvert(data.date.start)} to ${dateConvert(data.date.end) || '-'}`
      if (data.date.start === data.date.end) embed.footer.text = `Aired in ${dateConvert(data.date.start)}`
      if (data.date.start && data.status === 'Currently Airing') embed.footer.text = `Airing from ${dateConvert(data.date.start)}`
      if (data.date.start && data.status === 'Unreleased') embed.footer.text = `Airing in ${dateConvert(data.date.start)}`
    }
    if (data.format === 'Manga') {
      if (data.date.start) embed.footer.text = `Published from ${dateConvert(data.date.start)} to ${dateConvert(data.date.end) || '-'}`
      if (data.date.start === data.date.end) embed.footer.text = `Published in ${dateConvert(data.date.start)}`
      if (data.date.start && data.status === 'Currently Publishing') embed.footer.text = `Publishing from ${dateConvert(data.date.start)}`
      if (data.date.start && data.status === 'Unreleased') embed.footer.text = `Publishing in ${dateConvert(data.date.start)}`
    }

    if (data.dateNextRelease) embed.timestamp = data.dateNextRelease

    return resolve(embed)
  })
}

/**
 * Custom error type
 *
 * @param {string} message Error message to throw
 *
 * @private
 */
function AnifetchError (message) {
  this.name = 'AnifetchError'
  this.message = message || 'Error message not specified'
  this.stack = (new Error()).stack
}
AnifetchError.prototype = Object.create(Error.prototype)
AnifetchError.prototype.constructor = AnifetchError

/**
 * Converts date into "mmm d, yyyy"
 *
 * @param {(string|object)} date Anything that can be interpreted by the date object
 *
 * @return {string} Returns the date as a string
 */
function dateConvert (date) {
  if (!date) return false

  var month = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  date = new Date(date)

  if (!date.getDate || !date.getMonth || !date.getFullYear) return

  return `${month[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`
}

/**
 * Putting objects within arrays
 *
 * @param {array}  array Array to push
 * @param {object} object Object to put
 *
 * @private
 *
 * @example
 *  var testdata = []
 *
 *  objectPush(testdata, { "name": "Hello world!", "value": "foo bar" })
 *  objectPush(testdata, { "name": "foo bar", "value": "Hello world!" })
 *  // testdata now contains 2 objects
 */
function objectPush (array, object) {
  var length = array.length
  array[length] = object
}

/**
 * Returns a truncated string of specified length
 * @param {string} text The text to truncate
 * @param {number} n Length of the text before it gets truncated
 */
function truncateText (text, n) {
  return (text.length > n) ? text.substr(0, n - 1) + '\u2026' : text
}

module.exports = search // allows shorthand use of `Anifetch(provider, ...)`
module.exports.search = search // what it should've been
module.exports.commonfy = commonfy
module.exports.DiscordEmbed = DiscordEmbed
