param(
    [string]$TargetUrl
)

$ErrorActionPreference = "Stop"

function Get-CloudflaredPath {
    $command = Get-Command cloudflared -ErrorAction SilentlyContinue
    if ($command -and $command.Source) {
        return $command.Source
    }

    $candidates = @(
        "C:\Program Files (x86)\cloudflared\cloudflared.exe",
        "C:\Program Files\cloudflared\cloudflared.exe"
    )

    foreach ($candidate in $candidates) {
        if (Test-Path $candidate) {
            return $candidate
        }
    }

    throw "cloudflared is not installed. Install it first, then run this script again."
}

if (-not $TargetUrl) {
    $port = if ($env:PORT) { $env:PORT } else { "3000" }
    $TargetUrl = "http://127.0.0.1:$port"
}

$cloudflaredPath = Get-CloudflaredPath

try {
    Invoke-WebRequest "$TargetUrl/api/health" -UseBasicParsing -TimeoutSec 5 | Out-Null
} catch {
    throw "Dedogeium does not appear to be running at $TargetUrl. Start the server first with npm start."
}

Write-Host ""
Write-Host "Starting Cloudflare Quick Tunnel for Dedogeium..." -ForegroundColor Cyan
Write-Host "Local server: $TargetUrl" -ForegroundColor Gray
Write-Host "Press Ctrl+C to stop the tunnel." -ForegroundColor Yellow
Write-Host ""

$urlPattern = 'https://[-a-z0-9]+\.trycloudflare\.com'
$announcedPublicUrl = $false

$previousErrorActionPreference = $ErrorActionPreference
$ErrorActionPreference = "Continue"

try {
    & $cloudflaredPath tunnel --url $TargetUrl 2>&1 | ForEach-Object {
        if ($_ -is [System.Management.Automation.ErrorRecord]) {
            $line = $_.ToString()
        } else {
            $line = [string]$_
        }

        if (-not $announcedPublicUrl) {
            $match = [regex]::Match($line, $urlPattern)
            if ($match.Success) {
                $publicUrl = $match.Value.TrimEnd("/")
                $arenaUrl = "$publicUrl/arena/"
                $announcedPublicUrl = $true
                $defaultsPath = Join-Path $PSScriptRoot "server_defaults.js"
                $defaultsContent = @"
(function configureDedogeiumDefaults() {
    // Everyone should use the same public SQL-backed server.
    // For Cloudflare Quick Tunnels, start_cloudflare_tunnel.ps1 updates this URL.
    //
    // Note: Cloudflare Quick Tunnel URLs are temporary and change each time.
    // For a truly constant public URL, use a real hosted server or a named tunnel.
    window.DEDOGEIUM_DEFAULT_SERVER_URL = "$publicUrl";
    window.DEDOGEIUM_FORCE_DEFAULT_SERVER = true;
})();
"@
                Set-Content -Path $defaultsPath -Value $defaultsContent -Encoding UTF8

                Write-Host ""
                Write-Output "Public Dedogeium URL: $publicUrl"
                Write-Output "Arena URL: $arenaUrl"
                Write-Output "Share the Arena URL with other players."
                Write-Host ""
            }
        }

        Write-Host $line
    }
} finally {
    $ErrorActionPreference = $previousErrorActionPreference
}
