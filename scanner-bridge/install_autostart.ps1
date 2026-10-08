[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

Write-Host "========================================================" -ForegroundColor Cyan
Write-Host "  Yanhee DMS: ติดตั้ง Scanner Bridge ให้เปิดอัตโนมัติ" -ForegroundColor Cyan
Write-Host "========================================================" -ForegroundColor Cyan

$scriptDir = $PSScriptRoot

Write-Host "[1/3] กำลังตรวจสอบ Dependencies..." -ForegroundColor Yellow
Start-Process -FilePath "pip" -ArgumentList "install -r requirements.txt --quiet" -WorkingDirectory $scriptDir -NoNewWindow -Wait

Write-Host "[2/3] กำลังสร้าง Shortcut ลงใน Windows Startup..." -ForegroundColor Yellow
$startupFolder = [Environment]::GetFolderPath("Startup")
$shortcutPath = Join-Path $startupFolder "YanheeScannerBridge.lnk"
$wshShell = New-Object -ComObject WScript.Shell
$shortcut = $wshShell.CreateShortcut($shortcutPath)
$shortcut.TargetPath = "wscript.exe"
$shortcut.Arguments = "`"$scriptDir\run_silent.vbs`""
$shortcut.WorkingDirectory = $scriptDir
$shortcut.Save()

Write-Host "[3/3] กำลังเปิดเซอร์วิสในพื้นหลัง (Port 18000)..." -ForegroundColor Yellow
Start-Process -FilePath "wscript.exe" -ArgumentList "`"$scriptDir\run_silent.vbs`"" -WorkingDirectory $scriptDir

Write-Host ""
Write-Host "========================================================" -ForegroundColor Green
Write-Host "[SUCCESS] ติดตั้งระบบ Auto-Start สำเร็จเรียบร้อย!" -ForegroundColor Green
Write-Host "• บริการ Scanner Bridge กำลังทำงานในพื้นหลัง (Port 18000)" -ForegroundColor White
Write-Host "• เมื่อเปิดเครื่องใหม่ในครั้งถัดไป ระบบจะเริ่มทำงานอัตโนมัติ" -ForegroundColor Gray
Write-Host "• ไม่มีหน้าต่างดำ CMD ปรากฏกวนใจระหว่างการทำงาน" -ForegroundColor Gray
Write-Host "========================================================" -ForegroundColor Green
Write-Host ""

Read-Host "กด Enter เพื่อเสร็จสิ้น..."

