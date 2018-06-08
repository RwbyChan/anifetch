# anifetch
A node package for searching anime and manga info

## Installation

```
$ npm i --save anifetch
```

## Usage

```js
const anifetch = require('anifetch')

const init = async () => {
  let kitsu = await anifetch.search('kitsu', 'anime', 'darling in the franxx')
  .then(anifetch.commonfy)
  .catch(err => {
    if (err.name === 'AnifetchError') {
      // Error thrown out by the package.
      console.log(err.message)
    } else {
      // Did I mess this up?
      console.log(err)
    }
  })

  let anilist = await anifetch.search('anilist', 'manga', 'byousoku 5 centimeter')
    .then(anifetch.commonfy)
    .catch(err => {
      if (err.name === 'AnifetchError') {
        console.log(err.message)
      } else {
        console.log(err)
      }
    })

  console.log(`Name: ${kitsu.title.canonical}, Format: ${kitsu.format}, URL: ${kitsu.url}`)
  console.log(`Name: ${anilist.title.canonical}, Format: ${anilist.format}, URL: ${anilist.url}`)
}

init()
```

## Planned

- Support for handling and returning arrays for search and commonfy function