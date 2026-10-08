Write-Host "========================================================" -ForegroundColor Cyan
Write-Host "  Yanhee DMS: Stop Scanner Bridge Service (Port 18000)" -ForegroundColor Cyan
Write-Host "========================================================" -ForegroundColor Cyan

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
Write-Host "[DONE] Scanner Bridge stopped successfully." -ForegroundColor Green
Read-Host "Press Enter to exit..."
