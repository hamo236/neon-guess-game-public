# Retrospective — Lobby Accessibility Audit — 2026-08-19

## Symptom
Join Room labels were visually present but not programmatically associated with their inputs.

## Established root cause
The JSX used `<label>` elements without matching `htmlFor` and input `id` attributes.

## Wrong assumption to avoid
A passing static smoke suite for aria states does not prove complete form labeling. Accessibility contracts must cover both the label and the target input.

## Successful intervention
Added stable IDs `join-name` and `join-code`, associated labels with `htmlFor`, and added smoke assertions for both pairs.

## Evidence
`npm.cmd test` passed with exit 0 after the repair. Second-pass source review found no duplicate imports or malformed attribute patterns. Production build remains blocked by the environment error recorded in `baseline-build.log`: `Could not determine Node.js install directory`.

## Remaining uncertainty
No live browser, screen-reader, or Firebase multi-client verification was available.

## Regression-prevention rule
For every Lobby input, require an explicit accessible name through a real `<label htmlFor>/<input id>` pair or an equivalent ARIA naming contract, and protect the pairing with a deterministic assertion.
