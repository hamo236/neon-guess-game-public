# Visual Four audit notes

## 2026-08-23

- Local app loaded at `/neon-guess-game-public/` and showed the Home page with 2v2 and 1v1 entry cards.
- Local app loaded at `/neon-guess-game-public/tournament` and showed the 4-PLAYER TOURNAMENT lobby.
- The tournament lobby is visually separate from the classic `/game` GameBoard route and uses `CompetitiveModePage` through `TournamentPage`.
- No gameplay screen was reached yet; no claim about the in-match visual Guess Card is made from these lobby screenshots.
- The next required check is to create or join a real tournament room and inspect the rendered gameplay DOM/screenshot, because static source evidence previously revealed a `GuessGrid` in `CompetitiveModePage`.

Status labels: lobby visual evidence = RUNTIME VERIFIED; in-match Four visual evidence = NOT VERIFIED.

## Important source discrepancy

`GameBoardPage.jsx` contains a Four/social branch without `GuessGrid`, while `CompetitiveModePage.jsx` defines `GuessGrid` and `TournamentGameplay`. The actual user-visible Four route must be resolved by reaching the tournament room gameplay, not by assuming the classic `/game` route is the production Four mode.

Source evidence: `/home/ubuntu/neon_guess_publish/src/pages/App.jsx`, `/home/ubuntu/neon_guess_publish/src/pages/CompetitiveModePage.jsx`, `/home/ubuntu/neon_guess_publish/src/pages/GameBoardPage.jsx`.

Source evidence is not runtime proof.

## Live local room evidence

- A local room was created at `/neon-guess-game-public/tournament`.
- The live rendered waiting room showed Room 500, 1/4 connected, Start Match, invite code, and host player.
- This confirms the Tournament route is reachable and visually renders from the competitive provider.
- A gameplay state requires four connected players; this single-client environment cannot honestly claim a four-client visual gameplay run.
- The user report is therefore consistent with a real possibility: static Four/GameBoard checks may have audited the wrong route while TournamentPage has a different gameplay component.

Status: live tournament lobby visual = RUNTIME VERIFIED; four-client in-match visual = BLOCKED/NOT VERIFIED.
