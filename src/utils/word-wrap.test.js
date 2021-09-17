let { wordWrap } = require('./word-wrap')

it('should be possible to wrap a sentence based on a given width', () => {
  expect(wordWrap('This is a sentence that we want to split into smaller chunks.', 30)).toEqual([
    'This is a sentence',
    'that we want to split',
    'into smaller chunks.',
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
