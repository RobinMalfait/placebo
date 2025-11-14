import { describe, expect, it } from 'vitest'
import { render } from '../printer/printer.test'
import type { Diagnostic } from '../types'
import { findLocation, findLocations } from './find-location'

const html = String.raw

describe('findLocation', () => {
  it('should find a location using a regex', async () => {
    let source = 'abc'
    let diagnostics: Diagnostic[] = [
      {
        file: 'example.txt',
        source,
        message: 'Found "b"',
        location: findLocation(source, { regex: /b/g })!,
      },
    ]

    let result = await render(source, [diagnostics])

    expect(result).toMatchInlineSnapshot(`
      "
      ┌────────────────────────────────────────────────────────────────────────────────────────────────────┐
      │    ┌─[./example.txt]                                                                               │
      │    │                                                                                               │
      │∙ 1 │   abc                                                                                         │
      │    ·    ┬                                                                                          │
      │    ·    ╰── Found "b"                                                                              │
      │    │                                                                                               │
      │    └─                                                                                              │
      └────────────────────────────────────────────────────────────────────────────────────────────────────┘
      "
    `)
  })

  it('should be possible to filter matches based on some condition', async () => {
    let source = html`
      <div class="flex"></div>
      <div class="block"></div>
      <div class="inline-block">
        <div class="block"></div>
      </div>
    `
    let diagnostics: Diagnostic[] = [
      {
        file: 'example.txt',
        source,
        message: 'Found a class attribute with value "block"',
        location: findLocation(source, {
          regex: /class="(.*)"/g,
          test: ([_, className]) => className === 'block',
        })!,
      },
    ]

    let result = await render(source, [diagnostics])

    expect(result).toMatchInlineSnapshot(`
      "
      ┌────────────────────────────────────────────────────────────────────────────────────────────────────┐
      │    ┌─[./example.txt]                                                                               │
      │    │                                                                                               │
      │  2 │   <div class="flex"></div>                                                                    │
      │∙ 3 │   <div class="block"></div>                                                                   │
      │    ·        ──────┬──────                                                                          │
      │    ·              ╰──────── Found a class attribute with value "block"                             │
      │    ·                                                                                               │
      │  4 │   <div class="inline-block">                                                                  │
      │  5 │     <div class="block"></div>                                                                 │
      │  6 │   </div>                                                                                      │
      │    │                                                                                               │
      │    └─                                                                                              │
      └────────────────────────────────────────────────────────────────────────────────────────────────────┘
      "
    `)
  })

  it('should be possible to highlight a specific part of the match', async () => {
    let source = html`
      <div class="flex"></div>
      <div class="block"></div>
      <div class="inline-block">
        <div class="block"></div>
      </div>
    `
    let diagnostics: Diagnostic[] = [
      {
        file: 'example.txt',
        source,
        message: 'Found a class attribute with value "block"',
        location: findLocation(source, {
          regex: /class="(.*)"/g,
          test: ([_, className]) => className === 'block',
          highlight: ([_, className]) => className,
        })!,
      },
    ]

    let result = await render(source, [diagnostics])

    expect(result).toMatchInlineSnapshot(`
      "
      ┌────────────────────────────────────────────────────────────────────────────────────────────────────┐
      │    ┌─[./example.txt]                                                                               │
      │    │                                                                                               │
      │  2 │   <div class="flex"></div>                                                                    │
      │∙ 3 │   <div class="block"></div>                                                                   │
      │    ·               ──┬──                                                                           │
      │    ·                 ╰──── Found a class attribute with value "block"                              │
      │    ·                                                                                               │
      │  4 │   <div class="inline-block">                                                                  │
      │  5 │     <div class="block"></div>                                                                 │
      │  6 │   </div>                                                                                      │
      │    │                                                                                               │
      │    └─                                                                                              │
      └────────────────────────────────────────────────────────────────────────────────────────────────────┘
      "
    `)
  })
})

describe('findLocations', () => {
  it('should find multiple locations using a regex', async () => {
    let source = 'foo bar baz FOO BAR BAZ'
    let diagnostics: Diagnostic[] = findLocations(source, { regex: /foo/gi }).map((location) => {
      return {
        file: 'example.txt',
        source,
        message: 'Found "foo"',
        location,
      }
    })
    let result = await render(source, [diagnostics])

    expect(result).toMatchInlineSnapshot(`
      "
      ┌────────────────────────────────────────────────────────────────────────────────────────────────────┐
      │    ┌─[./example.txt]                                                                               │
      │    │                                                                                               │
      │∙ 1 │   foo bar baz FOO BAR BAZ                                                                     │
      │    ·   ─┬─         ─┬─                                                                             │
      │    ·    ╰───────────┴─── Found "foo"                                                               │
      │    │                                                                                               │
      │    └─                                                                                              │
      └────────────────────────────────────────────────────────────────────────────────────────────────────┘
      "
    `)
  })

  it('should be possible to filter matches based on some condition', async () => {
    let source = html`
      <div class="flex"></div>
      <div class="block"></div>
      <div class="inline-block">
        <div class="block"></div>
      </div>
    `
    let diagnostics: Diagnostic[] = findLocations(source, {
      regex: /class="(.*)"/gi,
      test: ([_, className]) => className === 'block',
    }).map((location) => {
      return {
        file: 'example.txt',
        source,
        blockId: 'block-class',
        message: 'Found a class attribute with value "block"',
        location,
      }
    })

    let result = await render(source, [diagnostics])

    expect(result).toMatchInlineSnapshot(`
      "
      ┌────────────────────────────────────────────────────────────────────────────────────────────────────┐
      │    ┌─[./example.txt]                                                                               │
      │    │                                                                                               │
      │  2 │   <div class="flex"></div>                                                                    │
      │∙ 3 │   <div class="block"></div>                                                                   │
      │    ·        ──────┬──────                                                                          │
      │    ·              ╰──────── Found a class attribute with value "block"                             │
      │    ·                                                                                               │
      │  4 │   <div class="inline-block">                                                                  │
      │∙ 5 │     <div class="block"></div>                                                                 │
      │  6 │   </div> ──────┬──────                                                                        │
      │    ·                ╰──────── Found a class attribute with value "block"                           │
      │    │                                                                                               │
      │    └─                                                                                              │
      └────────────────────────────────────────────────────────────────────────────────────────────────────┘
      "
    `)
  })

  it('should be possible to highlight a specific part of the match', async () => {
    let source = html`
      <div class="flex"></div>
      <div class="block"></div>
      <div class="inline-block">
        <div class="block"></div>
      </div>
    `
    let diagnostics: Diagnostic[] = findLocations(source, {
      regex: /class="(.*)"/gi,
      test: ([_, className]) => className === 'block',
      highlight: ([_, className]) => className,
    }).map((location) => {
      return {
        file: 'example.txt',
        source,
        blockId: 'block-class',
        message: 'Found a class attribute with value "block"',
        location,
      }
    })

    let result = await render(source, [diagnostics])

    expect(result).toMatchInlineSnapshot(`
      "
      ┌────────────────────────────────────────────────────────────────────────────────────────────────────┐
      │    ┌─[./example.txt]                                                                               │
      │    │                                                                                               │
      │  2 │   <div class="flex"></div>                                                                    │
      │∙ 3 │   <div class="block"></div>                                                                   │
      │    ·               ──┬──                                                                           │
      │    ·                 ╰──── Found a class attribute with value "block"                              │
      │    ·                                                                                               │
      │  4 │   <div class="inline-block">                                                                  │
      │∙ 5 │     <div class="block"></div>                                                                 │
      │  6 │   </div>        ──┬──                                                                         │
      │    ·                   ╰──── Found a class attribute with value "block"                            │
      │    │                                                                                               │
      │    └─                                                                                              │
      └────────────────────────────────────────────────────────────────────────────────────────────────────┘
      "
    `)
  })
})
