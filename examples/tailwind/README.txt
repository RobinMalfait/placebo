
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
    ·
    ├─
    ·   NOTE: You can solve this by removing one of the duplicate classes:
    ·         ```html (diff)
    ·         - <div class="text-gray-100 block text-gray-100 block">Hello</div>
    ·         + <div class="text-gray-100 block block">Hello</div>
    ·         ```
    └─

    ┌─[./examples/tailwind/code.html]
    │
  1 │   <div class="block text-gray-900 flex sm:block sm:flex">
∙ 2 │     <div class="text-gray-100 block text-gray-100 block">Hello</div>
  3 │   </div>                      ──┬──               ──┬──
    ·                                 ╰───────────────────┴──── Duplicate class "block"
    ·
  5 │   <div class="underline block text-gray-100 antialiased flex line-through">
    ·
    ├─
    ·   NOTE: You can solve this by removing one of the duplicate classes:
    ·         ```html (diff)
    ·         - <div class="text-gray-100 block text-gray-100 block">Hello</div>
    ·         + <div class="text-gray-100 text-gray-100 block">Hello</div>
    ·         ```
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
∙  7 │     <div class="truncate text-gray-200 overflow-ellipsis overflow-scroll"></div>
   8 │   </div>        ───┬────                                 ───────┬───────
     ·                    ╰────────────────────────────────────────────┴───────── Colliding classes, they operate on the same "overflow" property.
     ·
  10 │   <div class="block text-gray-900 flex sm:block sm:flex">
     │
     └─

     ┌─[./examples/tailwind/code.html]
     │
   5 │   <div class="underline block text-gray-100 antialiased flex line-through">
   6 │     <div class="text-gray-200 text-gray-300"></div>
∙  7 │     <div class="truncate text-gray-200 overflow-ellipsis overflow-scroll"></div>
   8 │   </div>        ───┬────               ────────┬────────
     ·                    ╰───────────────────────────┴────────── Colliding classes, they operate on the same "text-overflow" property.
     ·
  10 │   <div class="block text-gray-900 flex sm:block sm:flex">
     │
     └─

     ┌─[./examples/tailwind/code.html]
     │
   7 │     <div class="truncate text-gray-200 overflow-ellipsis overflow-scroll"></div>
   8 │   </div>
     ·
∙ 10 │   <div class="block text-gray-900 flex sm:block sm:flex">
     ·               ──┬──               ─┬──
     ·                 ╰──────────────────┴──── Colliding classes, they operate on the same "display" property.
     ·
  11 │     <div class="text-gray-100 grid place-content-center text-gray-100">Hello</div>
  12 │   </div>
     │
     └─

     ┌─[./examples/tailwind/code.html]
     │
   7 │     <div class="truncate text-gray-200 overflow-ellipsis overflow-scroll"></div>
   8 │   </div>
     ·
∙ 10 │   <div class="block text-gray-900 flex sm:block sm:flex">
     ·                                        ───┬──── ───┬───
     ·                                           ╰────────┴───── Colliding classes, they operate on the same "display" property.
     ·
  11 │     <div class="text-gray-100 grid place-content-center text-gray-100">Hello</div>
  12 │   </div>
     │
     └─

     ┌─[./examples/tailwind/code.html]
     │
   8 │   </div>
     ·
  10 │   <div class="block text-gray-900 flex sm:block sm:flex">
∙ 11 │     <div class="text-gray-100 grid place-content-center text-gray-100">Hello</div>
  12 │   </div>        ──────┬──────                           ──────┬──────
     ·                       ╰───────────────────────────────────────┴──────── Duplicate class "text-gray-100"
     ·
     ├─
     ·   NOTE: You can solve this by removing one of the duplicate classes:
     ·         ```html (diff)
     ·         - <div class="text-gray-100 grid place-content-center text-gray-100">Hello</div>
     ·         + <div class="text-gray-100 grid place-content-center">Hello</div>
     ·         ```
     └─