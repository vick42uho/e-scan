[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

Write-Host "========================================================" -ForegroundColor Cyan
Write-Host "  Yanhee DMS: ยกเลิกการเปิด Scanner Bridge อัตโนมัติ" -ForegroundColor Cyan
Write-Host "========================================================" -ForegroundColor Cyan

$startupFolder = [Environment]::GetFolderPath("Startup")
$shortcutPath = Join-Path $startupFolder "YanheeScannerBridge.lnk"

if (Test-Path $shortcutPath) {
    Remove-Item $shortcutPath -Force
    Write-Host "[OK] ลบ Shortcut ออกจากโฟลเดอร์ Startup เรียบร้อย" -ForegroundColor Green
}

Write-Host "กำลังปิดโปรเซส Scanner Bridge (Port 18000)..." -ForegroundColor Yellow
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
Write-Host "========================================================" -ForegroundColor Green
Write-Host "[SUCCESS] ยกเลิก Auto-Start และหยุดการทำงานเรียบร้อยแล้ว" -ForegroundColor Green
Write-Host "========================================================" -ForegroundColor Green
Write-Host ""

Read-Host "กด Enter เพื่อเสร็จสิ้น..."
