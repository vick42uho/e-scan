Set WshShell = CreateObject("WScript.Shell")
strCurDir = CreateObject("Scripting.FileSystemObject").GetParentFolderName(WScript.ScriptFullName)
WshShell.CurrentDirectory = strCurDir

' Launch FastAPI Uvicorn quietly in background (Window style 0 = Hidden)
WshShell.Run "cmd /c python -m uvicorn scan_bridge:app --host 127.0.0.1 --port 18000", 0, False
