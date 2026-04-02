param(
    [int]$Port = 3000
)

$ErrorActionPreference = "Stop"
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$targetUrl = "http://127.0.0.1:$Port"
$serverProcess = $null
$serverStartedHere = $false
$serverOut = Join-Path $scriptDir ".public-arena-server.out.log"
$serverErr = Join-Path $scriptDir ".public-arena-server.err.log"

function Test-DedogeiumHealth {
    param(
        [string]$BaseUrl
    )

    try {
        $response = Invoke-RestMethod "$BaseUrl/api/health" -TimeoutSec 3
        return [bool]($response -and $response.ok)
    } catch {
        return $false
    }
}

function Wait-ForDedogeiumHealth {
    param(
        [string]$BaseUrl,
        [int]$TimeoutSeconds = 20
    )

    $deadline = (Get-Date).AddSeconds($TimeoutSeconds)
    while ((Get-Date) -lt $deadline) {
        if (Test-DedogeiumHealth -BaseUrl $BaseUrl) {
            return $true
        }
        Start-Sleep -Milliseconds 800
    }

    return $false
}

if (-not (Test-DedogeiumHealth -BaseUrl $targetUrl)) {
    Remove-Item $serverOut,$serverErr -ErrorAction SilentlyContinue
    Write-Host "Starting Dedogeium server on port $Port..." -ForegroundColor Cyan
    $previousPortEnv = $env:PORT
    $env:PORT = [string]$Port
    $serverProcess = Start-Process node -ArgumentList "server.js" -WorkingDirectory $scriptDir -PassThru -RedirectStandardOutput $serverOut -RedirectStandardError $serverErr
    if ($null -eq $previousPortEnv) {
        Remove-Item Env:PORT -ErrorAction SilentlyContinue
    } else {
        $env:PORT = $previousPortEnv
    }
    $serverStartedHere = $true

    if (-not (Wait-ForDedogeiumHealth -BaseUrl $targetUrl -TimeoutSeconds 20)) {
        if ($serverProcess -and -not $serverProcess.HasExited) {
            Stop-Process -Id $serverProcess.Id -ErrorAction SilentlyContinue
        }

        $stdout = if (Test-Path $serverOut) { Get-Content $serverOut -Raw } else { "" }
        $stderr = if (Test-Path $serverErr) { Get-Content $serverErr -Raw } else { "" }
        throw "Dedogeium did not start successfully on $targetUrl.`n$stdout`n$stderr"
    }
} else {
    Write-Host "Using existing Dedogeium server at $targetUrl." -ForegroundColor Green
}

Write-Host ""
Write-Host "Launching public arena tunnel..." -ForegroundColor Cyan
Write-Host "Stop this window with Ctrl+C when you're done playing." -ForegroundColor Yellow

try {
    & (Join-Path $scriptDir "start_cloudflare_tunnel.ps1") -TargetUrl $targetUrl
} finally {
    if ($serverStartedHere -and $serverProcess -and -not $serverProcess.HasExited) {
        Stop-Process -Id $serverProcess.Id -ErrorAction SilentlyContinue
        Write-Host ""
        Write-Host "Stopped the Dedogeium server started by this shortcut." -ForegroundColor Gray
    }
}
