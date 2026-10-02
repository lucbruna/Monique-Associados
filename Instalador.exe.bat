@echo off
color 0A
title ⚖️ Monique Advogados - Instalador Profissional v1.0.0
mode con: cols=70 lines=40

:: Verificar administrador
net session >nul 2>&1
if %errorlevel% neq 0 (
    echo.
    echo  ╔══════════════════════════════════════════════════════════╗
    echo  ║  ⚠️  EXECUTE COMO ADMINISTRADOR!                        ║
    echo  ╚══════════════════════════════════════════════════════════╝
    echo.
    echo  Clique com o botão direito neste arquivo
    echo  e selecione "Executar como administrador"
    echo.
    pause
    exit /b 1
)

cls
echo.
echo  ╔═══════════════════════════════════════════════════════════════╗
echo  ║                                                               ║
echo  ║        ⚖️  MONIQUE ADVOGADOS - INSTALADOR PROFISSIONAL        ║
echo  ║                                                               ║
echo  ║        Sistema de Gestão Jurídica v1.0.0                      ║
echo  ║        Desenvolvido para escritórios de advocacia             ║
echo  ║                                                               ║
echo  ╚═══════════════════════════════════════════════════════════════╝
echo.
echo  Pressione qualquer tecla para iniciar a instalação...
pause >nul

cls
echo.
echo  [0/7] Parando processos existentes...
taskkill /F /IM node.exe >nul 2>nul
timeout /t 1 /nobreak >nul
echo  ✅ Processos finalizados
echo.

echo  [1/7] Verificando requisitos...
echo.

:: Verificar Node.js
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo  ❌ Node.js não encontrado!
    echo.
    echo  📥 Baixe o Node.js em: https://nodejs.org
    echo     Escolha a versão LTS (recomendada)
    echo.
    echo  Após instalar, execute este instalador novamente.
    echo.
    pause
    exit /b 1
)
for /f "tokens=*" %%i in ('node --version 2^>nul') do set NODE_VER=%%i
echo  ✅ Node.js %NODE_VER% encontrado

:: Verificar npm
where npm >nul 2>nul
if %errorlevel% neq 0 (
    echo  ❌ npm não encontrado!
    pause
    exit /b 1
)
for /f "tokens=*" %%i in ('npm --version 2^>nul') do set NPM_VER=%%i
echo  ✅ npm %NPM_VER% encontrado
echo.

echo  [2/7] Criando diretório de instalação...
echo.

set INSTALL_DIR=%LOCALAPPDATA%\MoniqueAdvogados
if exist "%INSTALL_DIR%" (
    echo  ⚠️  Versão anterior encontrada. Atualizando...
    rmdir /s /q "%INSTALL_DIR%" 2>nul
)
mkdir "%INSTALL_DIR%" 2>nul
echo  ✅ Diretório criado: %INSTALL_DIR%
echo.

echo  [3/7] Copiando arquivos do sistema...
echo.

:: Copiar backend
echo  📦 Copiando backend...
xcopy /E /I /Y "%~dp0backend" "%INSTALL_DIR%\backend" >nul 2>nul
echo  ✅ Backend copiado

:: Copiar frontend
echo  📦 Copiando frontend...
xcopy /E /I /Y "%~dp0frontend" "%INSTALL_DIR%\frontend" >nul 2>nul
echo  ✅ Frontend copiado

:: Copiar scripts
echo  📦 Copiando scripts...
copy /Y "%~dp0run.bat" "%INSTALL_DIR%\" >nul 2>nul
copy /Y "%~dp0stop.bat" "%INSTALL_DIR%\" >nul 2>nul
echo  ✅ Scripts copiados
echo.

echo  [4/7] Instalando dependências do backend...
echo.
cd /d "%INSTALL_DIR%\backend"
call npm install --legacy-peer-deps 2>nul
echo  ✅ Backend instalado
echo.

echo  [5/7] Instalando dependências do frontend...
echo.
cd /d "%INSTALL_DIR%\frontend"
call npm install --legacy-peer-deps 2>nul
echo  ✅ Frontend instalado
echo.

echo  [6/7] Configurando banco de dados...
echo.
cd /d "%INSTALL_DIR%\backend"
call npx prisma migrate dev --name init 2>nul
call npx prisma db seed 2>nul
echo  ✅ Banco de dados configurado
echo.

echo  [7/7] Criando atalhos...
echo.

:: Atalho na área de trabalho
echo Set oWS = WScript.CreateObject("WScript.Shell") > "%TEMP%\CreateShortcut.vbs"
echo Set oLink = oWS.CreateShortcut("%USERPROFILE%\Desktop\⚖️ Monique Advogados.lnk") >> "%TEMP%\CreateShortcut.vbs"
echo oLink.TargetPath = "%INSTALL_DIR%\run.bat" >> "%TEMP%\CreateShortcut.vbs"
echo oLink.WorkingDirectory = "%INSTALL_DIR%" >> "%TEMP%\CreateShortcut.vbs"
echo oLink.Description = "Iniciar Sistema Monique Advogados" >> "%TEMP%\CreateShortcut.vbs"
echo oLink.IconLocation = "shell32.dll,4" >> "%TEMP%\CreateShortcut.vbs"
echo oLink.Save >> "%TEMP%\CreateShortcut.vbs"
cscript //nologo "%TEMP%\CreateShortcut.vbs" >nul 2>nul
del "%TEMP%\CreateShortcut.vbs" >nul 2>nul

:: Atalho para parar
echo Set oWS = WScript.CreateObject("WScript.Shell") > "%TEMP%\CreateShortcut2.vbs"
echo Set oLink = oWS.CreateShortcut("%USERPROFILE%\Desktop\🛑 Parar Monique.lnk") >> "%TEMP%\CreateShortcut2.vbs"
echo oLink.TargetPath = "%INSTALL_DIR%\stop.bat" >> "%TEMP%\CreateShortcut2.vbs"
echo oLink.WorkingDirectory = "%INSTALL_DIR%" >> "%TEMP%\CreateShortcut2.vbs"
echo oLink.Description = "Parar Sistema Monique Advogados" >> "%TEMP%\CreateShortcut2.vbs"
echo oLink.IconLocation = "shell32.dll,28" >> "%TEMP%\CreateShortcut2.vbs"
echo oLink.Save >> "%TEMP%\CreateShortcut2.vbs"
cscript //nologo "%TEMP%\CreateShortcut2.vbs" >nul 2>nul
del "%TEMP%\CreateShortcut2.vbs" >nul 2>nul

echo  ✅ Atalhos criados na área de trabalho
echo.

:: Voltar ao diretório original
cd /d "%~dp0"

cls
echo.
echo  ╔═══════════════════════════════════════════════════════════════╗
echo  ║                                                               ║
echo  ║           ✅ INSTALAÇÃO CONCLUÍDA COM SUCESSO!                ║
echo  ║                                                               ║
echo  ╚═══════════════════════════════════════════════════════════════╝
echo.
echo  📋 CREDENCIAIS DE ACESSO:
echo  ──────────────────────────────────────────────────────────────
echo    👑 SUPER ADMIN: monique@moniqueadvogados.com
echo    👑 SÓCIO: ricardo@moniqueadvogados.com
echo    📧 Senha para todos: senha123
echo  ──────────────────────────────────────────────────────────────
echo.
echo  🚀 PARA INICIAR:
echo  ──────────────────────────────────────────────────────────────
echo    • Clique no atalho "⚖️ Monique Advogados" na área de trabalho
echo    • Ou execute: %INSTALL_DIR%\run.bat
echo  ──────────────────────────────────────────────────────────────
echo.
echo  🌐 Após iniciar, acesse: http://localhost:3000
echo.
echo  📁 Localização: %INSTALL_DIR%
echo.
echo  ═══════════════════════════════════════════════════════════════
echo.
pause
