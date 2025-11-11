What is Placebo?



It will also add these context lines, to get more insight about your code.
It can render multiple messages together.
These lines will make it easier to locate your code and know what these messages
are about from the error messages in your terminal alone!



Sometimes you want to show the the same message on the same line. If the same
message is used on the same line, then those diagnostics will be grouped
together.



It is also possible to group related diagnostics together via a `context`
property. This is a unique identifier per `block`. This will be useful, if you
have some diagnostics that are located further away from each other. The same
`context` will be your friend here.



We can also write messages that are very long.



Last but not least, we have the `notes` feature. You can add notes to your
diagnostics if you want to provide even more information.



Oh, and we can also add notes to different diagnostics within the same block. We can do this by
adding superscript indicators next to each message and before each note. This allows you to visually
see which note belongs to which diagnostic.



There is also a very neat feature for when the actual code itself is super long and doesn't fit on one line. In that case we also want to "wrap" the code onto multiple lines and split the diagnostics. This is done because a diagnostic could be for a single location, but if we split that location in multiple pieces it won't make sense to only highlight one piece of the puzzle.
If the line is too long but doesn't contain diagnostics then we can see those as contextual lines for more info. These line will not be wrapped, but will just be truncated at the end.
