$ErrorActionPreference = "Continue"
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12

$root   = Split-Path $PSScriptRoot -Parent
$pgRoot = Join-Path $root ".pg"
$zip    = Join-Path $pgRoot "pg-binaries.zip"
$extract= Join-Path $pgRoot "dist"
$dataDir= Join-Path $pgRoot "data"
$log    = Join-Path $PSScriptRoot "setup-pg-local.log"

function Log($m) { "$((Get-Date).ToString('HH:mm:ss')) $m" | Tee-Object -FilePath $log -Append }

Set-Content -Path $log -Value "=== setup-pg-local start ==="
New-Item -ItemType Directory -Force -Path $pgRoot | Out-Null

# 1) Binary zip indir (calisan ilk surumu kullan)
$candidates = @(
  "https://get.enterprisedb.com/postgresql/postgresql-16.4-1-windows-x64-binaries.zip",
  "https://get.enterprisedb.com/postgresql/postgresql-16.3-1-windows-x64-binaries.zip",
  "https://get.enterprisedb.com/postgresql/postgresql-16.2-1-windows-x64-binaries.zip",
  "https://get.enterprisedb.com/postgresql/postgresql-15.7-1-windows-x64-binaries.zip",
  "https://get.enterprisedb.com/postgresql/postgresql-17.2-1-windows-x64-binaries.zip"
)

$downloaded = $false
if ((Test-Path $zip) -and ((Get-Item $zip).Length -gt 50MB)) {
  Log "Zip zaten mevcut, indirme atlaniyor"
  $downloaded = $true
}
if (-not $downloaded) {
  foreach ($url in $candidates) {
    try {
      Log "Indiriliyor: $url"
      Invoke-WebRequest -Uri $url -OutFile $zip -UseBasicParsing -TimeoutSec 600
      if ((Test-Path $zip) -and ((Get-Item $zip).Length -gt 50MB)) {
        Log ("Indirme tamam: {0:N0} bytes" -f (Get-Item $zip).Length)
        $downloaded = $true
        break
      }
    } catch {
      Log "Basarisiz: $($_.Exception.Message)"
    }
  }
}
if (-not $downloaded) { Log "DOWNLOAD_FAILED"; Log "=== end ==="; exit 1 }

# 2) Cikar
if (Test-Path $extract) { Remove-Item -Recurse -Force $extract }
New-Item -ItemType Directory -Force -Path $extract | Out-Null
Log "Zip aciliyor ..."
Expand-Archive -Path $zip -DestinationPath $extract -Force
$bin = Join-Path $extract "pgsql\bin"
if (-not (Test-Path (Join-Path $bin "initdb.exe"))) { Log "BIN_NOT_FOUND: $bin"; Log "=== end ==="; exit 1 }
Log "Bin: $bin"

# 3) initdb (trust auth -> yerel gelistirme icin sifre kontrolu yok)
if (Test-Path $dataDir) { Remove-Item -Recurse -Force $dataDir }
Log "initdb ..."
& (Join-Path $bin "initdb.exe") -D $dataDir -U postgres -A trust -E UTF8 2>&1 | Out-File -FilePath $log -Append

# 4) Sunucuyu baslat (port 5432)
$pgLog = Join-Path $pgRoot "server.log"
Log "pg_ctl start (port 5432) ..."
& (Join-Path $bin "pg_ctl.exe") -D $dataDir -l $pgLog -o "-p 5432" start 2>&1 | Out-File -FilePath $log -Append
Start-Sleep -Seconds 5

# 5) Hazir mi
$ready = $false
for ($i = 0; $i -lt 20; $i++) {
  & (Join-Path $bin "pg_isready.exe") -p 5432 -U postgres > $null 2>&1
  if ($LASTEXITCODE -eq 0) { $ready = $true; Log "PG_READY"; break }
  Start-Sleep -Seconds 2
}
if (-not $ready) { Log "PG_NOT_READY"; Get-Content $pgLog -ErrorAction SilentlyContinue | Out-File -FilePath $log -Append; Log "=== end ==="; exit 1 }

# 6) Veritabani olustur
Log "createdb mcp_gateway ..."
& (Join-Path $bin "createdb.exe") -p 5432 -U postgres mcp_gateway 2>&1 | Out-File -FilePath $log -Append

# 7) Prisma migrate
Log "prisma migrate dev ..."
$env:DATABASE_URL = "postgresql://postgres:postgres@localhost:5432/mcp_gateway?schema=public"
Push-Location $root
cmd /c "npx prisma migrate dev --name init 2>&1" | Out-File -FilePath $log -Append
Log "MIGRATE_EXIT_$LASTEXITCODE"
Pop-Location

Log "=== setup-pg-local end ==="
