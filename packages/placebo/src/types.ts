declare const __brand: unique symbol
export type Brand<T, U extends string> = T & { readonly [__brand]: U }

export type Offset = Brand<number, 'offset'>
export type Line = Brand<number, 'line'>
export type Column = Brand<number, 'column'>

// const enum Kind {
//   Code,
//   Diagnostic,
// }
//
// const enum CodeKind {
//   Normal,
//   Whitespace,
//   ContextLine,
//   Wrapped,
// }

// export interface Cell {
//   kind: Kind
//   value: string
// }

// export const enum Kind {
/**
 * The current cell represents source code.
 */
//   Code [>       <] = 0b01,
//
/**
 * The current cell represents a diagnostic.
 */
//   Diagnosic [>  <] = 0b10,
//
/**
 * The current cell represents only leading or trailing whitespace.
 */
//   Whitespace [> <] = 0b11,
// }
//
// export const KIND_MASK = 0b11
// const KIND_MASK_BITS = bits(KIND_MASK)
//
// export const enum CodeKind {
/**
 * The current cell represents real source code that contains a diagnostic.
 */
//   RealCode [>    <] = 0b01 << KIND_MASK_BITS,
//
/**
 * The current cell represents contextual source code without any diagnostics,
 * but to provide more context around the code that has diagnostics.
 */
//   ContextLine [> <] = 0b10 << KIND_MASK_BITS,
// }
//
// export const CODE_KIND_MASK = 0b11 << bits(KIND_MASK)
//
// export const enum DiagnosticKind {
/**
 * The current cell represents a connecting diagnostic line.
 */
//   Connector [> <] = 0b01,
//
/**
 * The current cell represents a diagnostic message.
 */
//   Message [>   <] = 0b10,
// }
//
// export const DIAGNOST_KIND_MASK = 0b11 << bits(KIND_MASK)
//
/**
 * Reserve 1 byte for diagnostic IDs. This allows for 256 diagnostic IDs per
 * block. Which should be more than enough.
 */
// export const DIAGNOSTIC_ID = 0xff << bits(DIAGNOST_KIND_MASK)
//
// let x = Kind.Code | (CodeKind.RealCode << bits(KIND_MASK))

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

export type Cell = { type: Type; value: string }
export type Row = Cell[]

export interface DeepArray<T> extends Array<T | DeepArray<T>> {}
export type DeepRequired<T> = {
  [K in keyof T]-?: T[K] extends Array<infer U>
    ? DeepArray<DeepRequired<U>>
    : T[K] extends object
      ? DeepRequired<T[K]>
      : T[K]
}

export interface Location {
  /**
   * Start position of the diagnostic.
   *
   * - Line and column are 1-based. Values are **inclusive**.
   * - Offset is 0-based. Value is **inclusive**.
   */
  start:
    | {
        /**
         * Start line of the diagnostic. 1-based. Inclusive.
         */
        line: number

        /**
         * Start column of the diagnostic. 1-based. Inclusive.
         */
        column: number

        /**
         * Start offset of the diagnostic. 0-based. Inclusive.
         */
        offset: number
      }
    | {
        /**
         * Start line of the diagnostic. 1-based. Inclusive.
         */
        line: number

        /**
         * Start column of the diagnostic. 1-based. Inclusive.
         */
        column: number
      }
    | {
        /**
         * Start offset of the diagnostic. 0-based. Inclusive.
         */
        offset: number
      }

  /**
   * End position of the diagnostic.
   *
   * - Line and column are 1-based. Values are **inclusive**.
   * - Offset is 0-based. Value is **exclusive**.
   */
  end:
    | {
        /**
         * End line of the diagnostic. 1-based. Inclusive.
         */
        line: number

        /**
         * End column of the diagnostic. 1-based. Inclusive.
         */
        column: number

        /**
         * End offset of the diagnostic. 0-based. **Exclusive**.
         */
        offset: number
      }
    | {
        /**
         * End line of the diagnostic. 1-based. Inclusive.
         */
        line: number

        /**
         * End column of the diagnostic. 1-based. Inclusive.
         */
        column: number
      }
    | {
        /**
         * End offset of the diagnostic. 0-based. **Exclusive**.
         */
        offset: number
      }
}

export interface StableLocation {
  /**
   * Start position of the diagnostic.
   *
   * - Line and column are 1-based. Values are **inclusive**.
   * - Offset is 0-based. Value is **inclusive**.
   */
  start: { line: Line; column: Column; offset: Offset }

  /**
   * End position of the diagnostic.
   *
   * - Line and column are 1-based. Values are **inclusive**.
   * - Offset is 0-based. Value is **exclusive**.
   */
  end: { line: Line; column: Column; offset: Offset }
}

export type LocationOld =
  | {
      kind: 'offset'

      /**
       * The starting UTF-16 offset of the diagnostic. 0-based.
       */
      start: number

      /**
       * The ending UTF-16 offset of the diagnostic. 0-based. Inclusive.
       */
      end: number
    }
  | {
      kind: 'line-column'

      /**
       * The starting line of the diagnostic. 1-based.
       */
      startLine: number

      /**
       * The starting column of the diagnostic. 1-based.
       */
      startColumn: number

      /**
       * The ending line of the diagnostic. 1-based. Inclusive.
       */
      endLine: number

      /**
       * The ending column of the diagnostic. 1-based. Inclusive.
       */
      endColumn: number
    }

export interface InternalLocation {
  /**
   * The row location of the diagnostic. Value should be 0-based.
   */
  row: number

  /**
   * The column location of the diagnostic. Value should be 0-based.
   */
  col: number

  /**
   * The length.
   */
  len: number
}

export interface Diagnostic {
  /**
   * An absolute file path related to the diagnostic.
   *
   * We will use this as a unique identifier for the file, so we only have to
   * load the source code once per file.
   */
  file: string

  /**
   * Optional: The source code of the file related to the diagnostic.
   *
   * When this is not provided, a `source(file)` function has to be provided as
   * part of the `printer` options to retrieve the source code.
   */
  source?: string

  /**
   * The diagnostic message.
   */
  message: string

  /**
   * The location of the diagnostic.
   *
   * - This can either be UTF-16 offset based.
   * - Or line/column based, line and column are both 1-based.
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
   * Optional: Every diagnostic with the same related id will be visually connected if possible.
   */
  relatedId?: string
}

export interface StableDiagnostic extends Diagnostic {
  location: StableLocation
}

export interface InternalDiagnostic {
  file: string
  code: Row[]
  message: string
  loc: InternalLocation
  notes: (availableSpace: number) => string[]
  blockId: string | null
  relatedId: string | null

  // Things to clean up
  type?: string
  locations?: InternalLocation[]
}

// function bits(number: number): number {
//   return Math.floor(Math.log2(number) + 1)
// }
