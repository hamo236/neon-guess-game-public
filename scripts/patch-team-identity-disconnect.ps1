$p = Join-Path (Get-Location) 'src\pages\CompetitiveModePage.jsx'
$raw = [IO.File]::ReadAllText($p)
$start = $raw.IndexOf('function TeamBattleIdentity')
$end = $raw.IndexOf('function TeamBattleGameplay')
if ($start -lt 0 -or $end -le $start) { throw 'identity boundary missing' }
$new = @'
function TeamBattleIdentity({ state, actions }) { const currentTeamId = Object.values(state.teams || {}).find((team) => team.playerIds.includes(actions.playerId))?.teamId; const teams = [TEAM_IDS.A, TEAM_IDS.B].map((teamId) => ({ teamId, label: teamId === TEAM_IDS.A ? 'TEAM A' : 'TEAM B', players: state.teams?.[teamId]?.playerIds || [] })); return <section className="relative overflow-hidden rounded-3xl border border-primary-fixed/25 bg-gradient-to-br from-primary-fixed/10 via-white/5 to-transparent p-4 sm:p-5 shadow-[0_18px_55px_rgba(0,0,0,0.22)]" aria-label="Team rosters"><div className="flex items-center justify-between gap-3"><span className="font-label-caps text-label-caps text-primary-fixed">TEAM ROSTERS</span><span className="text-xs text-on-surface-variant">NAMES IN ROOM</span></div><div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">{teams.map((team) => <div key={team.teamId} className={`rounded-2xl border px-3 py-3 ${team.teamId === currentTeamId ? 'border-primary-fixed/50 bg-primary-fixed/10' : 'border-white/10 bg-black/20'}`}><div className="flex items-center justify-between gap-2"><span className="font-label-caps text-label-caps text-white">{team.label}</span>{team.teamId === currentTeamId && <span className="text-[10px] font-semibold text-primary-fixed">YOUR NAME</span>}</div><div className="mt-2 space-y-2">{team.players.map((id) => <div key={id} className={`rounded-xl border px-3 py-2 text-sm truncate ${id === actions.playerId ? 'border-primary-fixed/40 text-primary-fixed' : 'border-white/10 text-white'}`}>{state.players[id]?.name || 'Player'}</div>)}</div>{team.teamId === currentTeamId && <div className="mt-2 text-xs text-on-surface-variant">{state.players[actions.playerId]?.name || 'Player'}</div>}</div>)}</div></section>; }
'@
$raw = $raw.Substring(0, $start) + $new + $raw.Substring($end)
$old = "disabled={Boolean(pendingAction)} aria-busy={pendingAction === 'leave'} onClick={() => run(actions.leave, 'leave')}"
$replacement = "disabled={pendingAction === 'leave'} aria-busy={pendingAction === 'leave'} onClick={() => run(actions.leave, 'leave')}"
if (-not $raw.Contains($old)) { throw 'leave control marker missing' }
$raw = $raw.Replace($old, $replacement)
[IO.File]::WriteAllText($p, $raw, (New-Object Text.UTF8Encoding($false)))
Write-Output 'PATCH_APPLIED'
Select-String -Path $p -Pattern 'TEAM ROSTERS|YOUR NAME|disabled={pendingAction === ''leave''}' -SimpleMatch
