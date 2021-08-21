module.exports.range = function* range(start, end, step = 1) {
  if (!end) {
    end = start
    start = 0
  }

  for (let i = start; i < end; i += step) yield i
}
