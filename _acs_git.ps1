$ErrorActionPreference = "Continue"
Set-Location "C:\Projects\AI-Code-Sandbox"
$log = "C:\Projects\AI-Code-Sandbox\_acs_run.txt"
function L($m){ $m | Out-File $log -Append }
"START $(Get-Date -Format o)" | Out-File $log

Remove-Item "staged.txt" -Force -ErrorAction SilentlyContinue
if (-not (Select-String -Path ".gitignore" -SimpleMatch -Pattern "_acs_" -Quiet)) {
  "`n# local tooling`n_acs_*`nstaged.txt" | Out-File ".gitignore" -Append -Encoding utf8
}

$name = git config user.name
$email = git config user.email
L "user.name=$name email=$email"
if (-not $name) { git config user.name "shahriar-ahmed-seam" }
if (-not $email) { git config user.email "shahriar-ahmed-seam@users.noreply.github.com" }

git rm --cached -q staged.txt 2>&1 | Out-Null
git add -A 2>&1 | Out-Null
L "=== commit ==="
git commit -m "Initial commit: AI-Code-Sandbox secure code-execution platform" 2>&1 | Out-File $log -Append
L "=== repo create + push ==="
$desc = "Secure, ephemeral code-execution infrastructure for AI agents - isolated Docker sandboxes, strict resource limits, FastAPI gateway, and a v0-style Next.js playground."
gh repo create AI-Code-Sandbox --public --source . --remote origin --push --description $desc 2>&1 | Out-File $log -Append
L "DONE $(Get-Date -Format o)"
