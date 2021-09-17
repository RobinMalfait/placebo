// TODO: We can probably optimize this algorithm, sometimes it makes more
// sentence to push a word onto the next line even if there is enough room,
// because that could mean that the overal length is smaller in the end. I
// think.
module.exports.wordWrap = function wordWrap(text, maxWidth) {
  let words = text.split(' ')
  let sentence = ''
  let sentences = []
  for (let word of words) {
    if (sentence.length + word.length <= maxWidth) {
      sentence += ' ' + word
    } else {
      sentences.push(sentence.trim())
      sentence = word
    }
  }

  if (sentence.length > 0) {
    sentences.push(sentence.trim())
  }

  return sentences
}
