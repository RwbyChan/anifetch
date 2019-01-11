const request = require('@intrnl/fetch-request')
const { shuffleArray } = require('../snippet.js')

const booruImageExts = ['png', 'jpg', 'jpeg', 'gif']
const booruVideoExts = ['mp4', 'webm']
const booruIgnoreExts = ['zip']

async function search (tags, limit = 1) {
  tags = Array.isArray(tags) ? tags : tags.split(' ')

  let data = await request({
    method: 'GET',
    baseUrl: 'https://yande.re',
    url: '/post.json',
    qs: {
      limit: 100,
      tags: tags.join(' ')
    },
    headers: {
      'User-Agent': 'Haru, general purpose Discord bot.',
    },
    json: true,
  })
    // Filter by usable post
    .then((data) => data.filter(post => post.file_url))
    .then((data) => data.filter(post => !booruIgnoreExts.includes(post.file_ext)))
    // Shuffle the array
    .then((data) => shuffleArray(data))
    // Splice the array
    .then((data) => data.splice(0, limit))
    // Catch the errors
    .catch((err) => { throw new Error(err) })

  return data
}

module.exports = { search }
