export const env = {
  NO_COLOR: parseBooleanEnv('NO_COLOR', false),

  // Debug
  DEBUG: parseDebugEnv(),
}

export function parseNumberEnv(name: string, defaultValue: number) {
  if (typeof process === 'undefined') return defaultValue

  let valueAsNumber = Number(process.env[name] ?? defaultValue)
  return Number.isNaN(valueAsNumber) ? defaultValue : valueAsNumber
}

export function parseBooleanEnv(name: string, defaultValue: boolean) {
  if (typeof process === 'undefined') return defaultValue

  let value = process.env[name] ?? defaultValue
  if (value === '1' || value === 'true') return true
  if (value === '0' || value === 'false') return false

  return Boolean(value)
}

// More info about conventions: https://github.com/debug-js/debug#conventions
function parseDebugEnv() {
  if (typeof process === 'undefined') return false

  let debug = process.env.DEBUG

  if (debug === undefined) return false

  // Environment variables are strings, so convert to boolean
  if (debug === 'true' || debug === '1') return true
  if (debug === 'false' || debug === '0') return false

  // Keep the debug convention into account:
  // DEBUG=* -> This enables all debug modes
  // DEBUG=projectA,projectB,projectC -> This enables debug for projectA, projectB and projectC
  // DEBUG=projectA:* -> This enables all debug modes for projectA (if you have sub-types)
  // DEBUG=projectA,-projectB -> This enables debug for projectA and explicitly disables it for projectB

  if (debug === '*') return true
  let debuggers = debug.split(',').map((d) => d.split(':')[0])

  // Ignoring placebo
  if (debuggers.includes('-placebo')) return false

  // Including placebo
  if (debuggers.includes('placebo')) return true

  return false
}
