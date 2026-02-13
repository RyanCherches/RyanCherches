<#
Back up players.json to backups/ with timestamp.
Run from this folder or schedule as task: .\backup_players.ps1
#>

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Definition

# Prefer ProgramData storage (server uses this by default). Fall back to ./data
$defaultData = Join-Path $env:ProgramData "dedogeium_server_data"
$localData = Join-Path $scriptDir "data"

if (Test-Path $defaultData) { $dataDir = $defaultData } elseif (Test-Path $localData) { $dataDir = $localData } else { Write-Error "No data directory found (checked $defaultData and $localData)"; exit 1 }

$playersFile = Join-Path $dataDir "players.json"
if (-not (Test-Path $playersFile)) { Write-Error "players.json not found in $dataDir"; exit 1 }

$backupsDir = Join-Path $scriptDir "backups"
if (-not (Test-Path $backupsDir)) { New-Item -Path $backupsDir -ItemType Directory | Out-Null }

$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$dest = Join-Path $backupsDir ("players_$timestamp.json")
Copy-Item -Path $playersFile -Destination $dest -Force
Write-Output "Backed up players.json to $dest"
