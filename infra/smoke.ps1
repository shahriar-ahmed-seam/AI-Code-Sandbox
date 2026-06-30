param(
    [string]$ApiBase = "http://localhost:8000",
    [string]$ApiKey = ""
)
$ErrorActionPreference = "Stop"
$headers = @{ "Content-Type" = "application/json" }
if ($ApiKey) { $headers["X-API-Key"] = $ApiKey }

function Invoke-Run($lang, $code, $expect) {
    $body = @{ language = $lang; code = $code } | ConvertTo-Json
    $r = Invoke-RestMethod -Uri "$ApiBase/api/v1/execute" -Method Post -Headers $headers -Body $body -TimeoutSec 60
    if ($r.exit_code -ne 0) { throw "[$lang] non-zero exit: $($r.exit_code) stderr=$($r.stderr)" }
    if ($r.stdout -notmatch [regex]::Escape($expect)) { throw "[$lang] expected '$expect' in stdout, got: $($r.stdout)" }
    Write-Host ("  PASS {0,-7} -> {1} ({2}ms, {3}KB)" -f $lang, $r.stdout.Trim(), $r.duration_ms, $r.memory_kb) -ForegroundColor Green
}

Write-Host "Health check..." -ForegroundColor Cyan
$h = Invoke-RestMethod -Uri "$ApiBase/health" -TimeoutSec 10
if ($h.status -ne "ok") { throw "orchestrator unhealthy" }

Write-Host "Running per-language smoke tests..." -ForegroundColor Cyan
Invoke-Run "python" "print(6*7)" "42"
Invoke-Run "node"   "console.log(6*7)" "42"
Invoke-Run "go"     "package main`nimport `"fmt`"`nfunc main(){fmt.Println(6*7)}" "42"

Write-Host "Checking for leftover sandbox containers..." -ForegroundColor Cyan
$leftover = docker ps -a --filter "label=ai-sandbox=true" --format "{{.ID}}"
if ($leftover) { throw "FAIL: leftover containers: $leftover" }
Write-Host "  PASS no leftover containers" -ForegroundColor Green

Write-Host "`nAll smoke tests passed." -ForegroundColor Green
