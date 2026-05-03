@echo off
setlocal

:: MoneyForward MCP HTTP Server Launcher
:: Place a shortcut to this file in shell:startup for auto-start on login

set DB_PATH=C:\Users\s1180\Documents\repositories\mf-workspace\data\moneyforward.db
set MCP_HTTP_PORT=3001
set MCP_HTTP_HOST=127.0.0.1

cd /d "%~dp0"

node dist\http.cjs

endlocal
