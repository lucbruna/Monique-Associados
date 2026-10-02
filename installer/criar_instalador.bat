@echo off
title Criando Instalador com IExpress
echo.
echo ═══════════════════════════════════════════════════════════
echo  ⚖️  MONIQUE ADVOGADOS - Criador de Instalador
echo ═══════════════════════════════════════════════════════════
echo.
echo Criando script de instalação silencioso...
echo.

:: Criar script SED para IExpress
(
echo [Version]
echo Class=IEXPRESS
echo SDI=0
echo [ShowProgress]
echo 1=1
echo [Installation]
echo ShowProgress=1
echo ShowInstallComplete=1
echo ShowReboot=0
echo Installation=Typical
echo [ExtractionMode]
echo Installed=0
echo [FileList]
echo n=Instalador_Monique_Advogados.bat
echo f1=Instalador_Monique_Advogados.bat
echo f1_flags=
echo [Setup]
echo CmdHide=0
echo SetupTitle=Instalador Monique Advogados
echo SetupText=Instalando Sistema de Gestao Juridica...
echo SetupRegKey=HKEY_CURRENT_USER\Software\MoniqueAdvogados
echo SetupRegValue=Installed
echo SetupRegData=REG_SZ
echo SetupRegValue2=1
echo AppName=Monique Advogados
echo AppVersion=1.0.0
echo AppPublisher=Monique Advogados
echo AppCopyright=2026 Monique Advogados
echo AppURL=https://moniqueadvogados.com
echo AppExeName=run.bat
) > "%TEMP%\iexpress.sed"

echo Script SED criado!
echo.
echo ═══════════════════════════════════════════════════════════
echo INSTRUÇÕES:
echo ═══════════════════════════════════════════════════════════
echo.
echo 1. Execute: iexpress
echo 2. Selecione "Create new SED info file"
echo 3. Package title: "Monique Advogados"
echo 4. Confirmation: "No prompt"
echo 5. License: "No license"
echo 6. Packaged files: Adicione todos os arquivos
echo 7. Install Program: "cmd /c Instalador_Monique_Advogados.bat"
echo 8. Finish: "Default (no reboot)"
echo 9. Salve como: MoniqueAdvogados_Installer.exe
echo.
echo ═══════════════════════════════════════════════════════════
echo.
pause
