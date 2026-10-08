Write-Host "========================================================" -ForegroundColor Cyan
Write-Host "  Yanhee DMS: Uninstall Scanner Bridge Auto-Start" -ForegroundColor Cyan
Write-Host "========================================================" -ForegroundColor Cyan

$startupFolder = [Environment]::GetFolderPath("Startup")
$shortcutPath = Join-Path $startupFolder "YanheeScannerBridge.lnk"

if (Test-Path $shortcutPath) {
    Remove-Item $shortcutPath -Force
    Write-Host "[OK] Removed shortcut from Windows Startup folder." -ForegroundColor Green
}

Write-Host "Stopping running Scanner Bridge (Port 18000)..." -ForegroundColor Yellow
$connections = Get-NetTCPConnection -LocalPort 18000 -ErrorAction SilentlyContinue
if ($connections) {
    $pids = $connections | Select-Object -ExpandProperty OwningProcess -Unique
    foreach ($p in $pids) {
        Stop-Process -Id $p -Force -ErrorAction SilentlyContinue
        Write-Host "[OK] Terminated Process PID: $p" -ForegroundColor Green
    }
} else {
    Write-Host "[INFO] No active process found on port 18000." -ForegroundColor Gray
}

Write-Host ""
Write-Host "========================================================" -ForegroundColor Green
Write-Host "[SUCCESS] Auto-start removed and background service stopped." -ForegroundColor Green
Write-Host "========================================================" -ForegroundColor Green
Write-Host ""

Read-Host "Press Enter to exit..."
