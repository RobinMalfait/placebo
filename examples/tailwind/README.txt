    ┌─[./examples/tailwind/code.html]
    │
∙ 1 │   <div class="block text-gray-900 flex sm:block sm:flex">
    ·               ──┬──               ─┬──
    ·                 ╰──────────────────┴──── Colliding classes, they operate on the same "display" property.
    ·
  2 │     <div class="text-gray-100 block text-gray-100 block">Hello</div>
  3 │   </div>
    │
    └─

    ┌─[./examples/tailwind/code.html]
    │
∙ 1 │   <div class="block text-gray-900 flex sm:block sm:flex">
    ·                                        ───┬──── ───┬───
    ·                                           ╰────────┴───── Colliding classes, they operate on the same "display" property.
    ·
  2 │     <div class="text-gray-100 block text-gray-100 block">Hello</div>
  3 │   </div>
    │
    └─

    ┌─[./examples/tailwind/code.html]
    │
  1 │   <div class="block text-gray-900 flex sm:block sm:flex">
∙ 2 │     <div class="text-gray-100 block text-gray-100 block">Hello</div>
  3 │   </div>        ──────┬──────       ──────┬──────
    ·                       ╰───────────────────┴──────── Duplicate class "text-gray-100"
    ·
  5 │   <div class="underline block text-gray-100 antialiased flex line-through">
    │
    └─

    ┌─[./examples/tailwind/code.html]
    │
  1 │   <div class="block text-gray-900 flex sm:block sm:flex">
∙ 2 │     <div class="text-gray-100 block text-gray-100 block">Hello</div>
  3 │   </div>                      ──┬──               ──┬──
    ·                                 ╰───────────────────┴──── Duplicate class "block"
    ·
  5 │   <div class="underline block text-gray-100 antialiased flex line-through">
    │
    └─

    ┌─[./examples/tailwind/code.html]
    │
  2 │     <div class="text-gray-100 block text-gray-100 block">Hello</div>
  3 │   </div>
    ·
∙ 5 │   <div class="underline block text-gray-100 antialiased flex line-through">
    ·               ────┬────                                      ─────┬────── ╭─
    ·                   ╰───────────────────────────────────────────────┴───────┤ Colliding classes, they operate on
  6 │     <div class="text-gray-200 text-gray-300"></div>                       │ the same "text-decoration" property.
    ·                                                                           ╰─
    ·
  7 │     <div class="truncate text-gray-200 overflow-ellipsis overflow-scroll"></div>
  8 │   </div>
    │
    └─

    ┌─[./examples/tailwind/code.html]
    │
  2 │     <div class="text-gray-100 block text-gray-100 block">Hello</div>
  3 │   </div>
    ·
∙ 5 │   <div class="underline block text-gray-100 antialiased flex line-through">
    ·                         ──┬──                           ─┬──
    ·                           ╰──────────────────────────────┴──── Colliding classes, they operate on the same "display" property.
    ·
  6 │     <div class="text-gray-200 text-gray-300"></div>
  7 │     <div class="truncate text-gray-200 overflow-ellipsis overflow-scroll"></div>
  8 │   </div>
    │
    └─

    ┌─[./examples/tailwind/code.html]
    │
  5 │   <div class="underline block text-gray-100 antialiased flex line-through">
  6 │     <div class="text-gray-200 text-gray-300"></div>
∙ 7 │     <div class="truncate text-gray-200 overflow-ellipsis overflow-scroll"></div>
  8 │   </div>        ───┬────                                 ───────┬───────
    ·                    ╰────────────────────────────────────────────┴───────── Colliding classes, they operate on the same "overflow" property.
    │
    └─

    ┌─[./examples/tailwind/code.html]
    │
  5 │   <div class="underline block text-gray-100 antialiased flex line-through">
  6 │     <div class="text-gray-200 text-gray-300"></div>
∙ 7 │     <div class="truncate text-gray-200 overflow-ellipsis overflow-scroll"></div>
  8 │   </div>        ───┬────               ────────┬────────
    ·                    ╰───────────────────────────┴────────── Colliding classes, they operate on the same "text-overflow" property.
    │
    └─