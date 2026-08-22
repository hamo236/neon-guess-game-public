$p='src/pages/CompetitiveModePage.jsx'
$l=(Get-Content -LiteralPath $p)[68]
$stack=New-Object System.Collections.Generic.List[string]
$rx=[regex]'<(\/)?([A-Za-z][A-Za-z0-9_.-]*)([^>]*)>'
foreach($m in $rx.Matches($l)){
  $name=$m.Groups[2].Value
  $closing=$m.Groups[1].Success
  $attrs=$m.Groups[3].Value
  if($closing){
    if($stack.Count -eq 0){Write-Output "UNEXPECTED_CLOSE $name at $($m.Index)"} elseif($stack[$stack.Count-1] -ne $name){Write-Output "MISMATCH_CLOSE $name expected $($stack[$stack.Count-1]) at $($m.Index)"} else {$stack.RemoveAt($stack.Count-1)}
  } elseif(-not $attrs.TrimEnd().EndsWith('/')) { $stack.Add($name) }
}
Write-Output "OPEN_STACK=$($stack -join ',')"
Write-Output "TOTAL_TAGS=$($rx.Matches($l).Count)"
