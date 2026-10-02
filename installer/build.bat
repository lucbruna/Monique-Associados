@echo off
color 0B
title ⚖️ Monique Advogados - Build Profissional
echo.
echo  ═══════════════════════════════════════════════════
echo  ⚖️  MONIQUE ADVOGADOS - Build Profissional
echo  ═══════════════════════════════════════════════════
echo.

:: Verificar Node.js
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo  ❌ Node.js não encontrado!
    pause
    exit /b 1
)

echo  📦 Iniciando build do sistema...
echo.

:: Criar pasta de build
if exist "dist" rmdir /s /q dist
mkdir dist
mkdir dist\MoniqueAdvogados

echo  🔧 Build do Backend...
cd backend
call npm run build
if %errorlevel% neq 0 (
    echo  ❌ Erro no build do backend!
    pause
    exit /b 1
)
cd ..

echo  🔧 Build do Frontend...
cd frontend
call npm run build
if %errorlevel% neq 0 (
    echo  ❌ Erro no build do frontend!
    pause
    exit /b 1
)
cd ..

echo  📋 Copiando arquivos...

:: Copiar backend
xcopy /E /I /Y backend\dist dist\MoniqueAdvogados\backend\dist
xcopy /E /I /Y backend\prisma dist\MoniqueAdvogados\backend\prisma
xcopy /E /I /Y backend\node_modules dist\MoniqueAdvogados\backend\node_modules
copy /Y backend\package.json dist\MoniqueAdvogados\backend\
copy /Y backend\.env dist\MoniqueAdvogados\backend\

:: Copiar frontend build
xcopy /E /I /Y frontend\dist dist\MoniqueAdvogados\frontend\dist
copy /Y frontend\package.json dist\MoniqueAdvogados\frontend\

:: Copiar scripts
copy /Y installer\run.bat dist\MoniqueAdvogados\
copy /Y installer\stop.bat dist\MoniqueAdvogados\
copy /Y installer\install.bat dist\MoniqueAdvogados\

:: Criar script de inicialização para produção
echo @echo off > dist\MoniqueAdvogados\Iniciar.bat
echo title ⚖️ Monique Advogados >> dist\MoniqueAdvogados\Iniciar.bat
echo cd backend >> dist\MoniqueAdvogados\Iniciar.bat
echo start "Backend" cmd /k "node dist/server.js" >> dist\MoniqueAdvogados\Iniciar.bat
echo timeout /t 3 /nobreak ^>nul >> dist\MoniqueAdvogados\Iniciar.bat
echo cd .. >> dist\MoniqueAdvogados\Iniciar.bat
echo echo Acesse: http://localhost:3000 >> dist\MoniqueAdvogados\Iniciar.bat
echo pause >> dist\MoniqueAdvogados\Iniciar.bat

echo.
echo  ═══════════════════════════════════════════════════
echo  ✅ BUILD CONCLUÍDO!
echo  ═══════════════════════════════════════════════════
echo.
echo  📁 Pasta de build: dist\MoniqueAdvogados
echo.
echo  📋 Para distribuir:
echo     1. Copie a pasta dist\MoniqueAdvogados
echo     2. Execute install.bat no destino
echo     3. Execute Iniciar.bat para usar
echo.
pause
