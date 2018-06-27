const Anifetch = require('./index.js')

const init = async () => {
  var anime = await Anifetch('kitsu', 'anime', 'darling in the franxx')
    .catch(error => console.log(error))

  let embed = anime.map(Anifetch.DiscordEmbed)

  console.log(anime)
  console.log(embed)
  console.log('done')
}

init()
