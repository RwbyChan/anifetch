const Anifetch = require('./index.js')

const init = async () => {
  var anime = await Anifetch('anilist', 'anime', 'shingetsutan tsukihime')
    .catch(error => console.log(error))

  var processed = await Anifetch.commonfy(anime)
    .catch(error => console.log(error))

  var discordembed = await Anifetch.DiscordEmbed(processed)
    .catch(error => console.log(error))

  console.log(anime)
  console.log(processed)
  console.log(discordembed)
  console.log('done')
}

init()
