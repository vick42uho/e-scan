[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

Write-Host "========================================================" -ForegroundColor Cyan
Write-Host "  Yanhee DMS: หยุดการทำงานของ Scanner Bridge (Port 18000)" -ForegroundColor Cyan
Write-Host "========================================================" -ForegroundColor Cyan

$connections = Get-NetTCPConnection -LocalPort 18000 -ErrorAction SilentlyContinue
if ($connections) {
    $pids = $connections | Select-Object -ExpandProperty OwningProcess -Unique
    foreach ($p in $pids) {
        Stop-Process -Id $p -Force -ErrorAction SilentlyContinue
        Write-Host "[OK] ปิดโปรเซส PID: $p สำเร็จ" -ForegroundColor Green
    }
} else {
    Write-Host "[INFO] ไม่พบโปรเซสที่รันอยู่บนพอร์ต 18000" -ForegroundColor Gray
}

Write-Host ""
Write-Host "[DONE] ปิด Scanner Bridge เรียบร้อยแล้ว" -ForegroundColor Green
Read-Host "กด Enter เพื่อเสร็จสิ้น..."
