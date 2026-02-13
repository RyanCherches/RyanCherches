<#
Install Dedogeium server as a Windows service.
Tries to use nssm if available; otherwise falls back to sc.exe.

Run in an elevated PowerShell from this folder:
  .\install_service.ps1
#>

$serviceName = "DedogeiumServer"
$displayName = "Dedogeium Server"
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

Write-Output "nssm not found. Falling back to sc.exe create."

# Build binPath argument with quotes
$binPath = '"{0}" "{1}"' -f $nodePath, $serverJs

# Create the service
& sc.exe create $serviceName binPath= $binPath DisplayName= "$displayName" start= auto
if ($LASTEXITCODE -ne 0) {
    Write-Error "sc.exe create failed. Exit $LASTEXITCODE"
    exit 1
}

# Add a description
& sc.exe description $serviceName "Dedogeium Node server"

# Start it
Start-Service $serviceName

# Add firewall rule for port 3000
try {
    New-NetFirewallRule -DisplayName "Dedogeium Server (3000)" -Direction Inbound -Action Allow -Protocol TCP -LocalPort 3000 -ErrorAction Stop
} catch {
    Write-Warning "Could not create firewall rule: $_"
}

Write-Output "Service $serviceName created and started. Check service status in Services.msc or with Get-Service $serviceName."
