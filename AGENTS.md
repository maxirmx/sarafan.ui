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

## Error handling

- Treat RFC 9457 `type` as the canonical machine-readable identifier for Core API failures. Never branch on localized `title`, `detail`, raw exception text, or HTTP status alone.
- Accept a Core error as structured only when its media type is `application/problem+json` and it contains a valid Sarafan `type`, matching HTTP/body `status`, Russian `title` and `detail`, `instance`, and `code`. Preserve optional `errors` and `traceId` without flattening them.
- Do not add compatibility parsing for partial Problem Details, arbitrary JSON, `msg`, legacy envelopes, or bodyless error responses. Normalize malformed or inconsistent server responses to the internal UI protocol problem.
- Send `Accept: application/json, application/problem+json` for JSON endpoints and explicit image media types plus `application/problem+json` for photo downloads.
- Use the shared `ProblemError` abstraction for API and internal failures. Components must retain the structured problem, use the shared presentation and field-error helpers, and must not render an unknown `Error.message`.
- Model browser-originated and local failures with RFC 9457 field semantics under `https://sarafan.sw.consulting/problems/ui/`, but omit `status` when no HTTP response exists and never claim the `application/problem+json` media type for an internal failure.
- Create internal problems through the centralized catalogue. Their type, code, Russian title, and safe Russian default detail are stable UI contracts; generate a unique `instance` for each occurrence.
- Keep an internal problem's original JavaScript `cause` non-enumerable and diagnostic-only. Never render, serialize, persist, or log the cause or raw payload, especially when it may contain personal data, tokens, or browser/native error text.
- Represent local and remote validation with structured `errors` collections and expose field messages through the shared helper instead of flattening them into a generic string.
- Preserve single-flight token refresh and retry an authorized request at most once. Treat only the canonical invalid-refresh-token problem type as expected session expiry; distinguish network/protocol restore failures and offer an explicit retry state.
- Route intentional suppression through a named shared policy. Version lookup and server logout failures may be suppressed after normalization; photo preview failures remain recoverable but are presented while keeping the profile form usable.
- Add tests for every new problem type, parser validation and retry branch, structured field errors, non-serialization of causes, and intentional recovery/suppression policy. New and modified code must satisfy the repository's 95% coverage thresholds.
