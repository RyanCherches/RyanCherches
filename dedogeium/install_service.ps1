<#
Install Dedogeium server as a Windows service.
Uses nssm if available; otherwise falls back to a Scheduled Task because
plain sc.exe/New-Service does not correctly host node.exe apps as services.

Run in an elevated PowerShell from this folder:
  .\install_service.ps1
#>

$serviceName = "DedogeiumServer"
$displayName = "Dedogeium Server"
$taskName = "DedogeiumServerStartup"
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Definition

# Find node
$nodeCmd = Get-Command node -ErrorAction SilentlyContinue
if (-not $nodeCmd) {
    Write-Error "node.exe not found in PATH. Install Node and ensure 'node' is available."
    exit 1
}
$nodePath = $nodeCmd.Source

$serverJs = Join-Path $scriptDir "server.js"
if (-not (Test-Path $serverJs)) {
    Write-Error "server.js not found in $scriptDir"
    exit 1
}

# Use NSSM if available for nicer service handling
$nssmCmd = Get-Command nssm -ErrorAction SilentlyContinue
if ($nssmCmd) {
    Write-Output "nssm found: installing service via nssm"
    & nssm install $serviceName $nodePath $serverJs
    & nssm set $serviceName AppDirectory $scriptDir
    & nssm set $serviceName AppStdout "$scriptDir\logs\stdout.log"
    & nssm set $serviceName AppStderr "$scriptDir\logs\stderr.log"
    & nssm set $serviceName Start SERVICE_AUTO_START
    Start-Service $serviceName
    Write-Output "Service $serviceName installed and started via nssm."
    exit 0
}

Write-Output "nssm not found. Falling back to a Scheduled Task startup runner."

$logsDir = Join-Path $scriptDir "logs"
if (-not (Test-Path $logsDir)) {
    New-Item -ItemType Directory -Path $logsDir | Out-Null
}
$stdoutLog = Join-Path $logsDir "scheduledtask-stdout.log"
$stderrLog = Join-Path $logsDir "scheduledtask-stderr.log"
$taskCommand = @"
Set-Location '$scriptDir'
& '$nodePath' '$serverJs' *>> '$stdoutLog' 2>> '$stderrLog'
"@

try {
    $action = New-ScheduledTaskAction -Execute "powershell.exe" -Argument "-NoProfile -WindowStyle Hidden -ExecutionPolicy Bypass -Command `$ErrorActionPreference='Stop'; $taskCommand"
    $trigger = New-ScheduledTaskTrigger -AtStartup
    $principal = New-ScheduledTaskPrincipal -UserId "SYSTEM" -LogonType ServiceAccount -RunLevel Highest
    $settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -MultipleInstances IgnoreNew -RestartCount 3 -RestartInterval (New-TimeSpan -Minutes 1) -StartWhenAvailable

    Register-ScheduledTask -TaskName $taskName -Action $action -Trigger $trigger -Principal $principal -Settings $settings -Description "Starts the Dedogeium Node backend on boot." -Force | Out-Null
} catch {
    Write-Error "Could not register Scheduled Task ${taskName}: $_"
    exit 1
}

try {
    Start-ScheduledTask -TaskName $taskName
} catch {
    Write-Warning "Scheduled Task ${taskName} was created, but could not be started immediately: $_"
}

try {
    Start-Sleep -Seconds 2
    $health = Invoke-WebRequest http://127.0.0.1:3000/api/health -UseBasicParsing -TimeoutSec 5
    Write-Output "Scheduled Task ${taskName} created and Dedogeium responded with status $($health.StatusCode)."
} catch {
    Write-Warning "Scheduled Task ${taskName} was created, but the health check did not succeed yet: $_"
}

# Add firewall rule for port 3000
try {
    New-NetFirewallRule -DisplayName "Dedogeium Server (3000)" -Direction Inbound -Action Allow -Protocol TCP -LocalPort 3000 -ErrorAction Stop
} catch {
    Write-Warning "Could not create firewall rule: $_"
}

Write-Output "Use 'Get-ScheduledTask -TaskName $taskName' and the logs in '$logsDir' if you need to troubleshoot startup."
