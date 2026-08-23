from pathlib import Path
p = Path('/home/ubuntu/neon_guess_publish/src/pages/CompetitiveModePage.jsx').read_text()
start = p.index('function TournamentGameplay')
end = p.index('function TournamentBoard', start)
Path('/home/ubuntu/neon_guess_publish/evidence/tournament-gameplay-current.txt').write_text(p[start:end])
print(p[start:end])
