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



Last but not least, we have the `notes` feature. You can add notes to your
diagnostics if you want to provide even more information.
