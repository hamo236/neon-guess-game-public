# Four / Guest Card / Chat Investigation

- Active project: `/home/ubuntu/neon_guess_publish`
- Scope lock: remove Guest Card from the Four gameplay presentation; preserve gameplay, target privacy, Firebase authority, routes, scoring, timers, rounds, and synchronization.
- SOURCE VERIFIED: `src/components/game/OpponentTargetCard.jsx` renders a full glass-panel article with title, visibility badge, target image, name, explanatory copy, and decorative divider.
- SOURCE VERIFIED: `src/pages/GameBoardPage.jsx:445` renders `OpponentTargetCard` in the shared game screen. The same page also renders the bottom chat drawer at lines 491+.
- SOURCE VERIFIED: `GameBoardPage.jsx` already uses `target.image` and `target.name` for the target presentation. Missing image behavior is not yet root-caused; asset selection/privacy logic is protected and must not be changed during visual repair.
- SOURCE VERIFIED: chat writing currently exists through `GameStateContext.sendChatMessage` / `submitQuestion` and `syncSendChatMessage` for the GameState flow.
- SOURCE VERIFIED: `CompetitiveModeContext.jsx` has no `sendChatMessage` action and its Firebase adapter has no chat path in the inspected action list. Therefore making synchronized chat appear in Four/2v2 requires a new Firebase read/write/listener/data contract.
- SCOPE_EXPANSION: implementing cross-mode synchronized chat cannot be completed safely inside the visual allowlist. It needs a dedicated multiplayer/Firebase engineering task, with rules, schema, sanitization, lifecycle, and regression tests.
- SCOPE_EXPANSION: repairing missing target images may require changing asset-selection or Firebase target payload logic; this is protected until the exact missing asset source is evidenced.
- Minimal safe frontend patch candidate: remove the `OpponentTargetCard` render from the shared GameBoard presentation only if this is confirmed to be the unwanted Four surface; preserve target data and all handlers.
