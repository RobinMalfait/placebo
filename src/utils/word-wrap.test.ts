import { wordWrap } from '~/utils/word-wrap'

it('should be possible to wrap a sentence based on a given width', () => {
  expect(wordWrap('This is a sentence that we want to split into smaller chunks.', 30)).toEqual([
    'This is a sentence',
    'that we want to split',
    'into smaller chunks.',
  ])
})

it('should optimize real world examples', () => {
  // This is a little bit odd because we asked for `15`, but the longest word `"text-decoration"` is
  // `17` characters long. Currently we will just take this value as the width instead otherwise it
  // won't split at all.
  // TODO: Look into even smarter ways to do this.
  expect(
    wordWrap('Colliding classes, they operate on the same "text-decoration" property.', 15)
  ).toEqual([
    'Colliding',
    'classes,',
    'they operate',
    'on the same',
    '"text-decoration"',
    'property.',
  ])
})

it('should optimize the word wrap by minimum raggedness', () => {
  /**
   * Input: AAA BB CC DDDDD
   *     N: 6
   *
   * Initial algorithm would produce:
   *
   *   AAA BB
   *   CC
   *   DDDDD
   *
   * While the optimized algorithm should produce:
   *
   *   AAA
   *   BB CC
   *   DDDDD
   */
  expect(wordWrap('AAA BB CC DDDDD', 6)).toEqual(['AAA', 'BB CC', 'DDDDD'])
})
