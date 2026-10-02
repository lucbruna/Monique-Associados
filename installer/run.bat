@echo off
color 0A
title ⚖️ Monique Advogados - Iniciando Sistema
echo.
echo  ═══════════════════════════════════════════════════
echo  ⚖️  MONIQUE ADVOGADOS - Sistema de Gestão Jurídica
echo  ═══════════════════════════════════════════════════
echo.
echo  Iniciando sistema...
echo.

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
    echo  ❌ Node.js não encontrado! Instale em https://nodejs.org
    pause
    exit /b 1
)

:: Verificar npm
where npm >nul 2>nul
if %errorlevel% neq 0 (
    echo  ❌ npm não encontrado! Instale Node.js em https://nodejs.org
    pause
    exit /b 1
)

echo  ✅ Node.js encontrado
echo.

:: Instalar dependências do backend se necessário
if not exist "backend\node_modules" (
    echo  📦 Instalando dependências do backend...
    cd backend
    call npm install --legacy-peer-deps
    cd ..
    echo  ✅ Backend instalado
)

:: Instalar dependências do frontend se necessário
if not exist "frontend\node_modules" (
    echo  📦 Instalando dependências do frontend...
    cd frontend
    call npm install --legacy-peer-deps
    cd ..
    echo  ✅ Frontend instalado
)

echo.
echo  ═══════════════════════════════════════════════════
echo  🚀 Iniciando Backend (http://localhost:3001)
echo  ═══════════════════════════════════════════════════
echo.

:: Iniciar backend em nova janela
start "⚖️ Monique Advogados - Backend" cmd /k "cd backend && npm run dev"

:: Aguardar backend iniciar
timeout /t 5 /nobreak >nul

echo  ═══════════════════════════════════════════════════
echo  🌐 Iniciando Frontend (http://localhost:3000)
echo  ═══════════════════════════════════════════════════
echo.

:: Iniciar frontend em nova janela
start "⚖️ Monique Advogados - Frontend" cmd /k "cd frontend && npm run dev"

:: Aguardar frontend iniciar
timeout /t 8 /nobreak >nul

echo  ═══════════════════════════════════════════════════
echo  ✅ SISTEMA INICIADO COM SUCESSO!
echo  ═══════════════════════════════════════════════════
echo.
echo  🌐 Acesse: http://localhost:3000
echo.
echo  📋 CREDENCIAIS:
echo  ─────────────────────────────────────────────────
echo  👑 SUPER ADMIN: monique@moniqueadvogados.com
echo  👑 SÓCIO: ricardo@moniqueadvogados.com
echo  📧 Senha para todos: senha123
echo  ─────────────────────────────────────────────────
echo.
echo  ⚠️  Para fechar o sistema, feche as janelas do backend e frontend
echo.
pause
