const Anifetch = require('./index.js')

const init = async () => {
  var anime = await Anifetch('anilist', 'anime', 'mekakucity actors')
    .catch(error => console.log(error))

  let embed = anime.map(Anifetch.DiscordEmbed)

  console.log(anime)
  console.log(embed)
  console.log('done')
}

init()
