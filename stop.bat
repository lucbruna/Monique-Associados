@echo off
color 0C
title ⚖️ Monique Advogados - Parar Sistema
mode con: cols=70 lines=30

cls
echo.
echo  ╔═══════════════════════════════════════════════════════════════╗
echo  ║                                                               ║
echo  ║           🛑 MONIQUE ADVOGADOS - Parando Sistema              ║
echo  ║                                                               ║
echo  ╚═══════════════════════════════════════════════════════════════╝
echo.

echo  ⏹️  Parando processos Node.js...
echo.

:: Matar processos node (backend e frontend)
taskkill /F /IM node.exe >nul 2>nul
if %errorlevel% eq 0 (
    echo  ✅ Processos Node.js finalizados
) else (
    echo  ℹ️  Nenhum processo Node.js encontrado
)

:: Matar processos do cmd que rodavam npm
taskkill /F /FI "WINDOWTITLE eq ⚖️ Monique*" >nul 2>nul

echo.
echo  ═══════════════════════════════════════════════════════════════
echo  ✅ Sistema parado com sucesso!
echo  ═══════════════════════════════════════════════════════════════
echo.
echo  Para reiniciar, execute: run.bat
echo.
pause
