# anifetch
A node package for searching anime and manga info.   
Currently supports Kitsu, AniList, MyAnimeList as a provider.

## Installation

```
$ npm i --save anifetch
```

## Usage

### Search

- `anifetch.search(provider, type, searchterm)` Returns an array of generalized object.

  Example code that searches for `Darling in the FranXX` anime from Kitsu then logs the first result to console.

  ```js
  const anifetch = require('anifetch')

  anifetch.search('kitsu', 'anime', 'darling in the franxx')
    .then(results => {
      console.log(results[0])
    })
  ```

The search function is designed to be as barebone as possible, so I would rather recommend you to write your own and use the maps below to convert them into generalized object.

### Map

As this module is mainly for returning search data in a generalized forms, there would of course be maps for converting them from the original search result data.

- `anifetch.Kitsu` - Mapping for Kitsu's official API
- `anifetch.AniList` - Mapping for AniList's official GraphQL API
- `anifetch.MAL` - Mapping for Jikan's search results
- `anifetch.MALFull` - Mapping for Jikan's full anime page

This module also provides a mapping for a basic Discord embed (`anifetch.DiscordEmbed`)

As for the example code, I don't think there needs to be one, you just need to pass your arrays (with `.map()`) or object to it.

### Miscellaneous notes

While the above pretty much covers what this module does, I'd recommend poking in the `index.js` file just in case. Feel free to make contributions as to how I could make the code better overall. I'll accept them with my open hearts <3

## But why?

Each providers gives their own unique data returns, however, you would have to deal with different property naming scheme, different date formats etc.

This module attempts to provide consistent data returns from those providers, having a standardized data structure makes things simple.
