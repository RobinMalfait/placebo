export interface DeepArray<T> extends Array<T | DeepArray<T>> {}

export type Location = [
  /** The row location of the diagnostic. Value should be 1-based. */
  [startLine: number, startColumn: number],
  /** The column location of the diagnostic. Value should be 1-based. */
  [endLine: number, endColumn: number],
]

export interface InternalLocation {
  /** The row location of the diagnostic. Value should be 1-based. */
  row: number

  /** The column location of the diagnostic. Value should be 1-based. */
  col: number

  /** The length. */
  len: number
}

export interface Diagnostic {
  /** The file path for the current diagnostic. */
  file: string

  /** The diagnostic message. */
  message: string

  /** The location of the diagnostic. */
  location: Location

  /** Optional notes with additional information about the current diagnostic. */
  notes?: string

  /**
   * An optional string identifier, each diagnostic with the same block value will be grouped and
   * rendered within the same block.
   */
  block?: string

  /**
   * An optional string identifier, each diagnostic with the same context will be visually connected
   * with each other.
   */
  context?: string
}

export interface InternalDiagnostic {
  file: string
  message: string
  loc: InternalLocation
  notes: (availableSpace: number) => string[]
  block: string | null
  context: string | null

  // Things to clean up
  type?: string
  locations?: InternalLocation[]
}
