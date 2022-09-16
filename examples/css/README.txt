
    ┌─[./examples/css/code.css]
    │
  1 │    html,
  2 │    body {
∙ 3 │      display: inline;
    ·      ───────┬────────
    · ╭───────────╯
    · │
∙ 5 │ │    width: 200px;
    · │    ──┬──
    · ├──────╯
    · │
∙ 6 │ │    height: 200px;
    · │    ──┬───
    · ╰──────┴───── "height" and "width" can't be used with "display: inline;"
    ·
  8 │      color: black;
  9 │      background-color: black;
    │
    └─

     ┌─[./examples/css/code.css]
     │
  10 │    }
     · 
  12 │    .my-row {
∙ 13 │      display: table-row;
     ·      ─────────┬─────────
     · ╭─────────────╯
     · │
∙ 14 │ │    margin-top: 2px;
     · │    ────┬─────
     · ├────────╯
     · │
∙ 15 │ │    margin-right: 3px;
     · │    ─────┬──────
     · ├─────────╯
     · │
∙ 17 │ │    float: right;
     · │    ──┬──
     · ╰──────┴──── "float", "margin-right", and "margin-top" can't be used with "display: table-row;"
     ·
  18 │    }
     · 
  20 │    .something {
     │
     └─

     ┌─[./examples/css/code.css]
     │
  18 │   }
     ·
  20 │   .something {
∙ 21 │     padding: 0px;
  22 │   }          ─┬─
     ·               ╰─── Values of 0 shouldn't have units specified.
     │
     └─