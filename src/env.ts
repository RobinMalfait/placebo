export let env = {
  // The amount of lines before and after the current line to give more context
  // to the user.
  BEFORE_CONTEXT_LINES_COUNT: parseNumberEnv('PLACEBO_CONTEXT_LINES_BEFORE', 3),
  AFTER_CONTEXT_LINES_COUNT: parseNumberEnv('PLACEBO_CONTEXT_LINES_AFTER', 3),

  // Whether or not you want syntax highlighting for the context lines
  COLOR_CONTEXT_LINES: parseBooleanEnv('PLACEBO_COLOR_CONTEXT_LINES', false),

  // Print width to make everything fit as good as possible
  PRINT_WIDTH: parseNumberEnv('PLACEBO_PRINT_WIDTH', process.stdout.columns),
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
