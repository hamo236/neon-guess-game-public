$ErrorActionPreference = 'Stop'
$path = Join-Path $PSScriptRoot '..\src\pages\CompetitiveModePage.jsx'
$text = Get-Content -Raw -Encoding UTF8 $path
if (-not $text.Contains('function GuessGrid')) {
  $grid = 'function GuessGrid({ items, guessedTargetId, onGuess, locked }) { return <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">{items.map((item) => <button type="button" key={item.id} disabled={locked} onClick={() => onGuess(item.id)} className={`touch-feedback min-h-12 relative aspect-square overflow-hidden rounded-xl border-2 transition-all active:scale-[0.98] disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-fixed ${guessedTargetId === item.id ? ''border-secondary-fixed bg-secondary/20 neon-border'' : ''border-white/10 hover:border-primary-fixed/70''}`}><img src={item.image} alt={item.name} className="w-full h-full object-cover" /><span className="absolute inset-x-0 bottom-0 bg-black/75 px-1 py-1 text-[9px] leading-tight text-white">{item.name}</span>{guessedTargetId === item.id && <span className="absolute top-1 right-1 material-symbols-outlined text-secondary-fixed text-[18px]">check_circle</span>}</button>)}</div>; }'
  $text = $text.Replace('function TeamScoreboard', "$grid`nfunction TeamScoreboard")
}
$tempPath = "$path.tmp"
Set-Content -Path $tempPath -Value $text -Encoding UTF8
Move-Item -Force -Path $tempPath -Destination $path
Write-Output 'Tournament GuessGrid helper restored.'
