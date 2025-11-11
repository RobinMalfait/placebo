export enum Type {
  None = 0,

  // Code
  Code = 1 << 0,
  Whitespace = 1 << 1,
  ContextLine = 1 << 2,
  Wrapped = 1 << 3,

  // Diagnostics
  Diagnostic = 1 << 4,
  DiagnosticVerticalConnector = 1 << 5,

  // Notes
  Note = 1 << 6,
  StartOfNote = 1 << 7,
}

export type Item = { type: Type; value: string }[]

export interface DeepArray<T> extends Array<T | DeepArray<T>> {}

export type Location = [
  /**
   * The row location of the diagnostic. Value should be 1-based.
   */
  [startLine: number, startColumn: number],
  /**
   * The column location of the diagnostic. Value should be 1-based.
   */
  [endLine: number, endColumn: number],
]

export interface InternalLocation {
  /**
   * The row location of the diagnostic. Value should be 1-based.
   */
  row: number

  /**
   * The column location of the diagnostic. Value should be 1-based.
   */
  col: number

  /**
   * The length.
   */
  len: number
}

export interface Diagnostic {
  /**
   * The file path for the diagnostic.
   */
  file: string

  /**
   * Optional: The source code of the file related to the diagnostic.
   *
   * When this is not provided, a `source(filePath)` function has to be provided
   * as part of the `printer` options to retrieve the source code.
   */
  source?: string

  /**
   * The diagnostic message.
   */
  message: string

  /**
   * The location of the diagnostic.
   */
  location: Location

  /**
   * Optional: additional information about the diagnostic. Will be rendered in
   * a separate notes section.
   */
  notes?: string

  /**
   * Optional: Every diagnostic with the same block id will be rendered in the
   * same diagnostic block.
   */
  blockId?: string

  /**
   * Optional: Every diagnostic with the same diagnostic id will be visually connected if possible.
   */
  diagnosticId?: string
}

export interface InternalDiagnostic {
  file: string
  source: Item[]
  message: string
  loc: InternalLocation
  notes: (availableSpace: number) => string[]
  blockId: string | null
  diagnosticId: string | null

  // Things to clean up
  type?: string
  locations?: InternalLocation[]
}
