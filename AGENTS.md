<!--
Copyright (C) 2026 Maxim [maxirmx] Samsonov (www.sw.consulting)
All rights reserved.
This file is a part of the Sarafan application
-->

# Repository instructions

## Copyright headers

- Add the Sarafan copyright header to every file you create or modify whenever the file format safely supports comments.
- Use the comment syntax appropriate for the file type. Keep shebangs, encoding declarations, XML declarations, and other required first-line directives before the header.
- Do not add a header where comments are unsupported or would alter behavior, and do not modify generated files, dependency files, build output, coverage output, lockfiles, or binary files solely to add a header.
- Preserve an existing copyright or license header instead of adding a duplicate.

For JavaScript and other files that support `//` comments, use:

```js
// Copyright (C) 2026 Maxim [maxirmx] Samsonov (www.sw.consulting)
// All rights reserved.
// This file is a part of the Sarafan application
```

For other comment-capable formats, use the same three lines with that format's native comment syntax.
