<#
Restore a players.json backup from the `backups/` folder.

Usage (run from this folder):
  .\restore_players.ps1

The script will:
 - locate the server data directory (prefers %PROGRAMDATA%\dedogeium_server_data, then ./data)
 - list available backups from ./backups
 - prompt you to choose a backup (by number or filename)
 - confirm before overwriting the current `players.json`
#>

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Definition

$defaultData = Join-Path $env:ProgramData "dedogeium_server_data"
$localData = Join-Path $scriptDir "data"

if (Test-Path $defaultData) { $dataDir = $defaultData } elseif (Test-Path $localData) { $dataDir = $localData } else { Write-Error "No data directory found (checked $defaultData and $localData)"; exit 1 }

$playersFile = Join-Path $dataDir "players.json"
if (-not (Test-Path $playersFile)) { Write-Warning "players.json not found in $dataDir (will create after restore)" }

$backupsDir = Join-Path $scriptDir "backups"
if (-not (Test-Path $backupsDir)) { Write-Error "Backups folder not found ($backupsDir)"; exit 1 }

$backups = Get-ChildItem -Path $backupsDir -Filter "players_*.json" | Sort-Object LastWriteTime -Descending
if ($backups.Count -eq 0) { Write-Error "No backup files found in $backupsDir"; exit 1 }

Write-Output "Available backups:";
for ($i = 0; $i -lt $backups.Count; $i++) {
    $b = $backups[$i]
    Write-Output ("[{0}] {1} ({2})" -f $i, $b.Name, $b.LastWriteTime)
}

$choice = Read-Host "Enter backup number or filename to restore"
if ($choice -match '^[0-9]+$') {
    $idx = [int]$choice
    if ($idx -lt 0 -or $idx -ge $backups.Count) { Write-Error "Invalid index"; exit 1 }
    $selected = $backups[$idx].FullName
} else {
    $candidate = Join-Path $backupsDir $choice
    if (-not (Test-Path $candidate)) { Write-Error "File not found: $candidate"; exit 1 }
    $selected = $candidate
}

Write-Output "Selected backup: $selected"

if (Test-Path $playersFile) {
    $confirm = Read-Host "Overwrite existing players.json at $playersFile? (y/N)"
    if ($confirm -ne 'y' -and $confirm -ne 'Y') { Write-Output "Aborted"; exit 0 }
    $backupCurrent = Join-Path $backupsDir ("players_before_restore_{0}.json" -f (Get-Date -Format "yyyyMMdd_HHmmss"))
    Copy-Item -Path $playersFile -Destination $backupCurrent -Force
    Write-Output "Saved current players.json to $backupCurrent"
}

Copy-Item -Path $selected -Destination $playersFile -Force
Write-Output "Restored backup to $playersFile"
