# anifetch

A node package for searching your usual weeb stuff

## Usage

### Search

- `anifetch.searchAnime(provider, format, searchterm, limit)`
  - `provider` The [provider](#anime-and-manga-info) to search with
  - `format` The series format, could be `anime` or `manga`
  - `searchterm` The term to search for
  - `[limit = 1]` Results to show

- `anifetch.searchBooru(provider, tags, limit)`
  - `provider` The [provider](#booru) to search with
  - `tags` The search tags, could be a string with tags separated by space or an array of strings
  - `[limit = 1]` Results to show

- `anifetch.providers`   
  All of the providers' functions

## Supported providers

### Anime and manga info

- Kitsu
- AniList
- MyAnimeList

### Booru

- Danbooru
- Gelbooru
- yande.re

## Why?

Originally, this package was made to standardize the data returns coming from searching anime and manga. Making each provider return the data in a format you expect makes things easier to handle.

Now it has been rewritten and also support searching boorus!

*the booru providers mostly return data in mostly the same format, so having it standardized here doesn't seem to be necessary, for now.*
