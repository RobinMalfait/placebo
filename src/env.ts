export let env = {
  // The amount of lines before and after the current line to give more context
  // to the user.
  BEFORE_CONTEXT_LINES_COUNT: parseNumberEnv('PLACEBO_CONTEXT_LINES_BEFORE', 3),
  AFTER_CONTEXT_LINES_COUNT: parseNumberEnv('PLACEBO_CONTEXT_LINES_AFTER', 3),

  // Whether or not you want syntax highlighting for the context lines
  COLOR_CONTEXT_LINES: parseBooleanEnv('PLACEBO_COLOR_CONTEXT_LINES', false),

  // Print width to make everything fit as good as possible
  PRINT_WIDTH: parseNumberEnv('PLACEBO_PRINT_WIDTH', process.stdout.columns),

  // Debug
  DEBUG: parseDebugEnv(),
}

function parseNumberEnv(name: string, defaultValue: number) {
  let valueAsNumber = Number(process.env[name] ?? defaultValue)
  return isNaN(valueAsNumber) ? defaultValue : valueAsNumber
}

function parseBooleanEnv(name: string, defaultValue: boolean) {
  let value = process.env[name] ?? defaultValue
  if (value === '1' || value === 'true') return true
  if (value === '0' || value === 'false') return false

  return Boolean(value)
}

// More info about conventions: https://github.com/debug-js/debug#conventions
function parseDebugEnv() {
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
