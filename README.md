# anifetch
A node package for searching anime and manga info.   
Currently supports Kitsu, AniList, MyAnimeList as a provider.

## Installation

```
$ npm i --save anifetch
```

## Usage

You should look at the `test.js` file in the repository for a simplification on how it works, though I would pretty much recommend just looking up the main `index.js` file.

## But why?

Each providers gives their own unique data returns, however, you would have to deal with different property naming scheme, different date formats etc.

This module attempts to provide consistent data returns from those providers, having a standardized data structure makes things simple.
