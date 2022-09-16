// TODO: Replace with `String.dedent`
export function dedent(input: string) {
  let lines = input.split('\n')
  let amount = Math.min(
    ...lines.map((line) => {
      let idx = line.search(/[^\s]/g)
      if (idx === -1) return Infinity
      return idx
    })
  )
  return lines
    .map((line) => line.slice(amount))
    .join('\n')
    .trim()
}
