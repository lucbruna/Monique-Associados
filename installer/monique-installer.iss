; Inno Setup Script - Monique Advogados Installer
; Professional Windows Installer for Law Firm Management System

#define MyAppName "Monique Advogados"
#define MyAppVersion "1.0.1"
#define MyAppPublisher "Monique Advogados"
#define MyAppURL "https://moniqueadvogados.com"
#define MyAppExeName "run.exe"
#define MyAppAssocName "Monique Advogados System"

[Setup]
AppId={{B8F4A3D2-1C5E-4A7B-9D6F-8E2C1A3B5D7F}
AppName={#MyAppName}
AppVersion={#MyAppVersion}
AppPublisher={#MyAppPublisher}
AppPublisherURL={#MyAppURL}
AppSupportURL={#MyAppURL}
AppUpdatesURL={#MyAppURL}

DefaultDirName={localappdata}\MoniqueAdvogados
DefaultGroupName={#MyAppName}
DisableProgramGroupPage=yes

OutputDir=..\dist
OutputBaseFilename=Instalador_Monique_Advogados_v{#MyAppVersion}

Compression=lzma2/max
SolidCompression=yes
InternalCompressLevel=max

PrivilegesRequired=admin
PrivilegesRequiredOverridesAllowed=dialog

SetupIconFile=monique.ico
UninstallDisplayIcon={app}\monique.ico

WizardStyle=modern
WizardSizePercent=100,100
WizardResizable=yes
DisableWelcomePage=no
DisableDirPage=no
DisableFinishedPage=no

ShowLanguageDialog=no
LanguageDetectionMethod=locale

VersionInfoVersion={#MyAppVersion}
VersionInfoCompany={#MyAppPublisher}
VersionInfoDescription={#MyAppAssocName}
VersionInfoTextVersion={#MyAppVersion}

[Languages]
Name: "portuguese"; MessagesFile: "compiler:Languages\BrazilianPortuguese.isl,compiler:Default.isl"

[Tasks]
Name: "desktopicon"; Description: "Criar atalho na Area de Trabalho"; GroupDescription: "Atalhos:"; Flags: checkedonce
Name: "startmenuicon"; Description: "Criar atalho no Menu Iniciar"; GroupDescription: "Atalhos:"; Flags: checkedonce

[Files]
Source: "..\run.exe"; DestDir: "{app}"; Flags: ignoreversion
Source: "..\stop.exe"; DestDir: "{app}"; Flags: ignoreversion
Source: "monique.ico"; DestDir: "{app}"; Flags: ignoreversion
Source: "..\run.bat"; DestDir: "{app}"; Flags: ignoreversion
Source: "..\stop.bat"; DestDir: "{app}"; Flags: ignoreversion

; Backend files (exclude node_modules, logs, uploads and transient journal files).
; O banco dev.db NAO e excluido de proposito: e o banco limpo que acompanha o instalador.
Source: "..\backend\*"; DestDir: "{app}\backend"; Flags: ignoreversion recursesubdirs createallsubdirs; Excludes: "node_modules,logs,uploads,*.db-journal,*.db-wal,*.db-shm"
; Frontend files (exclude node_modules, dist)
Source: "..\frontend\*"; DestDir: "{app}\frontend"; Flags: ignoreversion recursesubdirs createallsubdirs; Excludes: "node_modules,dist"

[Icons]
Name: "{group}\{#MyAppName}"; Filename: "{app}\{#MyAppExeName}"; WorkingDir: "{app}"; IconFilename: "{app}\monique.ico"; Comment: "Iniciar {#MyAppName}"
Name: "{group}\Parar {#MyAppName}"; Filename: "{app}\stop.exe"; WorkingDir: "{app}"; IconFilename: "{app}\monique.ico"; Comment: "Parar {#MyAppName}"
Name: "{group}\Desinstalar {#MyAppName}"; Filename: "{uninstallexe}"; IconFilename: "{app}\monique.ico"
Name: "{autodesktop}\{#MyAppName}"; Filename: "{app}\{#MyAppExeName}"; WorkingDir: "{app}"; IconFilename: "{app}\monique.ico"; Tasks: desktopicon; Comment: "Iniciar {#MyAppName}"

[Run]
Filename: "{cmd}"; Parameters: "/c cd /d ""{app}\backend"" && npm install --legacy-peer-deps --no-audit --no-fund"; StatusMsg: "Instalando dependencias do backend..."; Flags: runhidden; WorkingDir: "{app}\backend"; AfterInstall: UpdateProgress(25)
Filename: "{cmd}"; Parameters: "/c cd /d ""{app}\frontend"" && npm install --legacy-peer-deps --no-audit --no-fund"; StatusMsg: "Instalando dependencias do frontend..."; Flags: runhidden; WorkingDir: "{app}\frontend"; AfterInstall: UpdateProgress(50)
Filename: "{cmd}"; Parameters: "/c cd /d ""{app}\backend"" && npx prisma generate"; StatusMsg: "Gerando Prisma Client..."; Flags: runhidden; WorkingDir: "{app}\backend"; AfterInstall: UpdateProgress(60)
Filename: "{cmd}"; Parameters: "/c cd /d ""{app}\backend"" && npx prisma db push"; StatusMsg: "Configurando banco de dados..."; Flags: runhidden; WorkingDir: "{app}\backend"; AfterInstall: UpdateProgress(80)
Filename: "{sys}\taskkill.exe"; Parameters: "/F /IM node.exe"; StatusMsg: "Parando processos existentes..."; Flags: runhidden skipifsilent; AfterInstall: UpdateProgress(96)
Filename: "{app}\{#MyAppExeName}"; Description: "Iniciar {#MyAppName} agora"; Flags: nowait postinstall skipifsilent; WorkingDir: "{app}"

[Code]
var
  ProgressPage: TOutputProgressWizardPage;

procedure UpdateProgress(Percent: Integer);
begin
  if ProgressPage <> nil then
    ProgressPage.SetProgress(Percent, 100);
end;

procedure InitializeWizard;
begin
  ProgressPage := CreateOutputProgressPage('Instalando...', 'Aguarde enquanto o sistema e configurado.');
end;

procedure CurStepChanged(CurStep: TSetupStep);
begin
  if CurStep = ssPostInstall then
  begin
    ProgressPage.Show;
    try
      ProgressPage.SetProgress(0, 100);
      ProgressPage.Msg1Label.Caption := 'Preparando ambiente...';
      Sleep(500);
    finally
      ProgressPage.Hide;
    end;
  end;
end;

[CustomMessages]
portuguese.FinishedHeadingLabel={#MyAppName} instalado com sucesso!
portuguese.FinishedLabelNoRun=O sistema foi instalado com sucesso. Clique em Concluir para sair do instalador.
