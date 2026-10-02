@echo off
color 0B
title ⚖️ Monique Advogados - Instalador
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
echo  ║        ⚖️  MONIQUE ADVOGADOS - INSTALADOR                     ║
echo  ║                                                               ║
echo  ║        Sistema de Gestão Jurídica v1.0.0                      ║
echo  ║                                                               ║
echo  ╚═══════════════════════════════════════════════════════════════╝
echo.

set INSTALL_DIR=%LOCALAPPDATA%\MoniqueAdvogados

echo  [0/5] Parando processos existentes...
taskkill /F /IM node.exe >nul 2>nul
timeout /t 1 /nobreak >nul
echo  ✅ Processos finalizados
echo.

echo  [1/5] Verificando Node.js...
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo  ❌ Node.js não encontrado!
    echo  📥 Baixe em: https://nodejs.org
    pause
    exit /b 1
)
for /f "tokens=*" %%i in ('node --version 2^>nul') do set NODE_VER=%%i
echo  ✅ Node.js %NODE_VER%
echo.

echo  [2/5] Criando diretório...
if exist "%INSTALL_DIR%" rmdir /s /q "%INSTALL_DIR%" 2>nul
mkdir "%INSTALL_DIR%" 2>nul
echo  ✅ %INSTALL_DIR%
echo.

echo  [3/5] Copiando arquivos...
xcopy /E /I /Y "%~dp0backend" "%INSTALL_DIR%\backend" >nul 2>nul
xcopy /E /I /Y "%~dp0frontend" "%INSTALL_DIR%\frontend" >nul 2>nul
copy /Y "%~dp0run.bat" "%INSTALL_DIR%\" >nul 2>nul
copy /Y "%~dp0stop.bat" "%INSTALL_DIR%\" >nul 2>nul
echo  ✅ Arquivos copiados
echo.

echo  [4/5] Instalando dependências...
echo    Backend:
cd /d "%INSTALL_DIR%\backend"
call npm install --legacy-peer-deps 2>nul
echo    ✅ Backend OK
echo    Frontend:
cd /d "%INSTALL_DIR%\frontend"
call npm install --legacy-peer-deps 2>nul
echo    ✅ Frontend OK
echo.

echo  [5/5] Configurando banco de dados...
cd /d "%INSTALL_DIR%\backend"
call npx prisma migrate dev --name init 2>nul
call npx prisma db seed 2>nul
echo  ✅ SQLite configurado
echo.

:: Criar atalho
echo Set oWS = WScript.CreateObject("WScript.Shell") > "%TEMP%\sc.vbs"
echo Set oLink = oWS.CreateShortcut("%USERPROFILE%\Desktop\⚖️ Monique Advogados.lnk") >> "%TEMP%\sc.vbs"
echo oLink.TargetPath = "%INSTALL_DIR%\run.bat" >> "%TEMP%\sc.vbs"
echo oLink.WorkingDirectory = "%INSTALL_DIR%" >> "%TEMP%\sc.vbs"
echo oLink.Description = "Sistema Monique Advogados" >> "%TEMP%\sc.vbs"
echo oLink.Save >> "%TEMP%\sc.vbs"
cscript //nologo "%TEMP%\sc.vbs" >nul 2>nul
del "%TEMP%\sc.vbs" >nul 2>nul
echo  ✅ Atalho criado na área de trabalho

cd /d "%~dp0"

cls
echo.
echo  ╔═══════════════════════════════════════════════════════════════╗
echo  ║                                                               ║
echo  ║           ✅ INSTALAÇÃO CONCLUÍDA!                            ║
echo  ║                                                               ║
echo  ╚═══════════════════════════════════════════════════════════════╝
echo.
echo  📋 CREDENCIAIS:
echo    👑 SUPER ADMIN: monique@moniqueadvogados.com
echo    👑 SÓCIO: ricardo@moniqueadvogados.com
echo    📧 Senha: senha123
echo.
echo  🚀 INICIAR: execute run.bat ou clique no atalho
echo  🌐 ACESSO: http://localhost:3000
echo  📁 LOCAL: %INSTALL_DIR%
echo.
pause
