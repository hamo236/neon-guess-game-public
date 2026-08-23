# Avatar research notes

## Decision
Use a small local deterministic SVG avatar catalog rather than a remote avatar API. This avoids runtime network dependency, avoids third-party tracking, keeps the bundle predictable, and lets each player receive a distinct neon-compatible visual identity from their stable player ID. The avatar is presentation data; player ID, name, roles, room membership, and gameplay state remain authoritative elsewhere.

## External evidence

1. DiceBear documents an open-source SVG avatar library and HTTP API with multiple styles: https://www.dicebear.com/guides/avatar-library-comparison/
2. DiceBear documents seed-driven avatar generation and how many combinations are available: https://www.dicebear.com/guides/how-many-unique-avatars/
3. DiceBear documents programmatic access to style options: https://www.dicebear.com/guides/access-all-available-options/

## Application to NEON GUESS

The project does not need to add a remote dependency because the requested use case is a bounded lobby roster of at most four players. A local catalog of eight SVG avatars is sufficient for distinct 1v1, 2v2, and Four lobby cards, is lighter and more reliable than fetching images, and preserves the existing neon visual language through cyan, violet, pink, and lime accents. Mapping is deterministic from the existing player ID so reconnects and cross-client renders select the same avatar without changing Firebase identity or authorization.

## Motion/a11y guardrails

Avatar entry should not add continuous or decorative animation. Any existing row transitions must remain scoped to transform/opacity/color and honor reduced-motion preferences. Images need meaningful alt text or a nearby player name; decorative SVG layers should be aria-hidden.

## Security boundary

Avatar selection is cosmetic and must not be trusted for identity, authorization, scoring, room membership, target privacy, or match progression. Existing player IDs and Firebase rules remain unchanged.

Status: research captured; implementation decision is local deterministic SVG catalog with fallback support for legacy player records.

Author: Manus AI
Date: 2026-08-23

## References

- [1] [DiceBear avatar library comparison](https://www.dicebear.com/guides/avatar-library-comparison/)
- [2] [DiceBear unique avatar combinations](https://www.dicebear.com/guides/how-many-unique-avatars/)
- [3] [DiceBear programmatic style options](https://www.dicebear.com/guides/access-all-available-options/)

## Reference note

The sources support the general design choice of seed-driven SVG avatar generation. The local catalog and exact neon styling are project-specific engineering decisions, not claims made by the sources.

**Implementation caveat:** The current room manager stores a legacy remote `avatar` URL on player objects. The safe migration path is to add a UI resolver that prefers a deterministic local avatar for lobby rendering while retaining the legacy field for compatibility, or to add an `avatarId` cosmetic field only if the project's existing Firebase schema and regression tests permit it. No player identity or security rule should be derived from the avatar.

## Source quality note

Search result snippets were used only to locate the public DiceBear reference pages. The pages should be opened/extracted before any final research report cites specific factual claims beyond the notes above.
