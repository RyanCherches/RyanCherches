param(
    [string]$CaddyExePath = "C:\caddy\caddy.exe",
    [string]$ConfigPath = "C:\Users\lolik\RyanCherches\dedogeium\Caddyfile",
    [string]$ServiceName = "caddy"
)

$ErrorActionPreference = "Stop"

if (-not (Test-Path $CaddyExePath)) {
    throw "caddy.exe was not found at '$CaddyExePath'. Install Caddy first or pass -CaddyExePath."
}

if (-not (Test-Path $ConfigPath)) {
    throw "Caddyfile was not found at '$ConfigPath'."
}

$service = Get-Service -Name $ServiceName -ErrorAction SilentlyContinue
if ($service) {
    Write-Output "Service '$ServiceName' already exists. Updating it to use the current config."
    & sc.exe stop $ServiceName | Out-Null
    Start-Sleep -Seconds 1
    & sc.exe config $ServiceName binPath= "`"$CaddyExePath`" run --config `"$ConfigPath`""
} else {
    Write-Output "Creating service '$ServiceName'..."
    & sc.exe create $ServiceName start= auto binPath= "`"$CaddyExePath`" run --config `"$ConfigPath`""
}

Start-Sleep -Seconds 1
& sc.exe start $ServiceName
Write-Output "Caddy service '$ServiceName' is now configured."
