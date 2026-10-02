@echo off
color 0A
title ⚖️ Monique Advogados - Iniciando Sistema
mode con: cols=70 lines=35

cls
echo.
echo  ╔═══════════════════════════════════════════════════════════════╗
echo  ║                                                               ║
echo  ║           ⚖️  MONIQUE ADVOGADOS - Iniciando Sistema           ║
echo  ║                                                               ║
echo  ╚═══════════════════════════════════════════════════════════════╝
echo.

:: Definir diretório do projeto
set PROJECT_DIR=%~dp0

:: Parar processos existentes nas portas 3000 e 3001
echo  🔍 Verificando portas...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3001') do (
    taskkill /F /PID %%a >nul 2>nul
)
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3000') do (
    taskkill /F /PID %%a >nul 2>nul
)
timeout /t 1 /nobreak >nul
echo  ✅ Portas liberadas
echo.

:: Verificar Node.js
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo  ❌ Node.js não encontrado!
    echo.
    echo  📥 Baixe o Node.js em: https://nodejs.org
    pause
    exit /b 1
)

echo  ✅ Node.js encontrado
echo.

:: Verificar se as dependências estão instaladas
if not exist "%PROJECT_DIR%backend\node_modules" (
    echo  📦 Instalando dependências do backend...
    cd /d "%PROJECT_DIR%backend"
    call npm install --legacy-peer-deps
    echo  ✅ Backend instalado
)

if not exist "%PROJECT_DIR%frontend\node_modules" (
    echo  📦 Instalando dependências do frontend...
    cd /d "%PROJECT_DIR%frontend"
    call npm install --legacy-peer-deps
    echo  ✅ Frontend instalado
)

echo.
echo  ═══════════════════════════════════════════════════════════════
echo  🚀 Iniciando Backend (http://localhost:3001)
echo  ═══════════════════════════════════════════════════════════════
echo.

:: Iniciar backend em nova janela
start "⚖️ Monique - Backend" cmd /k "cd /d "%PROJECT_DIR%backend" && npm run dev"

:: Aguardar backend iniciar
timeout /t 8 /nobreak >nul

echo  ═══════════════════════════════════════════════════════════════
echo  🌐 Iniciando Frontend (http://localhost:3000)
echo  ═══════════════════════════════════════════════════════════════
echo.

:: Iniciar frontend em nova janela
start "⚖️ Monique - Frontend" cmd /k "cd /d "%PROJECT_DIR%frontend" && npm run dev"

:: Aguardar frontend iniciar
timeout /t 10 /nobreak >nul

cls
echo.
echo  ╔═══════════════════════════════════════════════════════════════╗
echo  ║                                                               ║
echo  ║              ✅ SISTEMA INICIADO COM SUCESSO!                 ║
echo  ║                                                               ║
echo  ╚═══════════════════════════════════════════════════════════════╝
echo.
echo  🌐 Acesse: http://localhost:3000
echo.
echo  📋 CREDENCIAIS:
echo  ──────────────────────────────────────────────────────────────
echo    👑 SUPER ADMIN: monique@moniqueadvogados.com
echo    👑 SÓCIO: ricardo@moniqueadvogados.com
echo    📧 Senha para todos: senha123
echo  ──────────────────────────────────────────────────────────────
echo.
echo  ⚠️  Para fechar o sistema:
echo     • Feche as janelas do Backend e Frontend
echo     • Ou execute: stop.bat
echo.
echo  ═══════════════════════════════════════════════════════════════
echo.
pause
