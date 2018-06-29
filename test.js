const Anifetch = require('./index.js')
const request = require('request-promise-native')

const init = async () => {
  var anime = await Anifetch('kitsu', 'anime', 'Darling in the FranXX')
    .catch(error => console.log(error))

  let embed = anime.map(Anifetch.DiscordEmbed)

  console.log(anime[0])
  console.log(embed[0])
  console.log('done')
}

init()
