module.exports.delay = function (ms) {
  return new Promise((res) => setTimeout(res, ms))
}

module.exports.shuffleArray = function (array) {
  var currentIndex = array.length, temporaryValue, randomIndex

  while (0 !== currentIndex) {
    randomIndex = Math.floor(Math.random() * currentIndex)
    currentIndex -= 1

    temporaryValue = array[currentIndex]
    array[currentIndex] = array[randomIndex]
    array[randomIndex] = temporaryValue
  }

  return array
}

module.exports.truncateText = function (text, n) {
  return (text.length > n) ? text.substring(0, n - 1) + '\u2026' : text
}

module.exports.convertDate = function (date) {
  if (!date) return false

  var month = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  date = new Date(date)

  if (!date.getDate || !date.getMonth || !date.getFullYear) return

  return `${month[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`
}
