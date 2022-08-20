What is Placebo?



It will also add these context lines, to get more insight about your code.
It can render multiple messages together.
These lines will make it easier to locate your code and know what these mesages
are about from the error messages in your terminal alone!



Sometimes you want to show the the same message on the same line. If the same
message is used on the same line, then those diagnostics will be grouped
together.



It is also possible to group related diagnostics together via a `context`
property. This is a unique identifier per `block`. This will be useful, if you
have some diagnostics that are located further away from eachother. The same
`context` will be your friend here.



We can also write messages that are very long.



Last but not least, we have the `notes` feature. You can add notes to your
diagnostics if you want to provide even more information.



Oh, and we can also add notes to different diagnostics within the same block. We can do this by
adding superscript indicators next to each message and before each note. This allows you to visually
see which note belongs to which diagnostic.

