' MoneyForward MCP HTTP Server — Hidden Window Launcher
' Place a shortcut to this file in shell:startup for auto-start on login

Set WshShell = CreateObject("WScript.Shell")
WshShell.Run "cmd /c """ & WshShell.CurrentDirectory & "\start-mcp-server.bat"""", 0, False
Set WshShell = Nothing
