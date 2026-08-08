# Apply pending SQL migrations (Windows PowerShell).
$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot\..

if (-not (Test-Path .env)) {
  Copy-Item .env.example .env
  Write-Host "Created .env from .env.example"
}

Get-Content .env | ForEach-Object {
  if ($_ -match '^\s*#' -or $_ -match '^\s*$') { return }
  $k, $v = $_ -split '=', 2
  Set-Item -Path "Env:$k" -Value $v
}

$USER = if ($env:POSTGRES_USER) { $env:POSTGRES_USER } else { "postgres" }
$DB = if ($env:POSTGRES_DB) { $env:POSTGRES_DB } else { "booking" }

Write-Host "Waiting for Postgres..."
do {
  docker compose exec -T postgres pg_isready -U $USER -d $DB 2>$null | Out-Null
  if ($LASTEXITCODE -eq 0) { break }
  Start-Sleep -Seconds 1
} while ($true)

Get-ChildItem migrations\*.sql | Sort-Object Name | ForEach-Object {
  $version = $_.Name
  $applied = (docker compose exec -T postgres psql -U $USER -d $DB -Atc "SELECT 1 FROM schema_migrations WHERE version = '$version'").Trim()
  if ($applied -eq "1") {
    Write-Host "skip  $version"
    return
  }
  Write-Host "apply $version"
  Get-Content -Raw $_.FullName | docker compose exec -T postgres psql -U $USER -d $DB -v ON_ERROR_STOP=1
  if ($LASTEXITCODE -ne 0) { throw "Migration failed: $version" }
  docker compose exec -T postgres psql -U $USER -d $DB -c "INSERT INTO schema_migrations (version) VALUES ('$version')"
}

Write-Host "Migrations complete."
