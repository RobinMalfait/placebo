import { InternalDiagnostic } from '~/types'
import { parseNotes } from '~/printer/parse-notes'

let diagnostic: InternalDiagnostic = {
  file: 'example.txt',
  notes: [],
  loc: { row: 1, col: 1, len: 5 },
  message: 'Example diagnostic',
}

it('should parse no notes to a notes object', () => {
  expect(parseNotes(undefined, diagnostic)).toEqual([])
})

it('should parse a string note to a notes object', () => {
  expect(parseNotes('Example notes', diagnostic)).toEqual([
    { message: 'Example notes', children: [], diagnostic },
  ])
})

it('should parse a string note with new lines to a notes object', () => {
  expect(parseNotes('Example\nnotes', diagnostic)).toEqual([
    { message: 'Example', children: [], diagnostic },
    { message: 'notes', children: [], diagnostic },
  ])
})

it('should parse a list of note strings to a notes object', () => {
  expect(parseNotes(['Note A', 'Note B'], diagnostic)).toEqual([
    { message: 'Note A', children: [], diagnostic },
    { message: 'Note B', children: [], diagnostic },
  ])
})

it('should parse nested notes to a notes object', () => {
  expect(
    parseNotes(['Note A', 'Note B', ['Note B.1.', 'Note B.2.'], 'Note C'], diagnostic)
  ).toEqual([
    { message: 'Note A', children: [], diagnostic },
    {
      message: 'Note B',
      children: [
        { message: 'Note B.1.', children: [], diagnostic },
        { message: 'Note B.2.', children: [], diagnostic },
      ],
      diagnostic,
    },
    { message: 'Note C', children: [], diagnostic },
  ])
})

it('should parse nested notes with string notes that include newlines to a notes object', () => {
  expect(parseNotes(['Note A', 'Note B', ['Note B.1.\nNote B.2.'], 'Note C'], diagnostic)).toEqual([
    { message: 'Note A', children: [], diagnostic },
    {
      message: 'Note B',
      children: [
        { message: 'Note B.1.', children: [], diagnostic },
        { message: 'Note B.2.', children: [], diagnostic },
      ],
      diagnostic,
    },
    { message: 'Note C', children: [], diagnostic },
  ])
})

it('should parse deeply nested notes to a notes object', () => {
  expect(
    parseNotes(
      [
        'Heading 1',
        ['Heading 2', ['Heading 3 A', ['A', 'B', 'C']], ['Heading 3 B', ['D', 'E', 'F']]],
      ],
      diagnostic
    )
  ).toEqual([
    {
      message: 'Heading 1',
      children: [
        {
          message: 'Heading 2',
          children: [
            {
              message: 'Heading 3 A',
              children: [
                { message: 'A', children: [], diagnostic },
                { message: 'B', children: [], diagnostic },
                { message: 'C', children: [], diagnostic },
              ],
              diagnostic,
            },
            {
              message: 'Heading 3 B',
              children: [
                { message: 'D', children: [], diagnostic },
                { message: 'E', children: [], diagnostic },
                { message: 'F', children: [], diagnostic },
              ],
              diagnostic,
            },
          ],
          diagnostic,
        },
      ],
      diagnostic,
    },
  ])
})
