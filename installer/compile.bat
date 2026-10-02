@echo off
color 0D
title ⚖️ Monique Advogados - Compilador
echo.
echo  ═══════════════════════════════════════════════════
echo  ⚖️  MONIQUE ADVOGADOS - Compilador de Instalador
echo  ═══════════════════════════════════════════════════
echo.
echo  Compilando instalador profissional...
echo.

:: Verificar PowerShell
where powershell >nul 2>nul
if %errorlevel% neq 0 (
    echo  ❌ PowerShell não encontrado!
    pause
    exit /b 1
)

:: Instalar módulo ps2exe
echo  [1/3] Instalando módulo de compilação...
powershell -Command "Install-Module -Name ps2exe -Force -SkipPublisherCheck -Scope CurrentUser"
if %errorlevel% neq 0 (
    echo  ⚠️  Tentando método alternativo...
    powershell -Command "Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser -Force"
    powershell -Command "Install-Module -Name ps2exe -Force -SkipPublisherCheck -Scope CurrentUser -AllowClobber"
)
echo  ✅ Módulo instalado
echo.

:: Compilar instalador
echo  [2/3] Compilando instalador.exe...
powershell -Command "& { Import-Module ps2exe; $icon = '$(Get-ChildItem -Path . -Filter *.ico -Recurse | Select-Object -First 1).FullName'; if ($icon) { ps2exe -InputFile 'Instalador.ps1' -OutputFile '..\Instalador.exe' -Title 'Monique Advogados - Instalador' -Description 'Sistema de Gestão Jurídica' -IconFile $icon -Version '1.0.0' -Company 'Monique Advogados' -Copyright '2026 Monique Advogados' -RequireAdministrator } else { ps2exe -InputFile 'Instalador.ps1' -OutputFile '..\Instalador.exe' -Title 'Monique Advogados - Instalador' -Description 'Sistema de Gestão Jurídica' -Version '1.0.0' -Company 'Monique Advogados' -Copyright '2026 Monique Advogados' -RequireAdministrator } }"

if exist "..\Instalador.exe" (
    echo  ✅ Instalador compilado!
) else (
    echo  ❌ Erro na compilação
    echo  Tentando método alternativo...
    powershell -Command "ps2exe .\Instalador.ps1 ..\Instalador.exe -RequireAdministrator"
)

echo.

:: Criar pacote completo
echo  [3/3] Criando pacote de distribuição...
if exist "..\dist" rmdir /s /q ..\dist
mkdir ..\dist
mkdir ..\dist\MoniqueAdvogados

:: Copiar instalador
copy /Y "..\Instalador.exe" "..\dist\"

:: Copiar scripts
copy /Y "run.bat" "..\dist\MoniqueAdvogados\"
copy /Y "stop.bat" "..\dist\MoniqueAdvogados\"
copy /Y "install.bat" "..\dist\MoniqueAdvogados\"

:: Copiar arquivos do sistema
xcopy /E /I /Y "..\backend" "..\dist\MoniqueAdvogados\backend"
xcopy /E /I /Y "..\frontend" "..\dist\MoniqueAdvogados\frontend"

echo  ✅ Pacote criado!
echo.

echo  ═══════════════════════════════════════════════════
echo  ✅ COMPILAÇÃO CONCLUÍDA!
echo  ═══════════════════════════════════════════════════
echo.
echo  📁 Arquivos gerados:
echo     • Instalador.exe (instalador profissional)
echo     • dist\ (pasta completa do sistema)
echo.
echo  📋 Para distribuir:
echo     1. Copie a pasta 'dist' para o destino
echo     2. Execute Instalador.exe
echo     3. Ou execute install.bat manualmente
echo.
pause
