export function* range(start: number, end?: number, step = 1) {
  if (!end) {
    end = start
    start = 0
  }

  for (let i = start; i < end; i += step) yield i
}
