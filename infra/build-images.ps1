$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot

$images = @(
    @{ tag = "ai-sandbox-python:latest"; ctx = "sandbox-images/python" },
    @{ tag = "ai-sandbox-node:latest";   ctx = "sandbox-images/node" },
    @{ tag = "ai-sandbox-go:latest";     ctx = "sandbox-images/go" }
)

foreach ($img in $images) {
    Write-Host "Building $($img.tag)..." -ForegroundColor Cyan
    docker build -t $img.tag (Join-Path $root $img.ctx)
    if ($LASTEXITCODE -ne 0) { throw "Build failed for $($img.tag)" }
}
Write-Host "All sandbox images built." -ForegroundColor Green
