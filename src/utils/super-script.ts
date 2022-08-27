let SUPER_SCRIPT_MAP: Record<string, string> = {
  0: '⁰',
  1: '¹',
  2: '²',
  3: '³',
  4: '⁴',
  5: '⁵',
  6: '⁶',
  7: '⁷',
  8: '⁸',
  9: '⁹',
  '(': '⁽',
  ')': '⁾',
}

export function superScript(n: string) {
  return n
    .toString()
    .split('')
    .map((c) => SUPER_SCRIPT_MAP[c] ?? c)
    .join('')
}
