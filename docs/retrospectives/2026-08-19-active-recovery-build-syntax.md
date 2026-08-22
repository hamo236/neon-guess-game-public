# Retrospective: Active Match Recovery Build Syntax

## Incident

A status map in `ActiveMatchRecoveryCard.jsx` used `retryable-error` as an unquoted JavaScript object key. The deterministic source smoke checks passed because they checked behavior markers but did not parse or bundle the file. Production Vite/esbuild caught the syntax error.

## Repair

The key is now quoted as `'retryable-error'`. A smoke assertion protects the exact syntax contract, while the production build gate verifies the complete module graph.

## Reusable rule

For every new status, mode, or Firebase-derived string key containing punctuation, add both a source-level assertion and a real build verification. Never treat a passing text-based smoke suite as proof that JSX/JavaScript parses or bundles successfully.

## Evidence rule

When shell output is empty or ambiguous, run a file-backed diagnostic that captures the actual exception before classifying the problem as environment-only. This incident demonstrates why build failures must be reproduced through the real bundler.
