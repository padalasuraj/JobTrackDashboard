$ErrorActionPreference = 'Stop'
$projectDirectory = Split-Path -Parent $PSScriptRoot
Push-Location -LiteralPath $projectDirectory
try {
    node scripts/start-local.mjs
    exit $LASTEXITCODE
} finally {
    Pop-Location
}
