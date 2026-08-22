# Research record: 2v2 lobby and shared confirmation UX

## Decision to make

Design the next 2v2 Team Battle pass without implementation: improve the lobby and gameplay presentation, remove the large 15-card guess grid from the team flow, and require both teammates to confirm the opponent’s successful guess before the round advances.

## Repository evidence

The current 2v2 state is already authoritative at `teamRooms/{roomId}` through `mutateCompetitiveState`, which wraps a Realtime Database transaction. `CompetitiveModeContext.jsx` currently records each player’s target guess at `match.guesses[playerId]`, and the host alone calls `resolveTeamRound` after the timer. `teamBattleEngine.js` currently derives round points from guesses and transitions from playing to round_result, then advances after the reveal timer.

`CompetitiveModePage.jsx` currently renders the full category grid through `GuessGrid`, a private target card, a scoreboard, and a round result reveal. This creates a mismatch with the requested team loop: the player needs to confirm the opponent’s target rather than browse and select fifteen cards.

The teams are authoritative and stable: players 1–2 by join order are Team A and players 3–4 are Team B. `assignTeamTargets` writes the same team target into each teammate’s private target projection, while the public state contains enough team metadata to render team identity and teammate status.

## Research evidence

| Source | Type | Direct pattern | Limitation | Project implication |
| --- | --- | --- | --- | --- |
| [Firebase Realtime Database](https://firebase.google.com/docs/database) | Official platform documentation | Data is synchronized to connected clients in realtime; security rules define allowed reads and writes | Documentation is platform-level and does not design this game’s interaction | Store teammate confirmations under the authoritative room/match/round state and project them through the existing listener |
| [Firebase Read and Write Data](https://firebase.google.com/docs/database/web/read-and-write) | Official platform documentation | `onValue()` observes changes, `get()` is for one-time reads, and `update()` changes selected children without overwriting unrelated data | `get()` can add bandwidth and is not a substitute for a live listener | Use the existing room listener for confirmation status; use a transaction for the action that depends on current round/team state |
| [Material 3 interaction states](https://m3.material.io/foundations/interaction/states) | Official interaction guidance | Enabled, disabled, hover, focused, pressed, and selected states communicate interaction status; states should be applied consistently | General component guidance, not game-specific | Confirmation button must visibly change to confirmed/awaiting state, remain accessible, and avoid ambiguous disabled styling |
| [NN/g Visibility of System Status](https://www.nngroup.com/articles/visibility-system-status/) | Recognized UX research | Users need continuous feedback about current system state and whether an action was registered; feedback reduces repeated taps and uncertainty | Heuristic guidance rather than a measured NEON GUESS experiment | Show `0/2 confirmed`, `You confirmed`, `Waiting for teammate`, timer, and next-state feedback directly in the team panel |
| Unity multiplayer design discussion and cooperative-game research results | Practitioner/community and academic discovery | Cooperation is strengthened when players share a visible objective and understand complementary responsibility | Less authoritative and context-dependent | Use these only as supporting inspiration; validate with the existing game loop and telemetry after implementation |

## Inference

The current interaction asks players to make an individual card guess, but the requested team fantasy is a shared declaration: each player should inspect the revealed opponent-target context and explicitly agree that the opposing team guessed correctly. The safest model is not a local React toggle and not a host-only shortcut. It is a per-player confirmation record keyed by `matchId`, `roundNumber`, and `playerId`, evaluated by the authoritative transaction.

A two-of-two gate should be scoped to the confirming team, not to all four players. Team A’s two confirmations acknowledge Team B’s event; Team B’s two confirmations acknowledge Team A’s event. The round may proceed only when both teams have completed the relevant confirmation, or when the product decision explicitly defines a single winning event. Because the user requested both teammates to press, the recommended first pass requires two confirmations from each team before resolve/advance. This avoids one client unilaterally moving the round and keeps the interaction symmetrical.

The visible gameplay should be a compact “opponent target” panel and one large action row, not a 15-card grid. The card must show the target image/name already authoritative for the opposing team, and the button should read `TEAM B · GUESSED CORRECT` or `TEAM A · GUESSED CORRECT` depending on the viewer. The button should have idle, pressed/confirmed, teammate-confirmed, both-confirmed, and locked states.

## Recommendation

Adopt a two-stage, authoritative round protocol:

1. During play, each client sees its own shared team target card and a compact opponent-target confirmation panel. The 15-card grid is removed from the 2v2 projection only; Tournament and 1v1 remain untouched.
2. Each player presses the opponent team confirmation button once. The write is idempotent and scoped to `matchId`, `roundNumber`, and `playerId`.
3. The room listener renders confirmation progress for the current viewer’s team. A player never sees a false “both confirmed” state from local UI alone.
4. The host may resolve only after the authoritative gate is satisfied, or the resolver may be made idempotent and callable by any client if security rules permit. The recommended minimal pass keeps host authority for final scoring but removes the host-only semantic bottleneck by making the two-player gate explicit.
5. The result/reveal remains the single authoritative transition into `round_result`, followed by the existing five-second reveal and next-round path.

For the lobby, use a stronger hierarchy rather than more decoration: a compact hero header, clear `2v2 TEAM BATTLE` identity, four animated player slots grouped as Team A/Team B, room-code invitation card, connection/readiness indicators, and a host-only start CTA that explains why it is disabled. Motion should be limited to join/ready transitions and confirmation feedback so it communicates state rather than distracts.

## Rejected alternatives

A local `useState` confirmation was rejected because it disappears on refresh and cannot guarantee that both teammates confirmed. A host-only button was rejected because it violates the user’s requested shared responsibility. A global four-player confirmation gate was rejected for the first pass because it adds unnecessary waiting and does not match the requested per-team confirmation. A new Firebase top-level path was rejected because the current room state already provides an authoritative transaction boundary and a schema expansion should not precede a concrete need.

## Open questions to resolve during implementation

The exact semantic meaning of “Team B guessed correct” must be encoded consistently. The recommended interpretation is that each team confirms the opposing team’s successful guess, so both teammates on the observing team must press. If the product instead wants the guessing team to self-report success, the label and state mapping must be changed before implementation. The current user wording supports the observing-team confirmation interpretation.
