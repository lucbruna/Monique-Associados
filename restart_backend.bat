@echo off
color 0E
title ⚖️ Monique Advogados - Reinicializacao do Backend

echo.
echo  ╔═══════════════════════════════════════════════════════════════╗
echo  ║                                                               ║
echo  ║     ⚖️  MONIQUE ADVOGADOS - Reinicializacao do Sistema       ║
echo  ║                                                               ║
echo  ╚═══════════════════════════════════════════════════════════════╝
echo.

:: Matar TODOS os processos Node.js
echo  ⏹️  Encerrando processos Node.js...
for /f "tokens=2" %%a in ('tasklist /FI "IMAGENAME eq node.exe" /NH') do (
    taskkill /F /PID %%a >nul 2>nul
)
echo  ✅ Todos os processos Node.js encerrados
echo.

:: Aguardar liberacao
timeout /t 5 /nobreak >nul

:: Verificar se a porta 3001 esta livre
netstat -ano | find ":3001" >nul 2>nul
if %errorlevel% equ 0 (
    echo  ⚠️  Processo fantasma na porta 3001
    echo  🔄 Tentando forcar liberacao...
    for /f "tokens=5" %%a in ('netstat -ano ^| find ":3001"') do (
        taskkill /F /PID %%a >nul 2>nul
    )
    timeout /t 3 /nobreak >nul
)

:: Verificar porta
netstat -ano | find ":3001" >nul 2>nul
if %errorlevel% equ 0 (
    echo  ❌ Porta 3001 ainda ocupada!
    echo  ⚠️  Feche manualmente o processo PID:
    netstat -ano | find ":3001"
    pause
    exit /b 1
) else (
    echo  ✅ Porta 3001 livre
)

echo.

:: Limpar cache do ts-node
if exist "%LOCALAPPDATA%\node_modules\.cache\ts-node" (
    rmdir /s /q "%LOCALAPPDATA%\node_modules\.cache\ts-node" 2>nul
    echo  ✅ Cache ts-node limpo
)

echo.
echo  🚀 Iniciando Backend na porta 3001...
echo.
start "⚖️ Monique - Backend" cmd /k "cd /d "%~dp0backend" && npm run dev"

:: Aguardar backend
echo  ⏳ Aguardando backend iniciar...
timeout /t 12 /nobreak >nul

:: Testar
echo.
echo  🔍 Verificando backend...
powershell -Command "try { $r = Invoke-WebRequest 'http://localhost:3001/api/health' -UseBasicParsing -TimeoutSec 5; if ($r.StatusCode -eq 200) { Write-Host '  ✅ Backend OK!' -ForegroundColor Green } } catch { Write-Host '  ❌ Backend nao respondeu' -ForegroundColor Red }"

echo.
echo  ═══════════════════════════════════════════════════════════════
echo  ✅ Reincializacao concluida!
echo  ═══════════════════════════════════════════════════════════════
echo.
pause
