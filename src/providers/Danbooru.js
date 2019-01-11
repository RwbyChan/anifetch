const request = require('@intrnl/fetch-request')
const { shuffleArray } = require('../snippet.js')

const booruExemptTags = ['rating:safe', 'rating:s', 'status:deleted', 'limit:200']
const booruDangerTags = ['loli', 'shota', 'toddlercon']
const booruImageExts = ['png', 'jpg', 'jpeg', 'gif']
const booruVideoExts = ['mp4', 'webm']
const booruIgnoreExts = ['zip']


async function search (tags, limit = 1) {
  tags = Array.isArray(tags) ? tags : tags.split(' ')

  const isExempt = booruExemptTags.some((i) => tags.includes(i))
  const isDanger = booruDangerTags.some((i) => tags.includes(i))

  if ((tags.length > 2 && !isExempt) || (tags.length > 3 && isExempt)) {
    throw new Error('You can only search up to two tags at a time')
  }
  if (isDanger) {
    throw new Error('You can\'t use censored tags')
  }


  let data = await request({
    method: 'GET',
    baseUrl: 'https://danbooru.donmai.us',
    url: '/posts.json',
    qs: {
      tags: tags.join(' '),
      random: true,
      limit: 200,
    },
    headers: {
      'User-Agent': 'Haru, general purpose Discord bot. gitlab:intrnl/haru',
    },
    json: true,
  })
    // Filter by usable post
    .then((data) => data.filter(post => post.file_url))
    .then((data) => data.filter(post => !post.is_banned))
    .then((data) => data.filter(post => !post.is_deleted))
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
