@echo off
color 0C
title ⚖️ Monique Advogados - Parar Sistema
echo.
echo  ═══════════════════════════════════════════════════
echo  ⚖️  MONIQUE ADVOGADOS - Parando Sistema
echo  ═══════════════════════════════════════════════════
echo.
echo  Parando processos...
echo.

:: Matar processos Node.js
taskkill /F /IM node.exe /T >nul 2>nul

echo  ✅ Todos os processos foram finalizados!
echo.
pause
