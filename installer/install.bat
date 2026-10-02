@echo off
color 0E
title ⚖️ Monique Advogados - Instalador
echo.
echo  ═══════════════════════════════════════════════════════════
echo  ⚖️  MONIQUE ADVOGADOS - Instalador Profissional
echo  ═══════════════════════════════════════════════════════════
echo.
echo  Sistema de Gestão Jurídica v1.0.0
echo  Desenvolvido para escritórios de advocacia
echo.
echo  ═══════════════════════════════════════════════════════════
echo.

:: Verificar Node.js
echo  [1/5] Verificando Node.js...
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo  ❌ Node.js não encontrado!
    echo.
    echo  📥 Baixe o Node.js em: https://nodejs.org
    echo     Escolha a versão LTS (recomendada)
    echo.
    pause
    exit /b 1
)
for /f "tokens=*" %%i in ('node --version') do set NODE_VER=%%i
echo  ✅ Node.js %NODE_VER% encontrado
echo.

:: Verificar npm
echo  [2/5] Verificando npm...
where npm >nul 2>nul
if %errorlevel% neq 0 (
    echo  ❌ npm não encontrado!
    pause
    exit /b 1
)
for /f "tokens=*" %%i in ('npm --version') do set NPM_VER=%%i
echo  ✅ npm %NPM_VER% encontrado
echo.

:: Instalar dependências do backend
echo  [3/5] Instalando backend...
cd backend
call npm install --legacy-peer-deps
if %errorlevel% neq 0 (
    echo  ❌ Erro ao instalar backend!
    pause
    exit /b 1
)
cd ..
echo  ✅ Backend instalado
echo.

:: Instalar dependências do frontend
echo  [4/5] Instalando frontend...
cd frontend
call npm install --legacy-peer-deps
if %errorlevel% neq 0 (
    echo  ❌ Erro ao instalar frontend!
    pause
    exit /b 1
)
cd ..
echo  ✅ Frontend instalado
echo.

:: Configurar banco de dados
echo  [5/5] Configurando banco de dados...
cd backend
call npx prisma migrate dev --name init
call npx prisma db seed
cd ..
echo  ✅ Banco de dados configurado
echo.

echo  ═══════════════════════════════════════════════════════════
echo  ✅ INSTALAÇÃO CONCLUÍDA COM SUCESSO!
echo  ═══════════════════════════════════════════════════════════
echo.
echo  🚀 Para iniciar o sistema, execute: run.bat
echo.
echo  📋 CREDENCIAIS DE ACESSO:
echo  ─────────────────────────────────────────────────────────
echo  👑 SUPER ADMIN: monique@moniqueadvogados.com
echo  👑 SÓCIO: ricardo@moniqueadvogados.com
echo  📧 Senha para todos: senha123
echo  ─────────────────────────────────────────────────────────
echo.
echo  🌐 Após iniciar, acesse: http://localhost:3000
echo.
pause
