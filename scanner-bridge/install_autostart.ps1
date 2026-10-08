Write-Host "========================================================" -ForegroundColor Cyan
Write-Host "  Yanhee DMS: Scanner Bridge Auto-Start Installer" -ForegroundColor Cyan
Write-Host "========================================================" -ForegroundColor Cyan

$scriptDir = $PSScriptRoot

Write-Host "[1/3] Checking dependencies..." -ForegroundColor Yellow
Start-Process -FilePath "pip" -ArgumentList "install -r requirements.txt --quiet" -WorkingDirectory $scriptDir -NoNewWindow -Wait

Write-Host "[2/3] Registering shortcut to Windows Startup..." -ForegroundColor Yellow
$startupFolder = [Environment]::GetFolderPath("Startup")
$shortcutPath = Join-Path $startupFolder "YanheeScannerBridge.lnk"
$wshShell = New-Object -ComObject WScript.Shell
$shortcut = $wshShell.CreateShortcut($shortcutPath)
$shortcut.TargetPath = "wscript.exe"
$shortcut.Arguments = "`"$scriptDir\run_silent.vbs`""
$shortcut.WorkingDirectory = $scriptDir
$shortcut.Save()

Write-Host "[3/3] Launching background service (Port 18000)..." -ForegroundColor Yellow
Start-Process -FilePath "wscript.exe" -ArgumentList "`"$scriptDir\run_silent.vbs`"" -WorkingDirectory $scriptDir

Write-Host ""
Write-Host "========================================================" -ForegroundColor Green
Write-Host "[SUCCESS] Auto-Start configured successfully!" -ForegroundColor Green
Write-Host "- Scanner Bridge is now running in the background (Port 18000)" -ForegroundColor White
Write-Host "- It will start automatically every time this PC turns on." -ForegroundColor Gray
Write-Host "- No command prompt window will be displayed." -ForegroundColor Gray
Write-Host "========================================================" -ForegroundColor Green
Write-Host ""

Read-Host "Press Enter to exit..."
