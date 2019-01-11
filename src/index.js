const AnimeProviders = {
  Kitsu: require('./providers/Kitsu.js'),
  AniList: require('./providers/AniList.js'),
  MyAnimeList: require('./providers/MyAnimeList.js'),
}
const BooruProviders = {
  Danbooru: require('./providers/Danbooru.js'),
  Gelbooru: require('./providers/Gelbooru.js'),
  Yandere: require('./providers/yande.re.js'),
}

function searchAnime (provider, format, term, limit = 1) {
  let provide = provider.toLowerCase()

  let availProviders = {}
  for (let prov in AnimeProviders) { availProviders[prov.toLowerCase()] = AnimeProviders[prov] }

  if (!provider) throw new Error('provider must be defined')
  if (typeof provider !== 'string') throw new TypeError('provider must be a string')
  if (!availProviders[provide]) throw new RangeError('provider not supported')

  return availProviders[provide].search(format, term, limit)
}

function searchBooru (provider, tags, limit = 1) {
  let provide = provider.toLowerCase()

  let availProviders = {}
  for (let prov in BooruProviders) { availProviders[prov.toLowerCase()] = AnimeProviders[prov] }

  if (!provider) throw new Error('provider must be defined')
  if (typeof provider !== 'string') throw new TypeError('provider must be a string')
  if (!availProviders[provide]) throw new RangeError('provider not supported')

  return availProviders[provide].search(tags, limit)
}

module.exports = searchAnime
module.exports.searchAnime = searchAnime
module.exports.searchBooru = searchBooru
module.exports.providers = { ...AnimeProviders, ...BooruProviders }
