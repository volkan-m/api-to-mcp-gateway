$ErrorActionPreference = "Continue"
$log = Join-Path $PSScriptRoot "setup-db.log"
function Log($m) { "$((Get-Date).ToString('HH:mm:ss')) $m" | Tee-Object -FilePath $log -Append }

Set-Content -Path $log -Value "=== setup-db start ==="

# 1) WSL güncelle (Docker Desktop WSL2 backend için)
Log "wsl --update ..."
wsl --update --no-distribution 2>&1 | Out-File -FilePath $log -Append

# 2) Docker Desktop'ı başlat
$dd = "C:\Program Files\Docker\Docker\Docker Desktop.exe"
if (Test-Path $dd) {
  $running = Get-Process "Docker Desktop" -ErrorAction SilentlyContinue
  if (-not $running) { Log "Docker Desktop baslatiliyor"; Start-Process $dd } else { Log "Docker Desktop zaten calisiyor" }
}

# 3) Docker engine hazir mi (max ~6 dk)
$dockerOk = $false
for ($i = 0; $i -lt 72; $i++) {
  docker version --format '{{.Server.Version}}' > $null 2>&1
  if ($LASTEXITCODE -eq 0) { $dockerOk = $true; Log "DOCKER_READY"; break }
  Start-Sleep -Seconds 5
}
if (-not $dockerOk) { Log "DOCKER_FAILED: engine baslamadi"; Log "=== setup-db end ==="; exit 1 }

# 4) PostgreSQL container
Log "docker compose up -d ..."
docker compose up -d 2>&1 | Out-File -FilePath $log -Append

# 5) pg hazir mi
$pgOk = $false
for ($i = 0; $i -lt 30; $i++) {
  docker exec mcp-gateway-pg pg_isready -U postgres -d mcp_gateway > $null 2>&1
  if ($LASTEXITCODE -eq 0) { $pgOk = $true; Log "PG_READY"; break }
  Start-Sleep -Seconds 2
}
if (-not $pgOk) { Log "PG_FAILED"; Log "=== setup-db end ==="; exit 1 }

# 6) Prisma migrate (semayi olustur)
Log "prisma migrate dev ..."
$env:DATABASE_URL = "postgresql://postgres:postgres@localhost:5432/mcp_gateway?schema=public"
cmd /c "npx prisma migrate dev --name init 2>&1" | Out-File -FilePath $log -Append
Log "MIGRATE_EXIT_$LASTEXITCODE"

Log "=== setup-db end ==="
